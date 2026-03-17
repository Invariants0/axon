# AXON Pipeline Test Script

## Overview

`test_pipeline.py` is a comprehensive testing script that validates the entire AXON backend pipeline in Gemini mode.

## What It Tests

### 1. Configuration Validation
- Verifies `AXON_MODE=gemini`
- Checks `GEMINI_API_KEY` is set
- Validates all required settings

### 2. Skill System
- Loads all skills from registry
- Executes sample skill
- Verifies execution environment

### 3. Evolution Engine
- Checks evolution engine status
- Simulates failure scenarios (if applicable)
- Verifies skill generation capability

### 4. Full Pipeline Execution
- Creates test task
- Runs complete agent pipeline:
  - PlanningAgent
  - ResearchAgent
  - ReasoningAgent
  - BuilderAgent
- Verifies each stage completes
- Checks memory storage
- Validates final output

## Prerequisites

```bash
# Required environment variables
export AXON_MODE=gemini
export GEMINI_API_KEY=your_gemini_api_key

# Optional
export AXON_DEBUG_PIPELINE=true
export TEST_MODE=false
```

## Usage

### Basic Run
```bash
cd backend
python ../utils/test_pipeline.py
```

### With Debug Output
```bash
export AXON_DEBUG_PIPELINE=true
python utils/test_pipeline.py
```

### Expected Output

```
================================================================================
AXON PIPELINE TEST - GEMINI MODE
================================================================================

[CONFIG] AXON_MODE: gemini
[CONFIG] TEST_MODE: False
[CONFIG] DEBUG_PIPELINE: True
[CONFIG] SKILL_TIMEOUT: 20s

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
✓ Task created: abc-123-def-456
  Title: Build a simple REST API for user management
  Description: Create a REST API with endpoints for CRUD operations

[PIPELINE] Starting agent pipeline...
--------------------------------------------------------------------------------
[PIPELINE] PlanningAgent started
[PIPELINE] PlanningAgent completed (duration: 2.3s, output: 1024 bytes)
[PIPELINE] ResearchAgent started
[PIPELINE] ResearchAgent completed (duration: 1.8s, output: 2048 bytes)
[PIPELINE] ReasoningAgent started
[PIPELINE] ReasoningAgent completed (duration: 2.1s, output: 1536 bytes)
[PIPELINE] BuilderAgent started
[PIPELINE] BuilderAgent completed (duration: 2.5s, output: 3072 bytes)
--------------------------------------------------------------------------------
✓ Pipeline completed successfully

[RESULTS] Pipeline Output:
================================================================================

PLANNING:
{
  "agent": "planning",
  "plan": {...},
  "llm_refinement": "..."
}

RESEARCH:
{
  "agent": "research",
  "research": {...},
  "synthesis": "..."
}

REASONING:
{
  "agent": "reasoning",
  "analysis": {...},
  "rationale": "..."
}

BUILDER:
{
  "agent": "builder",
  "build": {...},
  "final": "..."
}

[MEMORY] Verifying memory storage...
✓ Found 4 memory records for task

[SKILLS] Skill execution verified:
  ✓ planning stage executed skills
  ✓ research stage executed skills
  ✓ reasoning stage executed skills
  ✓ builder stage executed skills

================================================================================
✅ PIPELINE TEST PASSED
================================================================================

Task ID: abc-123-def-456
Status: completed
Stages completed: 4

================================================================================
TEST SUMMARY
================================================================================
Skill System:     ✅ PASS
Evolution System: ✅ PASS
Pipeline Test:    ✅ PASS
================================================================================

🎉 ALL TESTS PASSED
```

## Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed

## Troubleshooting

### Error: "AXON_MODE must be set to 'gemini'"
**Solution**: Set environment variable
```bash
export AXON_MODE=gemini
```

### Error: "GEMINI_API_KEY not configured"
**Solution**: Set your API key
```bash
export GEMINI_API_KEY=your_key_here
```

### Error: "Connection refused" to database
**Solution**: Start PostgreSQL
```bash
# Mac
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Docker
docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
```

### Error: "No skills loaded"
**Solution**: Check skills directory exists
```bash
ls backend/src/skills/core_skills/
```

### Error: "Timeout" during execution
**Solution**: Increase timeout
```bash
export SKILL_EXECUTION_TIMEOUT=30
```

## Test Scenarios

### Scenario 1: Basic Pipeline Test
Tests the happy path with all systems working.

### Scenario 2: Skill System Validation
Verifies skill loading and execution in isolation.

### Scenario 3: Evolution Engine Check
Validates evolution engine can generate skills when needed.

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Test AXON Pipeline
  env:
    AXON_MODE: gemini
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
    DATABASE_URL: postgresql+asyncpg://postgres:postgres@localhost:5432/axon
  run: |
    python utils/test_pipeline.py
```

### GitLab CI Example
```yaml
test_pipeline:
  script:
    - export AXON_MODE=gemini
    - export GEMINI_API_KEY=$GEMINI_API_KEY
    - python utils/test_pipeline.py
```

## Customization

### Change Test Task
Edit the script around line 80:
```python
task_title = "Your custom task title"
task_description = "Your custom task description"
```

### Add More Tests
Add new test functions following the pattern:
```python
async def test_custom_feature():
    """Test custom feature."""
    print("\n" + "=" * 80)
    print("CUSTOM FEATURE TEST")
    print("=" * 80)
    
    # Your test logic here
    
    return True  # or False if failed
```

Then call it in `main()`:
```python
custom_ok = await test_custom_feature()
```

## Performance Benchmarks

Typical execution times:
- Configuration check: <0.1s
- Database init: 0.5-1s
- Component init: 0.5-1s
- Skill system test: 1-2s
- Evolution test: 1-2s
- Full pipeline: 8-12s (depends on Gemini API latency)

Total: ~15-20 seconds

## Logs

Test execution logs are written to:
- Console (stdout)
- Application logs (if configured)

Enable verbose logging:
```bash
export LOG_LEVEL=DEBUG
export AXON_DEBUG_PIPELINE=true
```

## Related Documentation

- `CHANGES.md` - Complete change documentation
- `QUICKSTART_GEMINI.md` - Quick start guide
- `IMPLEMENTATION_SUMMARY.md` - Implementation details

## Support

If tests fail:
1. Check environment variables
2. Verify database is running
3. Confirm Gemini API key is valid
4. Review error messages
5. Check logs with debug enabled
6. Consult troubleshooting section above

---

**Last Updated**: 2026-03-16  
**Version**: 1.0  
**Status**: Production Ready
