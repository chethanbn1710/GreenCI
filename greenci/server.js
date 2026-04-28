
const express = require("express");
const cors = require("cors");
const workerPool = require("./workers/workerPool");

const webhookRoute = require("./routes/webhook");
const jobs = require("./store/jobStore");
const startWorkManager = require("./manager/workManager");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/webhook", webhookRoute);

/* Dashboard APIs */

app.get("/jobs", (req, res) => {
  res.json(jobs);
});

app.get("/jobs/queued", (req, res) => {
  res.json(jobs.filter(j => j.status === "QUEUED"));
});

app.get("/jobs/in-progress", (req, res) => {
  res.json(jobs.filter(j => j.status === "RUNNING"));
});

app.get("/jobs/completed", (req, res) => {
  res.json(jobs.filter(j => j.status === "COMPLETED"));
});

app.get("/workers", (req, res) => {
  const workers = workerPool.getAllWorkers()
  const availableWorkers =
    workers.filter(w => w.status === "IDLE").length
  res.json({
    available: availableWorkers
  })
})

app.get("/server-status", (req, res) => {
  res.json({
    online: true
  });
});

app.get("/stats", (req, res) => {
  res.json({
    totalJobs: jobs.length
  });
});

startWorkManager();
workerPool.initWorkers();

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/dashboard.html");
});

app.listen(7000, () => {
  console.log("GreenCI running on port 7000");
});