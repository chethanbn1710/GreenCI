# GREEN_CI

## Overview

`Green_CI` is a full-stack demo repository to illustrate a CI/CD workflow built around a sample web application with backend and frontend components, plus an internal job orchestration system (`greenci`). It is structured to support Jenkins pipeline integration and modular job/worker execution for isolated environments (`workspace/job-*`).

## Repository structure

- `backend/`: Node.js API server with database connection, Dockerfile, and API tests.
- `frontend/`: React frontend app with standard CRA structure and test setup.
- `greenci/`: core job management orchestration system.
  - `manager/`: workflow manager (`workManager.js`).
  - `pipeline/`: pipeline manager (`pipelineManager.js`).
  - `queue/`: job queue implementation (`jobQueue.js`).
  - `scheduler/`: job scheduler (`jobScheduler.js`).
  - `store/`: in-memory job store (`jobStore.js`).
  - `workers/`: worker pool implementation (`workerPool.js`).
  - `routes/webhook.js`: webhook route entrypoint.
  - `public/dashboard.html`: UI for job dashboard.
- `workspace/`: per-job isolated environment directories for job-1, job-2, job-3 replicating application packages for reproducibility.

## Getting started

### Prerequisites

- Node.js (16+ recommended)
- npm or yarn
- Docker (for image builds, optional)
- Jenkins (optional, for CI/CD pipeline demo)

### Local setup

1. Clone the repo:

```bash
git clone <repo-url>
cd Jenkins_CI-CD
```

2. Install dependencies for each major component:

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../greenci && npm install
```

3. Run backend service:

```bash
cd backend
npm start
```

4. Run frontend app:

```bash
cd frontend
npm start
```

5. Run greenci orchestrator (optional; enables job queue/pipeline simulation):

```bash
cd greenci
npm start
```

## Testing

### Backend tests

```bash
cd backend
npm test
```

### Frontend tests

```bash
cd frontend
npm test
```

### Greenci component tests

- Add tests as needed; no explicit test files are present currently.

## Docker

### Build backend image

```bash
cd backend
docker build -t jenkins-ci-cd-backend .
```

### Build frontend image

```bash
cd frontend
docker build -t jenkins-ci-cd-frontend .
```

## Jenkins pipeline

This repository is designed to be driven by a Jenkins pipeline that can:

1. Checkout code
2. Install dependencies (backend/frontend/greenci)
3. Run lints and tests
4. Build Docker images
5. Deploy containers
6. Optionally execute greenci jobs (workspace/job-*) for isolated CI runs

Add a `Jenkinsfile` at root with stages like `Install`, `Test`, `Build`, `Deploy`.

## greenci pipeline and job flow

- `greenci/server.js` exposes an API to submit and monitor jobs.
- `greenci/queue/jobQueue.js` maintains pending/active jobs.
- `greenci/scheduler/jobScheduler.js` runs jobs periodically.
- `greenci/workers/workerPool.js` executes jobs with concurrency control.
- `greenci/manager/workManager.js` coordinates job state and workflow lifecycle.
- `greenci/pipeline/pipelineManager.js` defines pipeline steps and transitions.

## Adding a new job workspace

1. Copy an existing `workspace/job-{n}` folder.
2. Adjust `backend`, `frontend`, and `greenci` code inside.
3. Register the new job in your orchestrator config or pipeline definition.

## Notes

- This repository is an integration demo and may require branch-specific ajustments for production.
- Review the `greenci` package and add authentication, persistent storage, and logging for production readiness.

## License

Use or adapt this repository under your preferred open-source license.
