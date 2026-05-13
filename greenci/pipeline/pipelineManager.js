const fs = require("fs")
const path = require("path")
const { exec } = require("child_process")
const Job = require("../models/jobs.js")
const metrics = require("../metrics/sustainabilityMetrics")

const analyzeChanges = require("./analyzeChanges")

/* =========================
   PARSE YAML WITH STAGE NAMES
========================= */
function parseGreenCI(repoPath) {
  const filePath = path.join(repoPath, ".greenci.yml")

  if (!fs.existsSync(filePath)) {
    console.log("No .greenci.yml found")
    return []
  }

  const content = fs.readFileSync(filePath, "utf-8")
  const lines = content.split("\n")
  const stages = []

  let currentStage = null
  lines.forEach(line => {
    const trimmed = line.trim()
    if (
      trimmed.endsWith(":")
      &&
      !trimmed.startsWith("-")
      &&
      !trimmed.startsWith("script")
      &&
      !trimmed.startsWith("stages")
    ) {
      currentStage =
        trimmed.replace(":", "")
      return
    }

    if (
      trimmed.startsWith("-")
      &&
      currentStage
    ) {
      const command =
        trimmed.replace("-", "").trim()
      stages.push({
        name: currentStage,
        command
      })
    }
  })
  return stages
}

/* =========================
   RUN STAGES SEQUENTIALLY
========================= */

async function runStages(
  job,
  repoPath,
  index
) {

  while (
    index < job.stages.length
    &&
    job.stages[index].name === "clone"
  ) {
    index++
  }

  if (index >= job.stages.length) {
  job.status = "COMPLETED"
  metrics.addCompletedJob()
  metrics.addComputeSaved(1)
  job.completedAt = new Date()
  job.markModified("stages")
  await job.save()
  console.log("Pipeline completed")
  return
}

  const stage = job.stages[index]

  if (!stage.command) {
    console.log(
      `Skipping stage ${stage.name} - no command defined`
    )

    stage.status = "SKIPPED"
    job.markModified("stages")
    await job.save()
    await runStages(
      job,
      repoPath,
      index + 1
    )
    return
  }

  console.log(
    `Running: ${stage.name} → ${stage.command}`
  )

  stage.status = "RUNNING"
  job.markModified("stages")
  await job.save()
  const child = exec(
    stage.command,
    { cwd: repoPath }
  )

  child.stdout.on("data", data => {
    stage.logs.push(data.toString())
    job.markModified("stages")
  })

  child.stderr.on("data", data => {
    stage.logs.push(data.toString())
    job.markModified("stages")
  })

  child.on("close", async (code) => {

    if (code !== 0) {
      stage.status = "FAILED"
      job.markModified("stages")
      job.status = "FAILED"
      job.completedAt = new Date()

      stage.logs.push(
        "Stage exited with error code: "
        + code
      )

      await job.save()
      console.log(
        "Stage failed:",
        stage.name
      )
      return
    }

    stage.status = "COMPLETED"
    job.markModified("stages")
    await job.save()
    await runStages(
      job,
      repoPath,
      index + 1
    )
  })
}

/* =========================
   MAIN PIPELINE RUNNER
========================= */

async function runPipeline(
  job,
  repoPath
) {

  /* ===== SMART ANALYSIS ===== */
  const pipelineMode =
    analyzeChanges(
      job.changedFiles || []
    )
  console.log(
    "Pipeline Mode:",
    pipelineMode
  )

  /* ===== DOCS ONLY ===== */
  if (pipelineMode === "docs-only") {
    console.log(
      "Documentation-only commit detected"
    )
    console.log(
      "Skipping heavy execution"
    )
    metrics.addAvoidedPipeline()

    metrics.addSkippedStages(4)

    metrics.addComputeSaved(3)

    job.stages = [
      {
        name: "docs-validation",
        command: "skipped",
        status: "SKIPPED",
        logs: [
          "Skipped heavy execution"
        ]
      }
    ]
    job.status = "COMPLETED"
    metrics.addCompletedJob()
    job.completedAt = new Date()
    await job.save()
    return
  }

  /* ===== PARSE PIPELINE ===== */
  const stages =
    parseGreenCI(repoPath)

  if (stages.length === 0) {
    job.status = "FAILED"
    job.completedAt = new Date()
    await job.save()
    console.log(
      "No stages found in .greenci.yml"
    )
    return
  }

  /* ===== FILTER STAGES ===== */
  let filteredStages = stages

  if (pipelineMode === "frontend-only") {
    console.log(
      "Frontend-only pipeline execution"
    )

    filteredStages =
      stages.filter(stage =>
        stage.name
          .toLowerCase()
          .includes("frontend")
        ||
        stage.name
          .toLowerCase()
          .includes("build")
      )
  }

  if (pipelineMode === "config-only") {
    console.log(
      "Config-only pipeline execution"
    )

    filteredStages =
      stages.filter(stage =>
        stage.name
          .toLowerCase()
          .includes("config")
        ||
        stage.name
          .toLowerCase()
          .includes("validate")
      )
  }

  /* ===== STORE STAGES ===== */
  job.stages =
    filteredStages.map(stage => ({
      name: stage.name,
      command: stage.command,
      status: "PENDING",
      logs: []
    }))
  job.markModified("stages")
  await job.save()

  /* ===== EXECUTE ===== */
  await runStages(
    job,
    repoPath,
    0
  )
}
module.exports = runPipeline