# AXON Gemini Testing - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Python 3.10+
- PostgreSQL running
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Step 1: Configure Environment

Create `backend/.env` file:

```bash
# Core settings
AXON_MODE=gemini
TEST_MODE=false
AXON_DEBUG_PIPELINE=true

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/axon

# Optional: API security
AXON_API_KEY=hackathon_demo_key_2024

# Optional: Skill timeout
SKILL_EXECUTION_TIMEOUT=20
```

### Step 2: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 3: Initialize Database

```bash
# Run migrations
alembic upgrade head
```

### Step 4: Start Backend

```bash
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 5: Test the Pipeline

Open a new terminal:

```bash
python utils/test_pipeline.py
```

Expected output:
```
================================================================================
AXON PIPELINE TEST - GEMINI MODE
================================================================================

[CONFIG] AXON_MODE: gemini
[CONFIG] TEST_MODE: False
[CONFIG] DEBUG_PIPELINE: True
✓ Configuration valid

[INIT] Initializing database...
✓ Database initialized

[INIT] Initializing components...
✓ Loaded 3 skills:
  - planning (v1.0.0): Task planning and decomposition
  - web_search (v1.0.0): Web search capability
  - reasoning (v1.0.0): Logical reasoning
✓ Orchestrator initialized

[TASK] Creating test task...
✓ Task created: abc-123-def

[PIPELINE] Starting agent pipeline...
[PIPELINE] PlanningAgent started
[PIPELINE] PlanningAgent completed (duration: 2.3s)
[PIPELINE] ResearchAgent started
[PIPELINE] ResearchAgent completed (duration: 1.8s)
[PIPELINE] ReasoningAgent started
[PIPELINE] ReasoningAgent completed (duration: 2.1s)
[PIPELINE] BuilderAgent started
[PIPELINE] BuilderAgent completed (duration: 2.5s)

✅ PIPELINE TEST PASSED
```

### Step 6: Check Health

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "backend": "ok",
  "agents": "reachable",
  "skills_loaded": 3,
  "vector_store": "connected",
  "llm_provider": "gemini",
  "axon_mode": "gemini",
  "debug_pipeline": true
}
```

### Step 7: Create a Task via API

```bash
curl -X POST http://localhost:8000/tasks \
  -H "Content-Type: application/json" \
  -H "X-AXON-KEY: hackathon_demo_key_2024" \
  -d '{
    "title": "Build a todo list API",
    "description": "Create REST endpoints for managing todos with FastAPI"
  }'
```

Response:
```json
{
  "id": "task-uuid-here",
  "title": "Build a todo list API",
  "status": "queued",
  "created_at": "2026-03-16T10:30:00Z"
}
```

### Step 8: Check Task Status

```bash
curl http://localhost:8000/tasks/{task-id} \
  -H "X-AXON-KEY: hackathon_demo_key_2024"
```

---

## 🔄 Switching Between Modes

### Gemini Mode (Testing)
```bash
export AXON_MODE=gemini
export GEMINI_API_KEY=your_key
```

### Gradient Mode (Production)
```bash
export AXON_MODE=gradient
export GRADIENT_API_KEY=your_gradient_key
```

### Test Mode (No API calls)
```bash
export AXON_MODE=mock
export TEST_MODE=true
```

---

## 🐛 Troubleshooting

### "GEMINI_API_KEY not configured"
- Set the environment variable: `export GEMINI_API_KEY=your_key`
- Or add to `.env` file

### "Connection refused" to database
- Start PostgreSQL: `brew services start postgresql` (Mac)
- Or: `sudo systemctl start postgresql` (Linux)
- Or: Use Docker: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres`

### Skills not loading
- Check `backend/src/skills/core_skills/` exists
- Verify Python path is correct
- Run: `python -c "from src.skills.registry import SkillRegistry; print(SkillRegistry().all())"`

### Pipeline timeout
- Increase timeout: `export SKILL_EXECUTION_TIMEOUT=30`
- Check network connectivity to Gemini API

---

## 📊 Monitoring

### View Logs
```bash
# With debug enabled
tail -f backend/logs/axon.log

# Or watch in real-time
export AXON_DEBUG_PIPELINE=true
python -m uvicorn src.main:app --reload
```

### Check System Status
```bash
# Health check
curl http://localhost:8000/health

# List tasks
curl http://localhost:8000/tasks

# List skills
curl http://localhost:8000/skills

# Evolution status
curl http://localhost:8000/evolution/status
```

---

## 🎯 Next Steps

1. **Test with your own tasks**: Modify the test script or use the API
2. **Explore skills**: Check `backend/src/skills/core_skills/`
3. **Monitor evolution**: Watch for generated skills in `backend/src/skills/generated_skills/`
4. **Switch to Gradient**: When ready for production, change `AXON_MODE=gradient`

---

## 📚 Additional Resources

- Full documentation: `CHANGES.md`
- Architecture details: `ARCHITECTURE_CHANGES.md`
- API documentation: http://localhost:8000/docs (when running)

---

## ✅ Success Criteria

You're ready when:
- [x] Health endpoint returns `"llm_provider": "gemini"`
- [x] Test script passes all checks
- [x] Tasks can be created via API
- [x] Pipeline completes without errors
- [x] Skills are loaded and executing

---

**Happy Testing! 🚀**
