const Job = require("../models/jobs.js")

let nextJobId = 1

/* ================= CREATE JOB ================= */
async function createJob(payload) {
  const job = new Job({
    id: nextJobId++,
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
async function updateJobStatus(id, status) {
  await Job.updateOne(
    { id },
    { status }
  )
}


/* ================= ASSIGN WORKER ================= */
async function assignWorkerToJob(id, workerId) {
  await Job.updateOne(
    { id },
    {
      workerId,
      startedAt: new Date(),
      status: "RUNNING"
    }
  )
}


/* ================= COMPLETE JOB ================= */
async function completeJob(id) {
  await Job.updateOne(
    { id },
    {
      status: "COMPLETED",
      completedAt: new Date()
    }
  )
}

module.exports = {
  createJob,
  getAllJobs,
  updateJobStatus,
  assignWorkerToJob,
  completeJob
}