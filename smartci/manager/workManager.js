const { getQueue } = require("../queue/jobQueue");
const { getAvailableWorker, assignWorker } = require("../workers/workerPool");
const axios = require("axios");

function startWorkManager() {
  console.log("Work Manager started...");

  setInterval(async () => {
    const queue = getQueue();

    for (let i = 0; i < queue.length; i++) {
      const job = queue[i];

      // 🔹 STEP 1: Language Detection
      if (job.status === "QUEUED") {
        try {
          console.log(`Fetching language for job ${job.id}...`);

          const res = await axios.get(job.languages_url);
          const languages = res.data;

          let dominant = null;
          let max = 0;

          for (const lang in languages) {
            if (languages[lang] > max) {
              max = languages[lang];
              dominant = lang;
            }
          }

          // Map language
          if (dominant === "JavaScript") job.language = "node";
          else if (dominant === "Python") job.language = "python";
          else if (dominant === "C++") job.language = "cpp";
          else job.language = "node";

          console.log(`Job ${job.id} language: ${job.language}`);
        } catch (err) {
          console.log(`Language detection failed for job ${job.id}, defaulting to node`);
          job.language = "node";
        }

        job.status = "WAITING_FOR_WORKER";
        console.log(`Job ${job.id} moved to WAITING_FOR_WORKER`);
      }

      // 🔹 STEP 2: Worker Assignment
      if (job.status === "WAITING_FOR_WORKER") {
        const worker = getAvailableWorker(job.language);

        if (!worker) {
          console.log(`No worker available for job ${job.id} (${job.language})`);
          continue;
        }

        // Assign worker
        assignWorker(worker, job.id);

        job.workerId = worker.id;
        job.status = "RUNNING";

        console.log(`Job ${job.id} assigned to Worker ${worker.id} (${worker.type})`);

        // Remove job from queue
        queue.splice(i, 1);
        i--; // IMPORTANT: adjust index after removal
      }
    }

  }, 3000);
}

module.exports = startWorkManager;