const Job = require("../models/jobs.js")


/* ================= CREATE JOB ================= */
async function createJob(payload) {
  const job = new Job({
    repo: payload.repo,
    branch: payload.branch,
    language: payload.language,
    commit: payload.commit,
    clone_url: payload.clone_url,
    languages_url: payload.languages_url,
    status: "QUEUED",
    createdAt: new Date(),
    startedAt: null,
    completedAt: null,
    workerId: null,
    stages: [
      { name: "clone", status: "WAITING", logs: [] },
      { name: "install", status: "WAITING", logs: [] },
      { name: "build", status: "WAITING", logs: [] },
      { name: "test", status: "WAITING", logs: [] }
    ]
  })
  await job.save()
  return job
}


/* ================= GET ALL JOBS ================= */
async function getAllJobs() {
  return await Job.find().sort({ createdAt: -1 })
}


/* ================= UPDATE STATUS ================= */
async function updateJobStatus(_id, status) {
  await Job.updateOne(
    { _id },
    { status }
  )
}


/* ================= ASSIGN WORKER ================= */
async function assignWorkerToJob(_id, workerId) {
  await Job.updateOne(
    { _id },
    {
      workerId,
      startedAt: new Date(),
      status: "RUNNING"
    }
  )
}


/* ================= COMPLETE JOB ================= */
async function completeJob(_id) {
  await Job.updateOne(
    { _id },
    {
      status: "COMPLETED",
      completedAt: new Date()
    }
  )
}

async function getQueuedJobs() {
  return await Job.find({
    status: { $in: ["QUEUED", "WAITING_FOR_WORKER"] }
  })
}

module.exports = {
  createJob,
  getAllJobs,
  updateJobStatus,
  assignWorkerToJob,
  completeJob,
  getQueuedJobs
}