const express = require("express");
const router = express.Router();

const scheduleJob = require("../scheduler/jobScheduler");

router.post("/", (req, res) => {

  console.log("Webhook received");
  console.log(req.body);

  const repo = req.body.repository?.name;
  const branch = req.body.ref;

  const job = scheduleJob(repo, branch, "commit");

  res.json({ message: "Job scheduled", job });

});

module.exports = router;