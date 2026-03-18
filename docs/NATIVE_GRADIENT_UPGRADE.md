# AXON Native DigitalOcean Gradient AI Platform Upgrade

## Changes Summary

### 1. ADK Agents - Removed OpenAI Dependencies
**Modified Files:**
- `agents/planner_agent/main.py`
- `agents/research_agent/main.py`
- `agents/reasoning_agent/main.py`
- `agents/builder_agent/main.py`
- `agents/*/requirements.txt`
- `agents/*/.env.example`

**Changes:**
- Removed: `langchain-openai`, `langchain`, `langchain-core`
- Added: `gradient` SDK
- Replaced `ChatOpenAI` with `AsyncGradient`
- Updated inference endpoint: `https://inference.do-ai.run`
- Model: `openai-gpt-oss-120b` (configurable via `GRADIENT_MODEL`)
- Authentication: `GRADIENT_MODEL_ACCESS_KEY`

### 2. Backend LLM Service - Real Mode Protection
**Modified File:** `backend/src/ai/llm_service.py`

**Changes:**
- Added check: if `AXON_MODE == "real"`, backend LLM calls are blocked
- Returns error message directing to use ADK agents
- LLM service only active in mock/test modes
- All reasoning must go through deployed ADK agents

### 3. Configuration Updates
**Modified Files:**
- `backend/.env.example`
- `backend/src/config/config.py`

**New Environment Variables:**
- `GRADIENT_MODEL_ACCESS_KEY`: Gradient inference API key
- `VECTOR_DB_PROVIDER`: Vector backend (`qdrant` for production)
- `QDRANT_URL`: Qdrant cluster URL (required when provider is qdrant)
- `QDRANT_API_KEY`: Qdrant API key (required when provider is qdrant)
- `QDRANT_COLLECTION`: Collection name for memory retrieval
- `AXON_AGENT_TIMEOUT`: Agent timeout in seconds (default: 120)
- `GRADIENT_MODEL`: Model name (default: openai-gpt-oss-120b)

### 4. Agent Client - Streaming & Trace Propagation
**Modified File:** `backend/src/providers/digitalocean/digitalocean_agent_client.py`

**New Features:**
- `call_agent_stream()`: Async streaming support
- Headers: `X-Trace-ID`, `X-AXON-SESSION`
- Configurable timeout from settings
- Enhanced logging with session_id

### 5. Agent Router - Streaming Support
**Modified File:** `backend/src/providers/digitalocean/digitalocean_agent_router.py`

**New Methods:**
- `route_to_agent_stream()`: Stream responses from agents
- Session ID propagation
- Enhanced logging

### 6. Knowledge Integration
**Modified File:** `agents/research_agent/main.py`

**Features:**
- Uses backend-provided memory context retrieved from vector store
- Context is labeled as Qdrant memory context in research prompts
- No DigitalOcean KB UUID dependency in agent runtime

### 7. Agent Evaluation Pipeline
**New Files:**
- `utils/run_agent_evaluation.py`
- `utils/evaluation_dataset_example.csv`

**Features:**
- CSV-based evaluation dataset
- Automated agent testing
- Accuracy metrics
- Results export

## Deployment Instructions

### 1. Update Agent Dependencies
```bash
cd agents/planner_agent
pip install -r requirements.txt

cd ../research_agent
pip install -r requirements.txt

cd ../reasoning_agent
pip install -r requirements.txt

cd ../builder_agent
pip install -r requirements.txt
```

### 2. Configure Agent Environment
```bash
# For each agent directory
cp .env.example .env
```

Edit `.env`:
```bash
GRADIENT_MODEL_ACCESS_KEY=your_gradient_key
GRADIENT_MODEL=openai-gpt-oss-120b
DIGITALOCEAN_API_TOKEN=your_do_token
```

### 3. Deploy Agents
```bash
cd agents/planner_agent && gradient-adk deploy
cd agents/research_agent && gradient-adk deploy
cd agents/reasoning_agent && gradient-adk deploy
cd agents/builder_agent && gradient-adk deploy
```

### 4. Configure Backend
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
AXON_PLANNER_AGENT_URL=https://agents.do-ai.run/<planner-id>
AXON_RESEARCH_AGENT_URL=https://agents.do-ai.run/<research-id>
AXON_REASONING_AGENT_URL=https://agents.do-ai.run/<reasoning-id>
AXON_BUILDER_AGENT_URL=https://agents.do-ai.run/<builder-id>
```

### 5. Run Backend
```bash
cd backend
python -m uvicorn src.main:app --reload
```

### 6. Run Agent Evaluation
```bash
python utils/run_agent_evaluation.py utils/evaluation_dataset_example.csv planner
```

## Architecture Changes

### Before (Hybrid Mode)
```
AXON Backend → LLMService → OpenAI/Gradient/HuggingFace
              ↓
              ADK Agents → OpenAI (via langchain-openai)
```

### After (Native Gradient)
```
AXON Backend (real mode) → DigitalOcean ADK Agents → Gradient Inference
                                                    ↓
                                                    openai-gpt-oss-120b
                                                    llama3-70b
                                                    (GPU-backed models)

AXON Backend (mock mode) → LLMService → Test responses
```

## Supported Models

- `openai-gpt-oss-120b` (default)
- `llama3-70b`
- `llama3-8b`
- Other Gradient-supported models

Configure via `GRADIENT_MODEL` environment variable.

## Health Checks

All agent health checks remain functional via:
```bash
curl http://localhost:8000/system/health
```

Backend verifies:
- Planner agent reachable
- Research agent reachable
- Reasoning agent reachable
- Builder agent reachable

## Streaming Support

Agents now support streaming responses:
```python
async for chunk in router.route_to_agent_stream(
    "planner",
    prompt="Create a plan",
    trace_id="trace-123",
    session_id="session-456",
):
    print(chunk)
```

## Trace Propagation

All agent calls include:
- `X-Trace-ID`: Request trace ID
- `X-AXON-SESSION`: Session identifier

Logged at each stage for observability.

## Knowledge Usage

Research agent consumes memory context produced by backend vector retrieval (Qdrant when `VECTOR_DB_PROVIDER=qdrant`).

## Testing

### Mock Mode
```bash
AXON_MODE=mock
```
Uses local test responses, no external API calls.

### Real Mode
```bash
AXON_MODE=real
```
Routes all reasoning to deployed ADK agents on DigitalOcean.

## Migration Checklist

- [ ] Update agent dependencies
- [ ] Configure agent environment variables
- [ ] Deploy agents to DigitalOcean
- [ ] Update backend environment variables
- [ ] Set AXON_MODE=real
- [ ] Test agent health checks
- [ ] Run evaluation pipeline
- [ ] Monitor agent logs
- [ ] Verify trace propagation
- [ ] Test streaming responses (if needed)
- [ ] Configure knowledge base (optional)

## Rollback

To rollback to hybrid mode:
1. Set `AXON_MODE=mock` in backend/.env
2. Backend will use local LLM service
3. Agents remain deployed but unused

## Performance

- Agent timeout: 120s (configurable)
- Retry attempts: 3
- Exponential backoff: 1-10s
- Streaming: Enabled
- Knowledge base retrieval: 5 documents max

## Security

- Bearer token authentication for all agent calls
- API key authentication for Gradient inference
- Trace ID for request tracking
- Session ID for user tracking
