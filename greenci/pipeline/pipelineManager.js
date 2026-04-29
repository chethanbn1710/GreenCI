const fs = require("fs")
const path = require("path")
const { exec } = require("child_process")
const Job = require("../models/jobs.js") // ✅ ADD THIS


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

  let currentStageName = ""
  let insideScript = false

  lines.forEach(line => {
    const trimmed = line.trim()

    if (
      !line.startsWith(" ") &&
      trimmed.endsWith(":") &&
      !trimmed.startsWith("stages")
    ) {
      currentStageName = trimmed.replace(":", "")
    }

    if (trimmed.startsWith("script:")) {
      insideScript = true
      return
    }

    if (insideScript && trimmed.startsWith("-")) {
      const command = trimmed.replace("-", "").trim()
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

async function runPipeline(job, repoPath) {
  job.status = "RUNNING"
  await job.save() // ✅ Save status change
  
  const parsedStages = parseGreenCI(repoPath)

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

  // ✅ UPDATE existing stages instead of replacing them
  parsedStages.forEach((parsedStage, i) => {
    if (job.stages[i]) {
      job.stages[i].command = parsedStage.command
      // Don't reset status - it's already "WAITING" from creation
    }
  })
  
  await job.save() // ✅ Save updated stages
  runStages(job, repoPath, 0)
}


/* =========================
   RUN STAGES SEQUENTIALLY
========================= */

async function runStages(job, repoPath, index) {
  // Skip "clone" stage as it's already handled
  while (index < job.stages.length && job.stages[index].name === "clone") {
    index++
  }

  if (index >= job.stages.length) {
    job.status = "COMPLETED"
    job.completedAt = new Date()
    await job.save()

    console.log("Pipeline completed")
    return
  }

  const stage = job.stages[index]
  
  // ✅ Skip stages without commands
  if (!stage.command) {
    console.log(`Skipping stage ${stage.name} - no command defined`)
    runStages(job, repoPath, index + 1)
    return
  }

  console.log(`Running: ${stage.name} → ${stage.command}`)

  stage.status = "RUNNING"
  await job.save()
  
  const child = exec(stage.command, { cwd: repoPath })

  child.stdout.on("data", data => {
    stage.logs.push(data.toString())
  })

  child.stderr.on("data", data => {
    stage.logs.push(data.toString())
  })

  child.on("close", async (code) => {
    if (code !== 0) {
      stage.status = "FAILED"
      job.status = "FAILED"
      job.completedAt = new Date()
      stage.logs.push("Stage exited with error code: " + code)
      
      await job.save()
      
      console.log("Stage failed:", stage.name)
      return
    }

    stage.status = "COMPLETED"
    await job.save()

    runStages(job, repoPath, index + 1)
  })
}

module.exports = runPipeline