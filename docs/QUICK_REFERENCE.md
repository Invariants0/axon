# AXON Quick Reference

Use this as the shortest path for local run, CI checks, and deployment.

## Open These First

- [Documentation Hub](README.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Deployment Commands](DEPLOYMENT_COMMANDS.md)
- [API Index](api/README.md)

## Local Development

```bash
# Backend
cd backend
python -m pip install -r requirements.txt
python start.py

# Full stack
cd ..
docker compose up --build
```

## Quality Gates

```bash
# Unit tests
pytest -q backend/tests

# CT-style utility checks
TEST_MODE=true AXON_MODE=mock python utils/validate_setup.py
TEST_MODE=true AXON_MODE=mock python utils/test_health_endpoint.py
TEST_MODE=true AXON_MODE=mock python utils/test_llm_routing.py
python utils/analysis/analyze_dependencies.py
```

## CI/CD Entrypoint

- Workflow: `.github/workflows/ci-cd.yml`
- `pull_request` to `main`: runs unit + CT checks
- `push` to `main`: runs unit + CT checks, then deploys over SSH

## Deployment Essentials

Required GitHub Actions secrets:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PATH`
- `DEPLOY_PORT` (optional, defaults to `22`)
