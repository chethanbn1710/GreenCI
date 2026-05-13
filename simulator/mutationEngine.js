const fs = require("fs");
const path = require("path");

function mutateFile(repoPath, fileName, repoType) {
  const filePath = path.join(repoPath, fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf-8");

  const timestamp = new Date().toISOString();

  let mutation = "";

  switch (repoType) {

    case "node":
      mutation = `\n// UI simulation update ${timestamp}`;
      break;

    case "python":
      mutation = `\n# AI/API simulation update ${timestamp}`;
      break;

    case "cpp":
      mutation = `\n// Compute simulation update ${timestamp}`;
      break;

    default:
      mutation = `\n# Generic simulation update ${timestamp}`;
  }

  content += mutation;

  fs.writeFileSync(filePath, content);

  console.log(`Mutated ${fileName}`);
}

module.exports = mutateFile;