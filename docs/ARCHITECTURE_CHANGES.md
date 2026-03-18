# Architecture Changes - Native Gradient Upgrade

## Overview

AXON has been upgraded from a hybrid AI system to a fully native DigitalOcean Gradient AI Platform implementation.

## Before Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        AXON Backend                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │ LLMService   │──────│ Gradient AI  │                    │
│  │              │      │ (DO)         │                    │
│  │              │──────│ HuggingFace  │                    │
│  │              │      │              │                    │
│  │              │──────│ Local Model  │                    │
│  └──────────────┘      └──────────────┘                    │
│         │                                                    │
│         ↓                                                    │
│  ┌──────────────────────────────────────┐                  │
│  │    DigitalOcean Agent Router         │                  │
│  └──────────────────────────────────────┘                  │
│         │                                                    │
└─────────┼────────────────────────────────────────────────────┘
          │
          ↓
┌─────────────────────────────────────────────────────────────┐
│                   DigitalOcean ADK Agents                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Planner      │  │ Research     │  │ Reasoning    │     │
│  │              │  │              │  │              │     │
│  │ LangChain    │  │ LangChain    │  │ LangChain    │     │
│  │ OpenAI       │  │ OpenAI       │  │ OpenAI       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐                                           │
│  │ Builder      │                                           │
│  │              │                                           │
│  │ LangChain    │                                           │
│  │ OpenAI       │                                           │
│  └──────────────┘                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
          │
          ↓
┌─────────────────────────────────────────────────────────────┐
│                      OpenAI API                              │
└─────────────────────────────────────────────────────────────┘
```

## After Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        AXON Backend                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐                                           │
│  │ LLMService   │  (DISABLED in real mode)                 │
│  │ (Mock only)  │                                           │
│  └──────────────┘                                           │
│         │                                                    │
│         ↓                                                    │
│  ┌──────────────────────────────────────┐                  │
│  │    DigitalOcean Agent Router         │                  │
│  │    - Streaming support               │                  │
│  │    - Trace propagation               │                  │
│  │    - Session tracking                │                  │
│  └──────────────────────────────────────┘                  │
│         │                                                    │
└─────────┼────────────────────────────────────────────────────┘
          │
          ↓
┌─────────────────────────────────────────────────────────────┐
│                   DigitalOcean ADK Agents                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Planner      │  │ Research     │  │ Reasoning    │     │
│  │              │  │              │  │              │     │
│  │ LangGraph    │  │ LangGraph    │  │ LangGraph    │     │
│  │ Gradient SDK │  │ Gradient SDK │  │ Gradient SDK │     │
│  │              │  │ + KB Retriev │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐                                           │
│  │ Builder      │                                           │
│  │              │                                           │
│  │ LangGraph    │                                           │
│  │ Gradient SDK │                                           │
│  └──────────────┘                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
          │
          ↓
┌─────────────────────────────────────────────────────────────┐
│              DigitalOcean Gradient Inference                 │
├─────────────────────────────────────────────────────────────┤
│  https://inference.do-ai.run                                │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ openai-gpt   │  │ llama3-70b   │  │ llama3-8b    │     │
│  │ -oss-120b    │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  GPU-backed foundation models                               │
└─────────────────────────────────────────────────────────────┘
          │
          ↓ (Optional)
┌─────────────────────────────────────────────────────────────┐
│           DigitalOcean Knowledge Base                        │
├─────────────────────────────────────────────────────────────┤
│  Document retrieval for research agent                      │
└─────────────────────────────────────────────────────────────┘
```

## Key Changes

### 1. Dependency Removal
**Before:**
- langchain
- langchain-openai
- langchain-core
- OpenAI API dependency

**After:**
- gradient SDK only
- No OpenAI dependency
- Simplified dependency tree

### 2. Inference Layer
**Before:**
- Multiple LLM providers (OpenAI, Gradient, HuggingFace, Local)
- Fallback chain
- Backend makes direct LLM calls

**After:**
- Single inference endpoint: DigitalOcean Gradient
- Backend LLM disabled in real mode
- All reasoning through ADK agents

### 3. Agent Implementation
**Before:**
```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini")
response = await llm.ainvoke(messages)
```

**After:**
```python
from gradient import AsyncGradient

client = AsyncGradient(
    inference_endpoint="https://inference.do-ai.run",
    model_access_key=os.environ["GRADIENT_MODEL_ACCESS_KEY"],
)
response = await client.chat.completions.create(
    model="openai-gpt-oss-120b",
    messages=messages,
)
```

### 4. Backend LLM Service
**Before:**
```python
async def chat(self, messages):
    # Try Gradient
    # Fallback to HuggingFace
    # Fallback to local model
```

**After:**
```python
async def chat(self, messages):
    if self.settings.axon_mode == "real":
        return "ERROR: Use ADK agents"
    # Only active in mock/test mode
```

