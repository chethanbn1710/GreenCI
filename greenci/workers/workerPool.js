const workers = [];

// 🔹 Initialize workers
function initWorkers() {
  let id = 1;

  // Node workers (2)
  for (let i = 0; i < 2; i++) {
    workers.push({
      id: id++,
      type: "node",
      busy: false,
      currentJobId: null
    });
  }

  // Python workers (2)
  for (let i = 0; i < 2; i++) {
    workers.push({
      id: id++,
      type: "python",
      busy: false,
      currentJobId: null
    });
  }

  // C++ worker (1)
  workers.push({
    id: id++,
    type: "cpp",
    busy: false,
    currentJobId: null
  });

  console.log("Workers initialized:", workers);
}

// 🔹 Get available worker by type
function getAvailableWorker(type) {
  return workers.find(w => w.type === type && !w.busy);
}

// 🔹 Assign worker
function assignWorker(worker, jobId) {
  worker.busy = true;
  worker.currentJobId = jobId;
}

// 🔹 Release worker (used later)
function releaseWorker(worker) {
  worker.busy = false;
  worker.currentJobId = null;
}

// 🔹 Get all workers (optional for debugging)
function getAllWorkers() {
  return workers;
}

module.exports = {
  initWorkers,
  getAvailableWorker,
  assignWorker,
  releaseWorker,
  getAllWorkers
};