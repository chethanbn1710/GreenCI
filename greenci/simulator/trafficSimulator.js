const { execSync } = require("child_process");
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

function runCommand(command, cwdPath) {
  try {
    const output = execSync(command, {
      cwd: cwdPath,
      encoding: 'utf8',
      stdio: 'pipe',
      windowsHide: true
    });
    if (output) {
      console.log(output);
    }
  } catch (error) {
    // Check if it's a git error vs spawn error
    if (error.stderr) {
      console.log(error.stderr);
    }
    throw error;
  }
}

async function simulateTraffic() {
  while (true) {
    try {
      const repo = randomItem(repoProfiles);
      const branch = randomItem(repo.branches);
      const file = randomItem(repo.files);
      const commitMessage = randomItem(commitTemplates);
      const repoPath = path.resolve(__dirname, repo.path);

      console.log(`\n=== ${repo.name} | ${branch} ===`);

      runCommand(
        `git checkout ${branch}`,
        repoPath
      );

      mutateFile(repoPath, file, repo.type);

      runCommand(
        "git add .",
        repoPath
      );

      runCommand(
        `git commit -m "${commitMessage}"`,
        repoPath
      );

      runCommand(
        `git push origin ${branch}`,
        repoPath
      );

      console.log(`Push completed for ${repo.name}`);

    } catch (err) {
      console.log("Simulation Error:", err.message);
    }

    const waitTime =
      Math.floor(Math.random() * 10000) + 5000;

    console.log(`Waiting ${waitTime / 1000}s...\n`);

    await sleep(waitTime);
  }
}

simulateTraffic();