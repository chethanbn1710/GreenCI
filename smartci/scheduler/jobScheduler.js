const jobs = require("../store/jobStore");
const { addJob } = require("../queue/jobQueue");

let jobId = 1;

function scheduleJob(repo, branch, commit, languages_url, clone_url) {

  const id = jobId++;

  const job = {
  id,
  repo,
  branch,
  commit,
  status: "QUEUED",
  language: null,
  workerId: null,
  languages_url,
  clone_url,
  stages: []
};

  // Store for dashboard
  jobs.push(job);

  // Add to queue
  addJob(job);

  console.log("Job scheduled:", id);

  return job;
}

module.exports = scheduleJob;