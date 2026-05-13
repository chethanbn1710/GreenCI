const jobStore = require("../store/jobStore")
const { addJob } = require("../queue/jobQueue");
const metrics = require("../metrics/sustainabilityMetrics")

async function detectLanguage(languages_url) {

  try {
    const response = await fetch(languages_url)
    const data = await response.json()

    if (data.JavaScript) return "node"
    if (data.Python) return "python"
    if (data.Cpp || data["C++"]) return "cpp"

    return "node"
  } catch {
    return "node"
  }
}

async function scheduleJob(repo, branch, commit, languages_url, clone_url, changedFiles) {
  const cleanBranch = branch?.replace("refs/heads/", "");
  const job = await jobStore.createJob({
    repo,
    branch: cleanBranch,
    language: await detectLanguage(languages_url),
    commit,
    languages_url,
    clone_url,
    changedFiles
  });
  metrics.addTotalJob()
  addJob(job);
  console.log("Job scheduled:", job._id.toString());
  return job;
}

module.exports = scheduleJob;