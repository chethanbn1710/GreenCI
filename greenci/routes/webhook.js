const express = require("express");
const router = express.Router();

const scheduleJob = require("../scheduler/jobScheduler");

router.post("/", (req, res) => {

  console.log("Webhook received");

  const repo = req.body.repository?.name;
  const branch = req.body.ref?.replace("refs/heads/", "");
  const languages_url = req.body.repository?.languages_url;
  const clone_url = req.body.repository?.clone_url;

  const changedFiles = [];

  req.body.commits?.forEach(commit => {
    if (commit.modified) {
      changedFiles.push(...commit.modified);
    }
    if (commit.added) {
      changedFiles.push(...commit.added);
    }
  });

  console.log("Changed Files:",changedFiles);

  res.status(200).json({ message: "Webhook received" });

  setImmediate(async () => {
    try {
      await scheduleJob(repo, branch, "commit", languages_url, clone_url, changedFiles);
    } catch (err) {
      console.error("Job scheduling failed:", err);
    }
  });
});

module.exports = router;