### 5. Communication Protocol
**Before:**
- Simple HTTP POST
- Basic trace ID

**After:**
- HTTP POST with streaming support
- Headers: X-Trace-ID, X-AXON-SESSION
- Configurable timeout
- Enhanced logging

### 6. Knowledge Integration
**Before:**
- No knowledge base integration

**After:**
- Research stage uses vector memory context retrieval
- Prompts are augmented with retrieved Qdrant context
- Configurable via VECTOR_DB_PROVIDER and QDRANT_* settings

### 7. Evaluation Pipeline
**Before:**
- Manual testing only

**After:**
- Automated evaluation script
- CSV-based test datasets
- Accuracy metrics
- Results export

## Data Flow

### Task Execution (Real Mode)

```
1. User submits task
   ↓
2. TaskManager queues task
   ↓
3. AgentOrchestrator generates trace_id
   ↓
4. For each agent stage:
   ├─ Load context from VectorStore
   ├─ Build prompt
   ├─ DigitalOceanAgentRouter.route_to_agent()
   │  ├─ Add X-Trace-ID header
   │  ├─ Add X-AXON-SESSION header
   │  └─ POST to agent URL
   ├─ ADK Agent receives request
   │  ├─ LangGraph workflow executes
   │  ├─ Gradient SDK calls inference endpoint
   │  ├─ (Research: Qdrant memory context)
   │  └─ Returns JSON response
   ├─ Parse response
   ├─ Store in VectorStore
   ├─ Record in database
   └─ Emit event
   ↓
5. Aggregate results
   ↓
6. Update task status
   ↓
7. Return response
```

### Streaming Flow

```
1. Client requests streaming
   ↓
2. DigitalOceanAgentRouter.route_to_agent_stream()
   ↓
3. HTTP streaming POST to agent
   ↓
4. Agent streams response chunks
   ↓
5. Backend yields chunks
   ↓
6. WebSocket broadcasts to frontend
   ↓
7. Frontend displays incremental response
```

## Configuration Changes

### Agent Configuration
**Before:**
```bash
OPENAI_API_KEY=sk-...
```

**After:**
```bash
GRADIENT_MODEL_ACCESS_KEY=gm-...
GRADIENT_MODEL=openai-gpt-oss-120b
```

### Backend Configuration
**Before:**
```bash
AXON_MODE=mock
DIGITALOCEAN_API_TOKEN=...
AXON_PLANNER_AGENT_URL=...
```

**After:**
```bash
AXON_MODE=real
DIGITALOCEAN_API_TOKEN=...
GRADIENT_MODEL_ACCESS_KEY=...
VECTOR_DB_PROVIDER=qdrant
QDRANT_URL=...
QDRANT_API_KEY=...
QDRANT_COLLECTION=axon_memory
AXON_AGENT_TIMEOUT=120
AXON_PLANNER_AGENT_URL=...
AXON_RESEARCH_AGENT_URL=...
AXON_REASONING_AGENT_URL=...
AXON_BUILDER_AGENT_URL=...
```

## Performance Characteristics

### Latency
- Agent call: ~2-5s (model dependent)
- Streaming: First token ~500ms
- KB retrieval: +200-500ms

### Throughput
- Concurrent agent calls: Limited by DO quotas
- Backend queue: Unlimited
- Database: Connection pooled

### Scalability
- Agents: Auto-scaled by DigitalOcean
- Backend: Horizontal scaling supported
- Database: PostgreSQL with connection pooling

## Security Model

### Authentication
- Backend → Agents: Bearer token (DIGITALOCEAN_API_TOKEN)
- Agents → Inference: API key (GRADIENT_MODEL_ACCESS_KEY)
- Agents → KB: Same API key

### Authorization
- Agent URLs are private
- API keys are environment-specific
- No public endpoints

### Tracing
- X-Trace-ID: Request tracking
- X-AXON-SESSION: User session tracking
- Logged at each layer

## Observability

### Metrics
- Agent latency per stage
- Inference token usage
- KB retrieval count
- Error rates

### Logs
- Structured JSON logging
- Trace ID propagation
- Session ID tracking
- Agent name, URL, payload size

### Health Checks
- Backend health endpoint
- Agent reachability checks
- Database connectivity
- Vector store status

## Cost Model

### Before
- OpenAI API: Pay per token
- DigitalOcean: Agent hosting only

### After
- DigitalOcean: Agent hosting + inference
- Gradient: Pay per token (DO pricing)
- Knowledge Base: Storage + retrieval

## Migration Path

1. Update agent dependencies
2. Configure Gradient credentials
3. Deploy agents
4. Update backend config
5. Set AXON_MODE=real
6. Test and validate
7. Monitor and optimize

## Rollback Strategy

1. Set AXON_MODE=mock
2. Backend uses local LLM service
3. Agents remain deployed but unused
4. No code changes required
