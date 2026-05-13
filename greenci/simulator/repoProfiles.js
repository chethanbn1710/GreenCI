module.exports = [
  {
    name: "GreenDash_UI",
    path: "../../../Jenkins_TargetRepos/GreenDash_UI",
    branches: ["main", "frontend"],
    files: ["app.js", "README.md"],
    frequency: 100,
    type: "node"
  },

  {
    name: "TaskForge_API",
    path: "../../../Jenkins_TargetRepos/TaskForge_API",
    branches: ["main", "api-backend"],
    files: ["app.py", "README.md"],
    frequency: 150,
    type: "python"
  },

  {
    name: "VisionTrain_AI",
    path: "../../../Jenkins_TargetRepos/VisionTrain_AI",
    branches: ["main", "ai-training"],
    files: ["train.py", "README.md"],
    frequency: 200,
    type: "python"
  },

  {
    name: "FastCompute_Core",
    path: "../../../Jenkins_TargetRepos/FastCompute_Core",
    branches: ["main", "compute-core"],
    files: ["main.cpp", "README.md"],
    frequency: 250,
    type: "cpp"
  }
];