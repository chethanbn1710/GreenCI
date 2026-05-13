const metrics = {

  pipelinesAvoided: 0,

  skippedStages: 0,

  computeSaved: 0,

  totalJobs: 0,

  completedJobs: 0,

  workerBusyTime: 0,

  workerIdleTime: 0

}

/* ===================== */

function addAvoidedPipeline() {

  metrics.pipelinesAvoided += 1

}

/* ===================== */

function addSkippedStages(count) {

  metrics.skippedStages += count

}

/* ===================== */

function addComputeSaved(minutes) {

  metrics.computeSaved += minutes

}

/* ===================== */

function addCompletedJob() {

  metrics.completedJobs += 1

}

/* ===================== */

function addTotalJob() {

  metrics.totalJobs += 1

}

/* ===================== */

function addWorkerBusyTime(ms) {

  metrics.workerBusyTime += ms

}

/* ===================== */

function addWorkerIdleTime(ms) {

  metrics.workerIdleTime += ms

}

/* ===================== */

function getWorkerEfficiency() {

  const total =
    metrics.workerBusyTime
    +
    metrics.workerIdleTime

  if (total === 0) {
    return 0
  }

  return (
    (metrics.workerBusyTime / total)
    * 100
  ).toFixed(1)

}

/* ===================== */

function getQueueEfficiency() {

  if (metrics.totalJobs === 0) {
    return 0
  }

  return (
    (metrics.completedJobs /
      metrics.totalJobs)
    * 100
  ).toFixed(1)

}

/* ===================== */

function getEnergyScore() {

  const score =
    100
    -
    (
      metrics.skippedStages * 0.5
    )
    +
    (
      metrics.pipelinesAvoided * 2
    )

  return Math.max(
    0,
    Math.min(100, score)
  ).toFixed(1)

}

/* ===================== */

function getMetrics() {

  return {

    pipelinesAvoided:
      metrics.pipelinesAvoided,

    skippedStages:
      metrics.skippedStages,

    computeSaved:
      metrics.computeSaved,

    workerEfficiency:
      getWorkerEfficiency(),

    queueEfficiency:
      getQueueEfficiency(),

    energyScore:
      getEnergyScore()

  }

}

module.exports = {

  addAvoidedPipeline,

  addSkippedStages,

  addComputeSaved,

  addCompletedJob,

  addTotalJob,

  addWorkerBusyTime,

  addWorkerIdleTime,

  getMetrics

}