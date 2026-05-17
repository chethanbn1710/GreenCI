# GreenCI

GreenCI is the active CI engine in this repository. It is a Jenkins-inspired job scheduler and pipeline runner built in Node.js and Express, with MongoDB persistence and a custom worker pool.

## What GreenCI Does Today

- Receives GitHub push webhook events at `POST /webhook`
- Schedules repository jobs automatically from webhook payloads
- Detects repository language using GitHub language statistics
- Queues jobs and assigns them to language-specific workers
- Clones the repository into an isolated `workspace/job-<id>` folder
- Parses `.greenci.yml` for pipeline stages and shell commands
- Executes pipeline stages sequentially inside the cloned repo
- Tracks stage status, logs, and final job state in MongoDB
- Supports "docs-only", "frontend-only", and "config-only" change filtering
- Keeps only recent workspaces and deletes older ones automatically
- Serves a dashboard and API endpoints from `greenci/server.js`

## Current Project Layout

```
Jenkins_CI-CD/
├── backend/          # Separate Express API example (not the core CI engine)
├── frontend/         # React app scaffold (dashboard/front-end example)
├── greenci/          # Active CI server, webhook, scheduler, workers, and dashboard
│   ├── database/     # MongoDB connection
│   ├── manager/      # Work manager and job execution orchestration
│   ├── models/       # Mongoose job schema
│   ├── pipeline/     # Pipeline parsing and stage runner
│   ├── public/       # Static dashboard HTML and assets
│   ├── queue/        # Job queue integration
│   ├── routes/       # Webhook route
│   ├── scheduler/    # Job scheduler/priority calculation
│   ├── store/        # Job persistence helpers
│   └── workers/      # Language-specific worker pool
└── workspace/        # Job workspaces created at runtime
```

## Requirements

- Node.js (14+ recommended)
- MongoDB running at `mongodb://127.0.0.1:27017/greenci`
- `git` installed and available on the PATH

## GreenCI Behavior

### Webhook handling

- `POST /webhook` accepts GitHub push event payloads
- extracts repository name, branch, clone URL, language metadata, and changed files
- schedules a new job asynchronously and stores it in MongoDB

### Job scheduling and execution

- New jobs start as `QUEUED`
- `greenci/manager/workManager.js` polls queued jobs every 300ms
- It updates priority scores and detects the dominant repository language
- It moves jobs into `WAITING_FOR_WORKER`, then assigns an available worker
- Workers are initialized as:
  - 1 `node` worker
  - 2 `python` workers
  - 2 `cpp` workers
- Once assigned, the worker clones the repo, simulates a language-specific build delay, and runs the pipeline

### Pipeline execution

- `.greenci.yml` is parsed by `greenci/pipeline/pipelineManager.js`
- stage definitions are extracted from YAML-style stage names and `-` commands
- each stage runs sequentially with shell execution in the repo workspace
- `clone` stage is managed separately by the work manager before pipeline stages
- failed stages mark the job `FAILED`; successful completion marks the job `COMPLETED`

### Change-based optimization

`greenci/pipeline/analyzeChanges.js` classifies commits as:

- `docs-only` → skips heavy execution, marks the pipeline complete with a skipped validation stage
- `frontend-only` → runs only stages whose names include `frontend` or `build`
- `config-only` → runs only stages whose names include `config` or `validate`
- otherwise → runs the full configured pipeline

### Workspace cleanup

- Workspaces are created under `greenci/workspace/job-<jobId>`
- once more than 5 workspaces exist, the oldest ones are removed automatically

## API Endpoints

- `GET /` → serves `public/dashboard.html`
- `GET /jobs` → all jobs
- `GET /jobs/queued` → queued jobs
- `GET /jobs/in-progress` → running jobs
- `GET /jobs/completed` → completed jobs
- `GET /workers` → available worker count
- `GET /server-status` → simple health check
- `GET /stats` → total job count
- `GET /metrics` → sustainability/job metrics

## Example `.greenci.yml`

Create a `.greenci.yml` file at the root of your repository:

```yaml
build:
  - npm install
  - npm test
lint:
  - npm run lint
package:
  - echo "Package complete"
```

GreenCI parses stage names and commands, then executes each command in order inside the cloned repository.

## Run GreenCI

```bash
cd greenci
npm install
node server.js
```

Then point your GitHub webhook to `http://<host>:7000/webhook`.

## Notes

- The `backend/` and `frontend/` folders are present in this repository, but the active CI workflow is implemented in `greenci/`.
- The server uses MongoDB for job persistence and stores job history in the `greenci` database.
- The dashboard is served from the `greenci/public` folder and is available at `http://localhost:7000/` by default.

