function calculatePriority(job) {

  let branchWeight = 1
  let energyCost = 1
  let urgency = 0

  const waitingMinutes =
    (Date.now() - new Date(job.createdAt))
    / 60000

  const waitingTimeBoost =
    Math.floor(waitingMinutes / 2)

  /* Branch Weight */

  if (job.branch === "main") {
    branchWeight = 5
  }

  else if (job.branch === "frontend") {
    branchWeight = 3
  }

  else if (job.branch === "api-backend") {
    branchWeight = 3
  }

  else if (job.branch === "ai-training") {
    branchWeight = 2
  }

  else if (job.branch === "compute-core") {
    branchWeight = 1
  }

  /* Energy Cost */

  if (job.language === "node") {
    energyCost = 2
  }

  else if (job.language === "python") {
    energyCost = 4
  }

  else if (job.language === "cpp") {
    energyCost = 8
  }

  /* Urgency */

  if (
    job.commitMessage &&
    job.commitMessage.includes("hotfix")
  ) {
    urgency += 5
  }

  const priority =
    branchWeight
    + waitingTimeBoost
    + urgency
    - energyCost

  return priority
}

module.exports = calculatePriority