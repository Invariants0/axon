# Deployment Commands

## Agent Deployment

### Install ADK
```bash
pip install gradient-adk
```

### Deploy Planner Agent
```bash
cd agents/planner_agent
cp .env.example .env
# Edit .env: add OPENAI_API_KEY and DIGITALOCEAN_API_TOKEN
gradient-adk deploy
# Copy output URL to backend/.env as AXON_PLANNER_AGENT_URL
```

### Deploy Research Agent
```bash
cd agents/research_agent
cp .env.example .env
# Edit .env: add OPENAI_API_KEY and DIGITALOCEAN_API_TOKEN
gradient-adk deploy
# Copy output URL to backend/.env as AXON_RESEARCH_AGENT_URL
```

### Deploy Reasoning Agent
```bash
cd agents/reasoning_agent
cp .env.example .env
# Edit .env: add OPENAI_API_KEY and DIGITALOCEAN_API_TOKEN
gradient-adk deploy
# Copy output URL to backend/.env as AXON_REASONING_AGENT_URL
```

### Deploy Builder Agent
```bash
cd agents/builder_agent
cp .env.example .env
# Edit .env: add OPENAI_API_KEY and DIGITALOCEAN_API_TOKEN
gradient-adk deploy
# Copy output URL to backend/.env as AXON_BUILDER_AGENT_URL
```

## Backend Configuration

### Configure Environment
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```bash
AXON_MODE=real
DIGITALOCEAN_API_TOKEN=<your_token>
AXON_PLANNER_AGENT_URL=https://agents.do-ai.run/<planner-id>
AXON_RESEARCH_AGENT_URL=https://agents.do-ai.run/<research-id>
AXON_REASONING_AGENT_URL=https://agents.do-ai.run/<reasoning-id>
AXON_BUILDER_AGENT_URL=https://agents.do-ai.run/<builder-id>
```

### Install Backend Dependencies
```bash
cd backend
uv sync
```

### Run Backend
```bash
cd backend
uv run start.py
```

## Testing

### Test Mock Mode
```bash
curl -X POST http://localhost:8000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test task",
    "description": "Test description"
  }'
```

### Test Real Mode
```bash
# Set AXON_MODE=real in backend/.env
curl -X POST http://localhost:8000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build a REST API",
    "description": "Create a FastAPI REST API with CRUD operations"
  }'
```

### Check Task Status
```bash
curl http://localhost:8000/tasks
```

### Get Task Details
```bash
curl http://localhost:8000/tasks/<task_id>
```

## Agent Management

### Check Agent Status
```bash
gradient-adk status <agent-id>
```

### View Agent Logs
```bash
gradient-adk logs <agent-id>
```

### Test Agent Locally
```bash
cd agents/planner_agent
gradient-adk run --input '{
  "prompt": "Create a plan for building a REST API",
  "context": {}
}'
```

### Update Agent
```bash
cd agents/planner_agent
# Modify main.py
gradient-adk deploy
```

### Delete Agent
```bash
gradient-adk delete <agent-id>
```

## Monitoring

### Backend Logs
```bash
tail -f backend/audit.log
```

### Agent Health Check
```bash
curl http://localhost:8000/system/health
```
