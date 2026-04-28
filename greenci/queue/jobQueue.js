const jobQueue = [];

function addJob(job) {
  jobQueue.push(job);
  console.log("Job added to queue:", job._id.toString());
}

function getQueue() {
  return jobQueue;
}

module.exports = {
  addJob,
  getQueue
};