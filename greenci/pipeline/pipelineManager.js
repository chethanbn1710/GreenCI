const fs = require("fs")
const path = require("path")
const { exec } = require("child_process")


/* =========================
   PARSE YAML WITH STAGE NAMES
========================= */

function parseGreenCI(repoPath) {
  const filePath =
    path.join(repoPath, ".greenci.yml")

  if (!fs.existsSync(filePath)) {
    console.log("No .greenci.yml found")
    return []
  }

  const content =
    fs.readFileSync(filePath, "utf-8")
  const lines =
    content.split("\n")
  const stages = []

  let currentStageName = ""
  let insideScript = false

  lines.forEach(line => {
    const trimmed =
      line.trim()

    if (
      !line.startsWith(" ")
      &&
      trimmed.endsWith(":")
      &&
      !trimmed.startsWith("stages")
    ) {

      currentStageName =
        trimmed.replace(":", "")
    }

    if (trimmed.startsWith("script:")) {
      insideScript = true
      return
    }

    if (insideScript && trimmed.startsWith("-")) {
      const command =
        trimmed.replace("-", "").trim()
      stages.push({
        name: currentStageName,
        command
      })
    }
  })
  return stages
}


/* =========================
   PIPELINE EXECUTION
========================= */

function runPipeline(job, repoPath) {
  job.status = "RUNNING"
  const parsedStages =
    parseGreenCI(repoPath)

  if (parsedStages.length === 0) {
    console.log("Using default stages")
    parsedStages.push({
      name: "install",
      command: "npm install"
    })
    parsedStages.push({
      name: "build",
      command: "npm run build"
    })
    parsedStages.push({
      name: "test",
      command: "npm test"
    })
  }

  job.stages =
    parsedStages.map(stage => ({
      name: stage.name,
      command: stage.command,
      status: "WAITING",
      logs: []
    }))
  runStages(job, repoPath, 0)
}


/* =========================
   RUN STAGES SEQUENTIALLY
========================= */

function runStages(job, repoPath, index) {
  if (index >= job.stages.length) {
    job.status = "COMPLETED"
    job.completedAt = new Date()

    console.log("Pipeline completed")
    return
  }

  const stage =
    job.stages[index]
  console.log(
    `Running: ${stage.name} → ${stage.command}`
  )

  stage.status = "RUNNING"
  const child =
    exec(stage.command, { cwd: repoPath })

  child.stdout.on("data", data => {
    stage.logs.push(data.toString())
  })

  child.stderr.on("data", data => {
    stage.logs.push(data.toString())
  })

  child.on("close", code => {
    if (code !== 0) {
      stage.status = "FAILED"

      job.status = "FAILED"
      job.completedAt = new Date()

      stage.logs.push(
        "Stage exited with error code: " + code
      )
      console.log(
        "Stage failed:",
        stage.name
      )
      return
    }

    stage.status = "COMPLETED"

    runStages(
      job,
      repoPath,
      index + 1
    )
  })
}

module.exports = runPipeline