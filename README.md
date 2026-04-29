# GreenCI

GreenCI is a lightweight Jenkins-inspired Continuous Integration (CI) system built with Node.js, Express, MongoDB, and a custom worker scheduler. It automates pipeline execution on every GitHub push using a `.greenci.yml` configuration file and provides a real-time dashboard for job status.

## Features

- GitHub webhook-triggered pipelines
- YAML-based pipeline configuration (`.greenci.yml`)
- Language-aware worker pool scheduling (Node, Python, C++)
- MongoDB-backed job persistence
- Real-time dashboard with Queue, Active, and Done views
- Live stage status tracking and logs
- Workspace isolation per job
- Automatic cleanup of old workspaces

## Project Structure

```
Jenkins_CI-CD/
│
├── backend/         # Node.js Express backend for task/project management
│   ├── database.js
│   ├── Dockerfile
│   ├── server.js
│   └── tests/
│
├── frontend/        # React-based frontend dashboard
│   ├── public/
│   └── src/
│
├── greenci/         # Main CI server and worker logic
│   ├── database/
│   ├── manager/
│   ├── models/
│   ├── pipeline/
│   ├── public/
│   ├── queue/
│   ├── routes/
│   ├── scheduler/
│   ├── store/
│   └── workers/
│
└── workspace/       # Isolated job workspaces (auto-generated)
```

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Frontend:** React, HTML, CSS, JavaScript

## How It Works

1. Push code to GitHub
2. Webhook triggers GreenCI server
3. Job enters queue
4. Worker is assigned automatically
5. Repository is cloned
6. Pipeline executes using `.greenci.yml`
7. Results appear on dashboard

## Example Pipeline File

Create a `.greenci.yml` in your repository:

```yaml
build:
  script:
    - echo "Build step completed"
install_dependencies:
  script:
    - echo "Install dependencies completed"
run_tests:
  script:
    - echo "Tests completed"
```

## Usage

### Backend

- Install dependencies: `npm install` (in `backend/`)
- Run server: `node server.js`

### Frontend

- Install dependencies: `npm install` (in `frontend/`)
- Start development server: `npm start`

### GreenCI Server

- Install dependencies: `npm install` (in `greenci/`)
- Run server: `node server.js`

## Dashboard

The dashboard is available at `greenci/public/dashboard.html` and displays job queues, active jobs, and completed jobs with real-time updates.

## Images & Assets

- Dashboard and detail tiles are in `greenci/public/images/`
- Custom splash and background images for the dashboard

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request

---