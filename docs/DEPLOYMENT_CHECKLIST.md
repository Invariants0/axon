# AXON Gemini Mode - Deployment Checklist

## 🎯 Pre-Deployment Checklist

### Environment Setup
- [ ] Python 3.10+ installed
- [ ] PostgreSQL running
- [ ] Google Gemini API key obtained
- [ ] Dependencies installed (`pip install -r backend/requirements.txt`)

### Configuration Files
- [ ] `backend/.env` created from `.env.example`
- [ ] `AXON_MODE=gemini` set
- [ ] `GEMINI_API_KEY` configured
- [ ] `DATABASE_URL` configured
- [ ] Optional: `AXON_API_KEY` set for security
- [ ] Optional: `AXON_DEBUG_PIPELINE=true` for debugging

### Database Setup
- [ ] PostgreSQL database created
- [ ] Alembic migrations run (`alembic upgrade head`)
- [ ] Database connection verified

---

## 🚀 Deployment Steps

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

Required settings:
```bash
AXON_MODE=gemini
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/axon
TEST_MODE=false
```

### 3. Initialize Database
```bash
# Create database
createdb axon

# Run migrations
alembic upgrade head
```

### 4. Start Backend
```bash
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Verify Health
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
  "debug_pipeline": false
}
```

### 6. Run Test Script
```bash
python utils/test_pipeline.py
```

Expected: All tests pass ✅

---

## ✅ Verification Checklist

### System Health
- [ ] `/health` endpoint returns 200 OK
- [ ] `llm_provider` shows "gemini"
- [ ] `skills_loaded` > 0
- [ ] `vector_store` shows "connected"

### API Endpoints
- [ ] `GET /health` works
- [ ] `GET /tasks` works
- [ ] `POST /tasks` works
- [ ] `GET /skills` works
- [ ] `GET /evolution/status` works

### Pipeline Execution
- [ ] Test script passes all checks
- [ ] Tasks can be created
- [ ] Pipeline completes without errors
- [ ] Results are stored in database
- [ ] Memory embeddings are created

### Security
- [ ] API key authentication works (if enabled)
- [ ] Rate limiting is active
- [ ] CORS is configured correctly

---

## 🔧 Troubleshooting

### Issue: "GEMINI_API_KEY not configured"
**Solution**: Set environment variable
```bash
export GEMINI_API_KEY=your_key
```

### Issue: Database connection fails
**Solution**: Check PostgreSQL is running
```bash
# Mac
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Check connection
psql -U postgres -c "SELECT 1"
```

### Issue: Skills not loading
**Solution**: Verify skills directory
```bash
ls backend/src/skills/core_skills/
# Should show: planning.py, reasoning.py, coding.py
```

### Issue: Import errors
**Solution**: Install dependencies
```bash
pip install -r backend/requirements.txt
```

### Issue: Vector store errors
**Solution**: Reset vector database
```bash
rm -rf backend/.chroma
# Restart backend
```

---

## 📊 Monitoring

### Logs
```bash
# View logs
tail -f backend/logs/axon.log

# Enable debug mode
export AXON_DEBUG_PIPELINE=true
```

### Metrics
- Check `/health` endpoint regularly
- Monitor task completion rate
- Track skill execution times
- Watch for failed tasks

---

## 🔄 Switching Modes

### From Gemini to Gradient
```bash
# Update .env
AXON_MODE=gradient
GRADIENT_API_KEY=your_gradient_key

# Restart backend
# No code changes needed
```

### From Gemini to Test Mode
```bash
# Update .env
AXON_MODE=mock
TEST_MODE=true

# Restart backend
```

---

## 🎉 Success Criteria

System is ready when:
- ✅ Health endpoint returns all green
- ✅ Test script passes 100%
- ✅ Tasks can be created via API
- ✅ Pipeline executes end-to-end
- ✅ Skills load and execute
- ✅ Memory stores embeddings
- ✅ No errors in logs

---

## 📞 Support Resources

### Documentation
- `CHANGES.md` - Complete change log
- `QUICKSTART_GEMINI.md` - Quick start guide
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `utils/README_TEST.md` - Test script docs

### Commands
```bash
# Health check
curl http://localhost:8000/health

# List tasks
curl http://localhost:8000/tasks

# Create task
curl -X POST http://localhost:8000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "description": "Test task"}'

# Run tests
python utils/test_pipeline.py
```

---

## 🔒 Security Notes

### For Hackathon/Demo
- Use `AXON_API_KEY` for basic protection
- Rate limiting is enabled by default
- CORS is configured for development

### For Production
- Use proper authentication (OAuth, JWT)
- Enable HTTPS/TLS
- Implement request signing
- Add comprehensive audit logging
- Use secrets management
- Configure firewall rules

---

## 📈 Performance Tuning

### Optimize for Speed
```bash
# Increase workers
AXON_WORKER_COUNT=4

# Reduce timeout for faster failures
SKILL_EXECUTION_TIMEOUT=10

# Disable debug logging
AXON_DEBUG_PIPELINE=false
```

### Optimize for Reliability
```bash
# Increase timeout for complex tasks
SKILL_EXECUTION_TIMEOUT=30

# Enable debug logging
AXON_DEBUG_PIPELINE=true

# Single worker for debugging
AXON_WORKER_COUNT=1
```

---

## 🎯 Final Checklist

Before going live:
- [ ] All environment variables set
- [ ] Database initialized
- [ ] Dependencies installed
- [ ] Health check passes
- [ ] Test script passes
- [ ] API endpoints tested
- [ ] Security configured
- [ ] Monitoring enabled
- [ ] Documentation reviewed
- [ ] Backup plan ready

---

**Status**: Ready for deployment ✅  
**Last Updated**: 2026-03-16  
**Version**: 1.0
