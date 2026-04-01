const { getQueue } = require("../queue/jobQueue");

function startWorkManager() {
  console.log("Work Manager started...");

  setInterval(() => {
  const queue = getQueue();

  let didWork = false;

  queue.forEach(job => {
    if (job.status === "QUEUED") {
      console.log(`Job ${job.id} moved to WAITING_FOR_WORKER`);
      job.status = "WAITING_FOR_WORKER";
      didWork = true;
    }
  });

  if (didWork) {
    console.log("Queue processed");
  }

}, 3000); // every 3 seconds
}

module.exports = startWorkManager;