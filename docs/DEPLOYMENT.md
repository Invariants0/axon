# AXON DigitalOcean Gradient Integration Deployment Guide

## Architecture Overview

AXON Runtime → DigitalOceanAgentRouter → ADK Agents (deployed on DigitalOcean)

## Backend Configuration

### 1. Environment Variables

Edit `backend/.env`:
```bash
# AXON Mode: mock (test mode) or real (DigitalOcean agents)
AXON_MODE=real

# DigitalOcean API Token
DIGITALOCEAN_API_TOKEN=your_do_api_token_here

# Agent URLs (from ADK deployment)
AXON_PLANNER_AGENT_URL=https://agents.do-ai.run/<planner-id>
AXON_RESEARCH_AGENT_URL=https://agents.do-ai.run/<research-id>
AXON_REASONING_AGENT_URL=https://agents.do-ai.run/<reasoning-id>
AXON_BUILDER_AGENT_URL=https://agents.do-ai.run/<builder-id>
```

### 2. Install Dependencies

```bash
cd backend
python -m pip install -r requirements.txt
```

### 3. Run Backend

```bash
cd backend
python -m uvicorn src.main:app --reload
```

## Agent Deployment

### 1. Install Gradient ADK

```bash
pip install gradient-adk
```

### 2. Authenticate

```bash
export DIGITALOCEAN_API_TOKEN=your_token_here
```

### 3. Deploy Each Agent

```bash
# Planner
cd agents/planner_agent
gradient-adk deploy

# Research
cd agents/research_agent
gradient-adk deploy

# Reasoning
cd agents/reasoning_agent
gradient-adk deploy

# Builder
cd agents/builder_agent
gradient-adk deploy
```

### 4. Copy Agent URLs

After each deployment, copy the agent URL and add to `backend/.env`

## Testing

### Test Mock Mode
```bash
curl -X POST http://localhost:8000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test task", "description": "Test description"}'
```

### Test Real Mode
Set `AXON_MODE=real` in `.env` and restart backend

```bash
curl -X POST http://localhost:8000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Build a REST API", "description": "Create a FastAPI REST API with CRUD operations"}'
```

## Observability

### Backend Logs
```bash
tail -f backend/audit.log
```

### Agent Logs
```bash
gradient-adk logs <agent-id>
```

## File Structure

```
.
├── agents/
│   ├── planner_agent/
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   └── .env.example
│   ├── research_agent/
│   ├── reasoning_agent/
│   └── builder_agent/
├── backend/
│   └── src/
│       ├── agents/
│       │   ├── planning_agent.py (modified)
│       │   ├── research_agent.py (modified)
│       │   ├── reasoning_agent.py (modified)
│       │   └── builder_agent.py (modified)
│       ├── providers/
│       │   └── digitalocean/
│       │       ├── digitalocean_agent_client.py
│       │       ├── digitalocean_agent_router.py
│       │       └── digitalocean_agent_types.py
│       ├── config/
│       │   └── config.py (modified)
│       └── core/
│           └── agent_orchestrator.py (modified)
└── .env.example (modified)
```

## Troubleshooting

### Agent Not Responding
- Check agent URL is correct
- Verify DIGITALOCEAN_API_TOKEN is valid
- Check agent logs: `gradient-adk logs <agent-id>`

### Backend Errors
- Verify AXON_MODE is set correctly
- Check all agent URLs are configured
- Review backend logs

### Fallback to Mock Mode
Set `AXON_MODE=mock` to use local mock agents for testing

## CI/CD Auto Deploy (GitHub Actions)

This repository includes a workflow at `.github/workflows/ci-cd.yml`.

### Triggers

- Pull requests targeting `main`: runs CI checks
- Pushes to `main`: runs CI checks, then deploys to server

### Required GitHub Secrets

Configure these in **Settings → Secrets and variables → Actions**:

- `DEPLOY_HOST`: server hostname or IP
- `DEPLOY_USER`: SSH username
- `DEPLOY_SSH_KEY`: private SSH key for the deploy user
- `DEPLOY_PORT`: SSH port (optional, defaults to `22`)
- `DEPLOY_PATH`: absolute path on server where repo is checked out

### Server Requirements

- Docker and Docker Compose plugin installed
- Repository cloned at `DEPLOY_PATH`
- Deploy user has permission to run `docker compose`
- Target branch `main` exists on origin

### Deployment Behavior

On each push to `main`, GitHub Actions connects via SSH and runs:

```bash
cd "$DEPLOY_PATH"
git fetch --all
git checkout main
git reset --hard origin/main
docker compose up -d --build --remove-orphans
docker image prune -f
```
