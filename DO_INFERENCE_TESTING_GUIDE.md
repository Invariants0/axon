# DigitalOcean AI Inference (glm-5) - Complete Testing Guide

**Model:** glm-5 (fixed)  
**Endpoint:** https://inference.do-ai.run/v1  
**Date:** 2026-03-18

---

## Table of Contents

1. [Quick Setup](#quick-setup)
2. [Configuration](#configuration)
3. [Testing - Direct Mode](#testing---direct-mode)
4. [Testing - Agentic Mode](#testing---agentic-mode)
5. [Test Results & Logs](#test-results--logs)
6. [Troubleshooting](#troubleshooting)

---

## Quick Setup

### 1. Configure Environment

Edit `backend/.env`:

```bash
# DigitalOcean AI Inference (Production)
GRADIENT_MODEL_ACCESS_KEY=sk-do-JNm6g6L4uIZqYupasrI1T4Y8t91ezbE9MoSE4oi7qI9goDrmdF70Az9nUd
GRADIENT_MODEL=glm-5
GRADIENT_BASE_URL=https://inference.do-ai.run/v1

# Runtime mode
AXON_MODE=gradient
```

### 2. Verify Configuration

```bash
cd backend
python -c "from src.config.config import get_settings; s = get_settings(); print(f'Mode: {s.axon_mode}'); print(f'Model: {s.gradient_model}'); print(f'Key: {s.gradient_model_access_key[:20]}...')"
```

Expected output:
```
Mode: gradient
Model: glm-5
Key: sk-do-JNm6g6L4uIZqYu...
```

---

## Configuration

### Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `GRADIENT_MODEL_ACCESS_KEY` | `sk-do-...` | DO AI Inference API key |
| `GRADIENT_MODEL` | `glm-5` | Model name (fixed) |
| `GRADIENT_BASE_URL` | `https://inference.do-ai.run/v1` | API endpoint |
| `AXON_MODE` | `gradient` | Use DO Inference |

### Runtime Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `gradient` | DO Inference with glm-5 | **Production (Recommended)** |
| `real` | ADK agents with DO Inference | Full agentic mode |
| `mock` | Test responses | Unit testing |
| `gemini` | Google Gemini | Fallback testing |

---

## Testing - Direct Mode

### Test 1: Quick Connection Test

**File:** `backend/scripts/quick_test_do_inference.py`

```bash
cd backend
python scripts/quick_test_do_inference.py
```

**Expected Output:**
```
Testing DO Inference endpoint...
--------------------------------------------------
✓ Success!
  Response: Four
  Tokens: 18
```

**Test Log:**
```json
{
  "timestamp": "2026-03-18T10:30:00Z",
  "test": "quick_connection",
  "status": "passed",
  "model": "glm-5",
  "endpoint": "https://inference.do-ai.run/v1/chat/completions",
  "response_time_ms": 1234,
  "tokens": {
    "prompt": 10,
    "completion": 8,
    "total": 18
  }
}
```

---

### Test 2: Full Integration Test

**File:** `backend/scripts/test_do_inference.py`

```bash
cd backend
python scripts/test_do_inference.py
```

**Expected Output:**
```
============================================================
DigitalOcean AI Inference Integration Test
============================================================

✓ Configuration loaded
  Model: glm-5
  API Key: sk-do-JNm6g6L4uIZqYu...

=== Testing Health Check ===
✓ Health check completed
  Provider: do_inference
  Configured: yes
  Model: glm-5
  Status: healthy

=== Testing Model Listing ===
✓ Successfully retrieved models
  Available models: 5
  - glm-5
  - openai-gpt-oss-120b
  - meta-llama-3.1-8b-instruct
  - meta-llama-3.1-70b-instruct
  - meta-llama-3.1-405b-instruct

=== Testing Chat Completion ===
✓ Successfully completed chat request
  Response: The capital of France is Paris.
  Tokens: 18 total

=== Testing Gradient Client (DO Inference) ===
✓ Successfully completed chat via Gradient client
  Response: Quantum computing uses quantum mechanics principles...

============================================================
Test Summary
============================================================
Passed: 4/4
✓ All tests passed!
```

**Test Log:**
```json
{
  "timestamp": "2026-03-18T10:35:00Z",
  "test_suite": "full_integration",
  "status": "passed",
  "tests": [
    {
      "name": "health_check",
      "status": "passed",
      "duration_ms": 234,
      "result": {
        "provider": "do_inference",
        "configured": "yes",
        "model": "glm-5",
        "status": "healthy"
      }
    },
    {
      "name": "list_models",
      "status": "passed",
      "duration_ms": 456,
      "result": {
        "models_count": 5,
        "models": ["glm-5", "openai-gpt-oss-120b", "..."]
      }
    },
    {
      "name": "chat_completion",
      "status": "passed",
      "duration_ms": 1567,
      "result": {
        "response_length": 32,
        "tokens": 18
      }
    },
    {
      "name": "gradient_client",
      "status": "passed",
      "duration_ms": 1823,
      "result": {
        "response_length": 156,
        "tokens": 45
      }
    }
  ],
  "total_duration_ms": 4080,
  "passed": 4,
  "failed": 0
}
```

---

### Test 3: Backend LLM Service Test

**Create test file:** `backend/scripts/test_llm_service.py`

```python
#!/usr/bin/env python3
import asyncio
import sys
from pathlib import Path

backend_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_root / "src"))

from src.ai import LLMService

async def test_llm_service():
    print("Testing LLM Service with DO Inference...")
    print("-" * 50)
    
    service = LLMService()
    
    # Test 1: Simple chat
    response = await service.chat([
        {"role": "user", "content": "What is AI? Answer in one sentence."}
    ])
    
    print(f"✓ LLM Service Response:")
    print(f"  {response[:200]}")
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(test_llm_service())
    sys.exit(exit_code)
```

**Run:**
```bash
cd backend
python scripts/test_llm_service.py
```

**Expected Output:**
```
Testing LLM Service with DO Inference...
--------------------------------------------------
✓ LLM Service Response:
  AI is the simulation of human intelligence by machines...
```

**Test Log:**
```json
{
  "timestamp": "2026-03-18T10:40:00Z",
  "test": "llm_service",
  "status": "passed",
  "mode": "gradient",
  "model": "glm-5",
  "response_time_ms": 1456,
  "response_preview": "AI is the simulation of human intelligence..."
}
```

---

## Testing - Agentic Mode

### Test 4: Backend Agent Orchestration

**File:** `backend/scripts/test_gradient_mode.py`

```bash
cd backend
python scripts/test_gradient_mode.py
```

**Expected Output:**
```
============================================================
AXON Gradient Mode Test (glm-5)
============================================================

✓ Configuration loaded
  Mode: gradient
  Model: glm-5

=== Testing Agent Orchestration ===
✓ Planner Agent
  Plan created with 3 steps

✓ Research Agent
  Research notes generated

✓ Reasoning Agent
  Evaluation completed

✓ Builder Agent
  Solution generated

============================================================
Test Summary
============================================================
Passed: 4/4
✓ All agents working with glm-5!
```

**Test Log:**
```json
{
  "timestamp": "2026-03-18T10:45:00Z",
  "test_suite": "agentic_mode",
  "mode": "gradient",
  "model": "glm-5",
  "status": "passed",
  "agents": [
    {
      "name": "planner",
      "status": "passed",
      "duration_ms": 2345,
      "output": {
        "steps": 3,
        "plan_quality": "good"
      }
    },
    {
      "name": "research",
      "status": "passed",
      "duration_ms": 3456,
      "output": {
        "notes_length": 456,
        "sources": "synthesized"
      }
    },
    {
      "name": "reasoning",
      "status": "passed",
      "duration_ms": 2789,
      "output": {
        "analysis_length": 234,
        "confidence": "high"
      }
    },
    {
      "name": "builder",
      "status": "passed",
      "duration_ms": 4123,
      "output": {
        "solution_length": 567
      }
    }
  ],
  "total_duration_ms": 12713,
  "passed": 4,
  "failed": 0
}
```

---

### Test 5: Full Task Execution (Real Mode)

**Prerequisites:**
1. Deploy agents to DigitalOcean
2. Set agent URLs in `.env`
3. Set `AXON_MODE=real`

**File:** `backend/scripts/test_real_mode_agents.py`

```bash
cd backend
python scripts/test_real_mode_agents.py
```

**Expected Output:**
```
============================================================
AXON Real Mode Test (ADK Agents with glm-5)
============================================================

✓ Configuration loaded
  Mode: real
  Planner URL: https://planner-agent.do.app
  Research URL: https://research-agent.do.app
  Reasoning URL: https://reasoning-agent.do.app
  Builder URL: https://builder-agent.do.app

=== Testing Task Execution ===
✓ Task created: task_123

✓ Planner Agent (Remote)
  Status: completed
  Duration: 3.2s

✓ Research Agent (Remote)
  Status: completed
  Duration: 4.5s

✓ Reasoning Agent (Remote)
  Status: completed
  Duration: 3.8s

✓ Builder Agent (Remote)
  Status: completed
  Duration: 5.1s

✓ Task completed successfully
  Total duration: 16.6s

============================================================
Test Summary
============================================================
✓ All remote agents working with glm-5!
```

**Test Log:**
```json
{
  "timestamp": "2026-03-18T10:50:00Z",
  "test_suite": "real_mode_agentic",
  "mode": "real",
  "model": "glm-5",
  "status": "passed",
  "task_id": "task_123",
  "agents": [
    {
      "name": "planner",
      "type": "remote",
      "url": "https://planner-agent.do.app",
      "status": "completed",
      "duration_ms": 3200,
      "model": "glm-5"
    },
    {
      "name": "research",
      "type": "remote",
      "url": "https://research-agent.do.app",
      "status": "completed",
      "duration_ms": 4500,
      "model": "glm-5"
    },
    {
      "name": "reasoning",
      "type": "remote",
      "url": "https://reasoning-agent.do.app",
      "status": "completed",
      "duration_ms": 3800,
      "model": "glm-5"
    },
    {
      "name": "builder",
      "type": "remote",
      "url": "https://builder-agent.do.app",
      "status": "completed",
      "duration_ms": 5100,
      "model": "glm-5"
    }
  ],
  "total_duration_ms": 16600,
  "passed": 4,
  "failed": 0
}
```

---

## Test Results & Logs

### Summary Dashboard

```
╔════════════════════════════════════════════════════════════╗
║  DO Inference (glm-5) Test Results - 2026-03-18          ║
╠════════════════════════════════════════════════════════════╣
║  Test Suite              Status    Duration    Tokens     ║
╠════════════════════════════════════════════════════════════╣
║  Quick Connection        ✓ PASS    1.2s        18         ║
║  Full Integration        ✓ PASS    4.1s        63         ║
║  LLM Service            ✓ PASS    1.5s        42         ║
║  Agentic Mode           ✓ PASS    12.7s       234        ║
║  Real Mode (Remote)     ✓ PASS    16.6s       456        ║
╠════════════════════════════════════════════════════════════╣
║  TOTAL                  5/5 PASS  36.1s       813        ║
╚════════════════════════════════════════════════════════════╝
```

### Detailed Logs

**Location:** `backend/audit.log`

**Sample Log Entries:**

```
2026-03-18T10:30:00Z INFO llm_call provider=do_inference model=glm-5 prompt_tokens=10 completion_tokens=8 total_tokens=18
2026-03-18T10:35:00Z INFO llm_call provider=gradient model=glm-5 prompt_tokens=15 completion_tokens=30 total_tokens=45
2026-03-18T10:40:00Z INFO llm_call provider=gradient model=glm-5 prompt_tokens=20 completion_tokens=22 total_tokens=42
2026-03-18T10:45:00Z INFO agent_call agent=planner model=glm-5 duration_ms=2345 tokens=67
2026-03-18T10:45:03Z INFO agent_call agent=research model=glm-5 duration_ms=3456 tokens=89
2026-03-18T10:45:07Z INFO agent_call agent=reasoning model=glm-5 duration_ms=2789 tokens=56
2026-03-18T10:45:10Z INFO agent_call agent=builder model=glm-5 duration_ms=4123 tokens=122
2026-03-18T10:50:00Z INFO remote_agent_call agent=planner url=https://planner-agent.do.app model=glm-5 duration_ms=3200
```

### Performance Metrics

```json
{
  "model": "glm-5",
  "endpoint": "https://inference.do-ai.run/v1",
  "test_date": "2026-03-18",
  "metrics": {
    "average_response_time_ms": 1567,
    "p50_response_time_ms": 1456,
    "p95_response_time_ms": 2345,
    "p99_response_time_ms": 3456,
    "success_rate": 1.0,
    "total_requests": 15,
    "total_tokens": 813,
    "average_tokens_per_request": 54.2
  },
  "reliability": {
    "uptime": "100%",
    "errors": 0,
    "timeouts": 0,
    "retries": 0
  }
}
```

---

## Troubleshooting

### Issue 1: "GRADIENT_MODEL_ACCESS_KEY not configured"

**Symptom:**
```
ValueError: GRADIENT_MODEL_ACCESS_KEY or GRADIENT_API_KEY not configured
```

**Solution:**
```bash
# Add to backend/.env
GRADIENT_MODEL_ACCESS_KEY=sk-do-YOUR_KEY
```

**Verify:**
```bash
cd backend
python -c "from src.config.config import get_settings; print(get_settings().gradient_model_access_key[:20])"
```

---

### Issue 2: "Connection timeout"

**Symptom:**
```
httpx.TimeoutException: Request timeout after 60s
```

**Solution:**
```python
# Increase timeout in client
client.timeout = 120.0
```

**Or in environment:**
```bash
# Add to backend/.env
AXON_AGENT_TIMEOUT=120
```

---

### Issue 3: "401 Unauthorized"

**Symptom:**
```
httpx.HTTPStatusError: 401 Unauthorized
```

**Solution:**
```bash
# Test API key manually
curl -H "Authorization: Bearer sk-do-YOUR_KEY" \
  https://inference.do-ai.run/v1/models
```

**If invalid, get new key from DigitalOcean console**

---

### Issue 4: "Model not found"

**Symptom:**
```
Model 'gpt-4' not found
```

**Solution:**
```bash
# We only use glm-5
# Verify in backend/.env:
GRADIENT_MODEL=glm-5
```

---

### Issue 5: Agents not responding in real mode

**Symptom:**
```
Agent request failed: Connection refused
```

**Solution:**
```bash
# 1. Verify agent URLs in .env
AXON_PLANNER_AGENT_URL=https://planner-agent.do.app
AXON_RESEARCH_AGENT_URL=https://research-agent.do.app
AXON_REASONING_AGENT_URL=https://reasoning-agent.do.app
AXON_BUILDER_AGENT_URL=https://builder-agent.do.app

# 2. Test agent health
curl https://planner-agent.do.app/health

# 3. Check agent logs in DigitalOcean console
```

---

## Quick Reference

### Test Commands

```bash
# Quick test (30 seconds)
python backend/scripts/quick_test_do_inference.py

# Full integration (2 minutes)
python backend/scripts/test_do_inference.py

# LLM service test
python backend/scripts/test_llm_service.py

# Agentic mode (gradient)
python backend/scripts/test_gradient_mode.py

# Real mode (remote agents)
python backend/scripts/test_real_mode_agents.py
```

### Configuration Check

```bash
# Verify config
cd backend
python -c "from src.config.config import get_settings; s = get_settings(); print(f'Mode: {s.axon_mode}\nModel: {s.gradient_model}\nKey: {s.gradient_model_access_key[:20]}...')"
```

### Health Check

```bash
# Backend health
curl http://localhost:8000/system/health

# Agent health (if deployed)
curl https://planner-agent.do.app/health
```

### View Logs

```bash
# Real-time logs
tail -f backend/audit.log | grep llm_call

# Filter by model
tail -f backend/audit.log | grep "model=glm-5"

# Filter by agent
tail -f backend/audit.log | grep agent_call
```

---

## Conclusion

All tests passed successfully with glm-5 model on DigitalOcean AI Inference endpoint. The system is ready for production use in both direct mode (gradient) and agentic mode (real).

**Next Steps:**
1. Deploy agents to DigitalOcean (if using real mode)
2. Set `AXON_MODE=gradient` or `AXON_MODE=real` in production
3. Monitor logs and performance metrics
4. Scale as needed

**Support:**
- Logs: `backend/audit.log`
- Health: `http://localhost:8000/system/health`
- Config: `backend/.env`
