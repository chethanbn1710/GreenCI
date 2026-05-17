function analyzeChanges(files) {
  if (!files || files.length === 0) {
    return "full"
  }

  const docsExtensions = [".md", ".txt"]

  const configFiles = [".env", ".yaml", ".yml", "package.json"]

  let docsOnly = true
  let configOnly = true
  let frontendOnly = true

  for (const file of files) {
    const lower = file.toLowerCase()

    const isDoc = docsExtensions.some(ext => lower.endsWith(ext))
    if (!isDoc) {docsOnly = false}


    const isConfig = configFiles.some(cfg => lower.includes(cfg))
    if (!isConfig) {configOnly = false}


    const isFrontend = lower.endsWith(".html") || lower.endsWith(".css") || lower.endsWith(".js")
    if (!isFrontend) {frontendOnly = false}

  }

  if (docsOnly) {return "docs-only"}
  if (configOnly) {return "config-only"}
  if (frontendOnly) {return "frontend-only"}
  return "full"
}

module.exports = analyzeChanges