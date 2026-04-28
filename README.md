# GreenCI

GreenCI is a lightweight Jenkins-inspired Continuous Integration system built using Node.js, Express, MongoDB, and a custom worker scheduler. It automatically executes pipelines on every GitHub push using a `.greenci.yml` configuration file and displays real-time job status on a dashboard.

## Features

- GitHub webhook-triggered pipelines
- YAML-based pipeline configuration (`.greenci.yml`)
- Language-aware worker pool scheduling (Node, Python, C++)
- MongoDB-backed job persistence
- Real-time dashboard with Queue, Active, and Done views
- Live stage status tracking and logs
- Workspace isolation per job
- Automatic cleanup of old workspaces

## Tech Stack

Backend: Node.js, Express.js  
Database: MongoDB, Mongoose  
Frontend: HTML, CSS, JavaScript  

## How It Works

1. Push code to GitHub
2. Webhook triggers GreenCI server
3. Job enters queue
4. Worker is assigned automatically
5. Repository is cloned
6. Pipeline executes using `.greenci.yml`
7. Results appear on dashboard

## Example Pipeline File

Create `.greenci.yml` inside your repo:

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