const { execFileSync } = require("child_process");
const path = require("path");

const repoProfiles = require("./repoProfiles");
const commitTemplates = require("./commitTemplates");
const mutateFile = require("./mutationEngine");

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function runCommand(args, cwdPath) {

  execFileSync(
    "C:/Program Files/Git/cmd/git.exe",
    args,
    {
      cwd: cwdPath,
      stdio: "inherit",
      windowsHide: true
    }
  );

}

async function simulateTraffic() {

  while (true) {

    try {
      const repo = randomItem(repoProfiles);
      const branch = randomItem(repo.branches);
      const file = randomItem(repo.files);
      const commitMessage =
        randomItem(commitTemplates);
      const repoPath =
        path.resolve(__dirname, repo.path);
      console.log(
        `\n=== ${repo.name} | ${branch} ===`
      );

      runCommand(["checkout", branch], repoPath);

      mutateFile(repoPath, file, repo.type);

      runCommand(["add", "."], repoPath);
      runCommand(["commit", "-m", commitMessage], repoPath);
      runCommand(["push", "origin", branch], repoPath);

      console.log(
        `Push completed for ${repo.name}`
      );

    } catch (err) {
      console.log("Simulation Error:", err.message);
    }

    const waitTime = Math.floor(Math.random() * 10000) + 1000;

    console.log(`Waiting ${waitTime / 1000}s...\n`);
    await sleep(waitTime);
  }
}

simulateTraffic();