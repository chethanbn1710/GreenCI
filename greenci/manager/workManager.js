const runPipeline = require("../pipeline/pipelineManager")
const { exec } = require("child_process")
const fs = require("fs")
const path = require("path")
const Job = require("../models/jobs.js")

const {
  getAvailableWorker,
  assignWorker,
  releaseWorker
} = require("../workers/workerPool")
const jobStore = require("../store/jobStore")
const axios = require("axios")


/* ================= FORCE REMOVE DIR (Windows-safe, with retry) ================= */
function forceRemoveDir(dirPath) {
  if (!fs.existsSync(dirPath)) return
  try {
    fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 })
  } catch (err) {
    console.warn(`Warning: Could not fully clean workspace ${dirPath}: ${err.code}`)
  }
}


/* ================= STAGE UPDATE HELPER ================= */
async function updateStage(jobId, stageName, status) {
  try {
    await Job.updateOne(
      { _id: jobId, "stages.name": stageName },
      { $set: { "stages.$.status": status } }
    )
    console.log(`Stage ${stageName} → ${status} for job ${jobId}`)
  } catch (err) {
    console.error(`Failed to update stage ${stageName}:`, err)
  }
}


/* ================= EXECUTE JOB ================= */
async function executeJob(job, worker) {
  console.log(`Worker ${worker.id} started executing Job ${job._id}`)
  const repoUrl = job.clone_url
  const workspace = path.join(__dirname, "..", "workspace", `job-${job._id}`)

  /* Clean old workspace */
  if (fs.existsSync(workspace)) {
    forceRemoveDir(workspace)
  }
  fs.mkdirSync(workspace, { recursive: true })
  console.log(`Cloning repo for Job ${job._id}...`)

  /* START CLONE STAGE */
  await updateStage(job._id, "clone", "RUNNING")

  exec(`git clone ${repoUrl} .`, { cwd: workspace }, async (err, stdout, stderr) => {
    if (err) {
      console.log("Clone error output:", stderr)
      console.log(`Clone failed for Job ${job._id}`)
      await updateStage(job._id, "clone", "FAILED")
      await jobStore.updateJobStatus(job._id, "FAILED")
      releaseWorker(worker)
      return
    }

    console.log(`Repo cloned for Job ${job._id}`)
    await updateStage(job._id, "clone", "COMPLETED")

    // Fetch fresh job document from DB before running pipeline
    const freshJob = await Job.findById(job._id)
    await runPipeline(freshJob, workspace)
    monitorJobCompletion(freshJob, worker)
  })
}


/* ================= MONITOR PIPELINE COMPLETION ================= */
function monitorJobCompletion(job, worker) {
  const interval = setInterval(async () => {
    // Refresh job status from DB
    const freshJob = await Job.findById(job._id)
    
    if (freshJob.status === "COMPLETED" || freshJob.status === "FAILED") {
      console.log(`Releasing worker ${worker.id} for Job ${job._id}`)
      releaseWorker(worker)
      clearInterval(interval)
      cleanupWorkspaces()
    }
  }, 1000)
}


/* ================= CLEANUP OLD WORKSPACES ================= */
function cleanupWorkspaces() {
  const WORKSPACE_ROOT = path.join(__dirname, "..", "workspace")
  if (!fs.existsSync(WORKSPACE_ROOT)) return

  const folders = fs.readdirSync(WORKSPACE_ROOT)
  if (folders.length <= 5) return

  const sorted = folders.sort((a, b) =>
    fs.statSync(path.join(WORKSPACE_ROOT, a)).mtime -
    fs.statSync(path.join(WORKSPACE_ROOT, b)).mtime
  )

  sorted.slice(0, folders.length - 5).forEach(folder => {
    const fullPath = path.join(WORKSPACE_ROOT, folder)
    forceRemoveDir(fullPath)
    console.log("Deleted old workspace:", folder)
  })
}


/* ================= IN-MEMORY LOCK SET ================= */
const processingJobs = new Set()


/* ================= MAIN WORK MANAGER LOOP ================= */
function startWorkManager() {
  console.log("Work Manager started...")

  setInterval(async () => {
    const queue = await jobStore.getQueuedJobs()

    for (let i = 0; i < queue.length; i++) {
      const job = queue[i]
      const jobId = job._id.toString()

      /* Skip if already being handled in a previous tick */
      if (processingJobs.has(jobId)) continue

      /* STEP 1: LANGUAGE DETECTION */
      if (job.status === "QUEUED") {

        /* Lock immediately so no other tick touches this job */
        processingJobs.add(jobId)

        try {
          console.log(`Fetching language for job ${jobId}...`)
          const res = await axios.get(job.languages_url)
          const languages = res.data
          let dominant = null
          let max = 0

          for (const lang in languages) {
            if (languages[lang] > max) {
              max = languages[lang]
              dominant = lang
            }
          }

          if (dominant === "JavaScript") job.language = "node"
          else if (dominant === "Python")  job.language = "python"
          else if (dominant === "C++")     job.language = "cpp"
          else                             job.language = "node"

          console.log(`Job ${jobId} language: ${job.language}`)
        } catch {
          console.log(`Language detection failed for job ${jobId}, defaulting to node`)
          job.language = "node"
        }

        /* Persist to DB before continuing */
        await jobStore.updateJobStatus(jobId, "WAITING_FOR_WORKER")
        job.status = "WAITING_FOR_WORKER"
        console.log(`Job ${jobId} moved to WAITING_FOR_WORKER`)
      }

      /* STEP 2: WORKER ASSIGNMENT */
      if (job.status === "WAITING_FOR_WORKER") {

        /* Lock if not already locked from Step 1 above */
        processingJobs.add(jobId)

        const worker = getAvailableWorker(job.language)

        if (!worker) {
          console.log(`No worker available for job ${jobId} (${job.language})`)
          /* Unlock so next tick can retry */
          processingJobs.delete(jobId)
          continue
        }

        assignWorker(worker, jobId)

        job.workerId = worker.id
        job.startedAt = new Date()
        job.status = "RUNNING"

        await jobStore.assignWorkerToJob(jobId, worker.id)

        console.log(`Job ${jobId} assigned to Worker ${worker.id} (${worker.type})`)

        await executeJob(job, worker)

        /* Job is now RUNNING — remove from local queue slice */
        queue.splice(i, 1)
        i--

        monitorAndUnlock(job, worker, jobId)
      }
    }
  }, 3000)
}


/* ================= MONITOR + UNLOCK ================= */
function monitorAndUnlock(job, worker, jobId) {
  const interval = setInterval(async () => {
    // Refresh from DB
    const freshJob = await Job.findById(jobId)
    
    if (freshJob && (freshJob.status === "COMPLETED" || freshJob.status === "FAILED")) {
      console.log(`Releasing worker ${worker.id} for Job ${jobId}`)
      releaseWorker(worker)
      processingJobs.delete(jobId)
      clearInterval(interval)
      cleanupWorkspaces()
    }
  }, 1000)
}

module.exports = startWorkManager