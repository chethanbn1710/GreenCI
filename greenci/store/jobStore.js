let nextJobId = 1
const jobs = []


function createJob(payload) {
  const job = {
    id: nextJobId++,
    repo: payload.repo,
    branch: payload.branch,
    language: payload.language,
    status: "QUEUED",
    createdAt: new Date(),
    startedAt: null,
    completedAt: null,
    workerId: null,
    stages: [
      { name: "clone", status: "WAITING" },
      { name: "install", status: "WAITING" },
      { name: "build", status: "WAITING" },
      { name: "test", status: "WAITING" }
    ]
  }

  jobs.push(job)
  return job
}


function getAllJobs() {
  return jobs
}


function getJobById(id) {
  return jobs.find(job => job.id === id)
}


function updateJobStatus(id, status) {
  const job = getJobById(id)
  if (!job) return null
  job.status = status
  return job
}


function assignWorkerToJob(id, workerId) {
  const job = getJobById(id)
  if (!job) return null
  job.workerId = workerId
  job.startedAt = new Date()
  job.status = "RUNNING"
  return job
}


function completeJob(id) {
  const job = getJobById(id)
  if (!job) return null
  job.status = "COMPLETED"
  job.completedAt = new Date()
  return job
}


module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJobStatus,
  assignWorkerToJob,
  completeJob

}