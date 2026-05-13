function analyzeChanges(changedFiles) {

  let pipelineMode = "full"

  const docsOnly =
    changedFiles.every(file => file.endsWith(".md") || file.includes("README"))

  const frontendOnly =
    changedFiles.every(file => file.includes("frontend") || file.endsWith(".js") || file.endsWith(".css"))

  const configOnly =
    changedFiles.every(file => file.includes(".greenci") || file.endsWith(".yml") || file.endsWith(".json"))

  if (docsOnly) {
    pipelineMode = "docs-only"
  }
  else if (frontendOnly) {
    pipelineMode = "frontend-only"
  }
  else if (configOnly) {
    pipelineMode = "config-only"
  }
  return pipelineMode
}

module.exports = analyzeChanges