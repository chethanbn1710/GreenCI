const runPipeline = require("../pipeline/pipelineManager")
const { exec } = require("child_process")
const fs = require("fs")
const path = require("path")

const {
  getAvailableWorker,
  assignWorker,
  releaseWorker
} = require("../workers/workerPool")
const jobStore = require("../store/jobStore")
const axios = require("axios")


/* ================= STAGE UPDATE HELPER ================= */
function updateStage(job, stageName, status) {
  const stage = job.stages.find(s => s.name === stageName)
  if (stage) {
    stage.status = status
   }
}

/* ================= EXECUTE JOB ================= */
function executeJob(job, worker) {
  console.log(`Worker ${worker.id} started executing Job ${job._id}`)
  const repoUrl = job.clone_url
  const workspace =
    path.join(__dirname, "..", "workspace", `job-${job._id}`)

  /* Clean old workspace */
  if (fs.existsSync(workspace)) {
    fs.rmSync(workspace, {
      recursive: true,
      force: true
    })
  }
  fs.mkdirSync(workspace, { recursive: true })
  console.log(`Cloning repo for Job ${job._id}...`)


  /* START CLONE STAGE */
  updateStage(job, "clone", "RUNNING")
  exec(`git clone ${repoUrl} .`, { cwd: workspace }, (err, stdout, stderr) => {

    if (err) {
      console.log("Clone error output:", stderr)
      console.log(`Clone failed for Job ${job._id}`)
      updateStage(job, "clone", "FAILED")
      job.status = "FAILED"
      releaseWorker(worker)
      return
    }

    console.log(`Repo cloned for Job ${job._id}`)
    updateStage(job, "clone", "COMPLETED")

    /* Continue pipeline */
    runPipeline(job, workspace)

    /* Monitor pipeline completion */
    monitorJobCompletion(job, worker)
  })
}


/* ================= MONITOR PIPELINE COMPLETION ================= */
function monitorJobCompletion(job, worker) {
  const interval = setInterval(() => {
    if (
      job.status === "COMPLETED"
      ||
      job.status === "FAILED"
    ) {
      console.log(
        `Releasing worker ${worker.id} for Job ${job._id}`
      )
      releaseWorker(worker)
      clearInterval(interval)
      cleanupWorkspaces()
    }
  }, 1000)
}

/* ================= CLEANUP OLD WORKSPACES ================= */
function cleanupWorkspaces() {
  const WORKSPACE_ROOT =
    path.join(__dirname, "..", "workspace")

  if (!fs.existsSync(WORKSPACE_ROOT)) return

  const folders =
    fs.readdirSync(WORKSPACE_ROOT)

  if (folders.length <= 5) return

  const sorted = folders.sort((a, b) => {
    return (
      fs.statSync(
        path.join(WORKSPACE_ROOT, a)
      ).mtime
      -
      fs.statSync(
        path.join(WORKSPACE_ROOT, b)
      ).mtime
    )
  })

  const toDelete =
    sorted.slice(0, folders.length - 5)

  toDelete.forEach(folder => {
    const fullPath =
      path.join(WORKSPACE_ROOT, folder)
    fs.rmSync(fullPath, {
      recursive: true,
      force: true
    })
    console.log("Deleted old workspace:", folder)
  })
}


/* ================= MAIN WORK MANAGER LOOP ================= */

function startWorkManager() {
  console.log("Work Manager started...")

  setInterval(async () => {
    const queue = await jobStore.getQueuedJobs()

    for (let i = 0; i < queue.length; i++) {
      const job = queue[i]

      /* STEP 1: LANGUAGE DETECTION */
      if (job.status === "QUEUED") {
        try {
          console.log(
            `Fetching language for job ${job._id}...`
          )

          const res =
            await axios.get(job.languages_url)

          const languages = res.data
          let dominant = null
          let max = 0

          for (const lang in languages) {
            if (languages[lang] > max) {
              max = languages[lang]
              dominant = lang
            }
          }

          if (dominant === "JavaScript")
            job.language = "node"
          else if (dominant === "Python")
            job.language = "python"

          else if (dominant === "C++")
            job.language = "cpp"
          else
            job.language = "node"
          console.log(
            `Job ${job._id} language: ${job.language}`
          )
        }
        catch {
          console.log(
            `Language detection failed for job ${job._id}, defaulting to node`
          )
          job.language = "node"
        }

        await jobStore.updateJobStatus(
          job._id,
          "WAITING_FOR_WORKER"
        )
        console.log(
          `Job ${job._id} moved to WAITING_FOR_WORKER`
        )
      }

      /* STEP 2: WORKER ASSIGNMENT */
      if (job.status === "WAITING_FOR_WORKER") {
        const worker =
          getAvailableWorker(job.language)

        if (!worker) {
          console.log(
            `No worker available for job ${job._id} (${job.language})`
          )
          continue
        }
        assignWorker(worker, job._id)

        job.workerId = worker.id
        job.startedAt = new Date()
        job.status = "RUNNING"

        console.log(
          `Job ${job._id} assigned to Worker ${worker.id} (${worker.type})`
        )

        executeJob(job, worker)

        /* Remove job from queue */
        queue.splice(i, 1)
        i--
      }
    }
  }, 3000)
}

module.exports = startWorkManager