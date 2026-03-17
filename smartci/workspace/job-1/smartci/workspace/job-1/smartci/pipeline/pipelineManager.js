const { exec } = require("child_process");

const stagesTemplate = [
  "npm install",
  "cd backend && npm install",
  "cd backend && npm test"
];

function runPipeline(job, repoPath) {

  job.status = "IN_PROGRESS";

  job.stages = stagesTemplate.map(cmd => ({
    name: cmd,
    status: "PENDING"
  }));

  runStages(job, repoPath, 0);
}

function runStages(job, repoPath, index) {

  if (index >= job.stages.length) {
    job.status = "COMPLETED";
    console.log("Pipeline completed");
    return;
  }

  const stage = job.stages[index];

  stage.status = "RUNNING";

  exec(stage.name, { cwd: repoPath }, (err, stdout, stderr) => {

    if (err) {
      stage.status = "FAILED";
      job.status = "FAILED";
      console.log("Stage failed:", stage.name);
      return;
    }

    stage.status = "COMPLETED";

    runStages(job, repoPath, index + 1);

  });

}

module.exports = runPipeline;