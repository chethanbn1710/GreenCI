const { getQueue } = require("../queue/jobQueue");

const axios = require("axios");

function startWorkManager() {
  console.log("Work Manager started...");

  setInterval(async () => {
  const queue = getQueue();

  let didWork = false;

  for (const job of queue) {

    if (job.status === "QUEUED") {

      try {
        console.log(`Fetching language for job ${job.id}...`);

        const res = await axios.get(job.languages_url);
        const languages = res.data;

        // Find dominant language
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
        else job.language = "node"; // fallback

        console.log(`Job ${job.id} language: ${job.language}`);

      } catch (err) {
        console.log("Language detection failed, defaulting to node");
        job.language = "node";
      }

      job.status = "WAITING_FOR_WORKER";
      console.log(`Job ${job.id} moved to WAITING_FOR_WORKER`);

      didWork = true;
    }
  }

  if (didWork) {
    console.log("Queue processed");
  }

}, 3000); // every 3 seconds
}

module.exports = startWorkManager;