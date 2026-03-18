# Deployment Commands - Native Gradient Upgrade

## 1. Update Agent Dependencies

```bash
# Planner Agent
cd agents/planner_agent
pip install gradient gradient-adk langgraph

# Research Agent
cd ../research_agent
pip install gradient gradient-adk langgraph

# Reasoning Agent
cd ../reasoning_agent
pip install gradient gradient-adk langgraph

# Builder Agent
cd ../builder_agent
pip install gradient gradient-adk langgraph
```

## 2. Configure Agent Environments

```bash
# Planner
cd agents/planner_agent
cp .env.example .env
# Edit .env with your keys

# Research
cd ../research_agent
cp .env.example .env
# Edit .env with your keys

# Reasoning
cd ../reasoning_agent
cp .env.example .env
# Edit .env with your keys

# Builder
cd ../builder_agent
cp .env.example .env
# Edit .env with your keys
```

Required in each `.env`:
```bash
GRADIENT_MODEL_ACCESS_KEY=your_gradient_key_here
GRADIENT_MODEL=openai-gpt-oss-120b
DIGITALOCEAN_API_TOKEN=your_do_token_here
```

## 3. Deploy Agents to DigitalOcean

```bash
# Deploy Planner
cd agents/planner_agent
gradient-adk deploy
# Copy the agent URL

# Deploy Research
cd ../research_agent
gradient-adk deploy
# Copy the agent URL

# Deploy Reasoning
cd ../reasoning_agent
gradient-adk deploy
# Copy the agent URL

# Deploy Builder
cd ../builder_agent
gradient-adk deploy
# Copy the agent URL
```

## 4. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```bash
AXON_MODE=real
DIGITALOCEAN_API_TOKEN=your_do_token
GRADIENT_MODEL_ACCESS_KEY=your_gradient_key
VECTOR_DB_PROVIDER=qdrant
QDRANT_URL=https://your-cluster.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=axon_memory
AXON_AGENT_TIMEOUT=120

# Paste agent URLs from deployment
AXON_PLANNER_AGENT_URL=https://agents.do-ai.run/<planner-id>
AXON_RESEARCH_AGENT_URL=https://agents.do-ai.run/<research-id>
AXON_REASONING_AGENT_URL=https://agents.do-ai.run/<reasoning-id>
AXON_BUILDER_AGENT_URL=https://agents.do-ai.run/<builder-id>
```

## 5. Install Backend Dependencies

```bash
cd backend
python -m pip install -r requirements.txt
```

## 6. Initialize Database

```bash
cd backend
python -m alembic upgrade head
```

## 7. Run Backend

```bash
cd backend
python -m uvicorn src.main:app --reload
```

## 8. Test System Health

```bash
curl http://localhost:8000/health
curl http://localhost:8000/system/health
```

## 9. Test Task Creation

```bash
curl -X POST http://localhost:8000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build a REST API",
    "description": "Create a FastAPI REST API with CRUD operations"
  }'
```

## 10. Run Agent Evaluation

```bash
python utils/run_agent_evaluation.py \
  utils/evaluation_dataset_example.csv \
  planner
```

## 11. Monitor Agent Logs

```bash
# Planner
gradient-adk logs <planner-agent-id>

# Research
gradient-adk logs <research-agent-id>

# Reasoning
gradient-adk logs <reasoning-agent-id>

# Builder
gradient-adk logs <builder-agent-id>
```

## 12. Check Agent Status

```bash
gradient-adk status <agent-id>
```

## Rollback to Mock Mode

```bash
# Edit backend/.env
AXON_MODE=mock

# Restart backend
cd backend
python -m uvicorn src.main:app --reload
```

## Update Agents

```bash
cd agents/planner_agent
# Modify main.py
gradient-adk deploy
```

## Delete Agents

```bash
gradient-adk delete <agent-id>
```

## Environment Variables Reference

### Agent .env
```bash
GRADIENT_MODEL_ACCESS_KEY=     # Required
GRADIENT_MODEL=                # Default: openai-gpt-oss-120b
DIGITALOCEAN_API_TOKEN=        # Required
```

### Backend .env
```bash
AXON_MODE=                     # mock or real
DIGITALOCEAN_API_TOKEN=        # Required for real mode
GRADIENT_MODEL_ACCESS_KEY=     # Required for real mode
VECTOR_DB_PROVIDER=            # Set to qdrant for production vector memory
QDRANT_URL=                    # Required when VECTOR_DB_PROVIDER=qdrant
QDRANT_API_KEY=                # Required when VECTOR_DB_PROVIDER=qdrant
QDRANT_COLLECTION=             # Optional (default: axon_memory)
AXON_AGENT_TIMEOUT=            # Default: 120
AXON_PLANNER_AGENT_URL=        # Required for real mode
AXON_RESEARCH_AGENT_URL=       # Required for real mode
AXON_REASONING_AGENT_URL=      # Required for real mode
AXON_BUILDER_AGENT_URL=        # Required for real mode
```

## Troubleshooting

### Agent deployment fails
```bash
# Check credentials
echo $DIGITALOCEAN_API_TOKEN
echo $GRADIENT_MODEL_ACCESS_KEY

# Verify ADK installation
gradient-adk --version
```

### Backend can't reach agents
```bash
# Test agent URL directly
curl -X POST https://agents.do-ai.run/<agent-id>/run \
  -H "Authorization: Bearer $DIGITALOCEAN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test"}'
```

### LLM calls blocked in real mode
```bash
# Verify AXON_MODE
grep AXON_MODE backend/.env

# Should be: AXON_MODE=real
```

### Qdrant context not working
```bash
# Verify vector provider
grep VECTOR_DB_PROVIDER backend/.env

# Verify Qdrant config
grep QDRANT_URL backend/.env
grep QDRANT_API_KEY backend/.env
```
