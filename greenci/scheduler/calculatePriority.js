function calculatePriority(job) {

  let branchWeight = 10
  let energyCost = 1
  let urgency = 0

  const waitingMinutes =
    (Date.now() - new Date(job.createdAt))
    / 60000

  const waitingTimeBoost =
    Math.floor(waitingMinutes / 2)

  /* ================= BRANCH WEIGHT ================= */

  if (job.branch === "main") {branchWeight = 40}
  else if (job.branch === "frontend") {branchWeight = 30}
  else if (job.branch === "api-backend") {branchWeight = 28}
  else if (job.branch === "ai-training") {branchWeight = 22}
  else if (job.branch === "compute-core") {branchWeight = 15}

  /* ================= ENERGY COST ================= */

  if (job.language === "node") {energyCost = 5}
  else if (job.language === "python") {energyCost = 10}
  else if (job.language === "cpp") {energyCost = 18}

  /* ================= URGENCY ================= */

  if (job.commitMessage && job.commitMessage.toLowerCase().includes("hotfix")) {
    urgency += 25
  }

  /* ================= FINAL SCORE ================= */

  let priority = branchWeight + waitingTimeBoost + urgency - energyCost
  priority = Math.max(1, Math.min(100, priority))
  return priority
}

module.exports = calculatePriority