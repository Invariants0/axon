# AXON: Self-Evolving AI Agent Platform

<div align="center">

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11%2B-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7%2B-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.1-black.svg)

**A revolutionary platform demonstrating autonomous capability expansion for enterprise AI automation**

[Features](#features) • [Quick Start](#quick-start) • [Architecture](#architecture) • [Documentation](#documentation) • [Deployment](#deployment)

</div>

---

## Overview

**AXON** is an enterprise-grade, self-evolving AI platform that goes beyond traditional AI systems. Rather than being limited to pre-defined capabilities, AXON autonomously identifies missing abilities and generates new **skill modules** at runtime, effectively **teaching itself new capabilities** as it encounters novel tasks.

This is not just multi-agent orchestration—it's **recursive capability evolution**: the system can extend its own functionality without human intervention, making it ideal for complex, unpredictable enterprise automation scenarios.

### Key Innovation

Traditional AI systems are static—they have a fixed set of capabilities. AXON is **dynamic and adaptive**:

```
Task → Detect missing capability → Generate new skill → Register & execute → Task succeeds
                                           ↑                    ↓
                                    LLM-powered code        Persistent
                                    generation              skill system
```

## Features

🧠 **Self-Evolution Engine**
- Autonomously detect capability gaps
- Generate Python skill modules on-demand
- Persistent skill registry
- Version control for system evolution

🤖 **Multi-Agent Orchestration**
- 4 specialized LangGraph-based agents (Planner, Researcher, Reasoner, Builder)
- Powered by DigitalOcean Gradient AI
- Coordinated task breakdown and execution
- Intelligent task routing

🔍 **Semantic Memory & Knowledge Retrieval**
- Vector database integration (Qdrant)
- Context-aware decision making
- Historical knowledge persistence

📊 **Real-Time Dashboard**
- Live task execution monitoring
- Capability evolution visualization
- Generated code inspection
- System metrics and analytics
- Version timeline tracking

⚡ **Production-Ready**
- FastAPI async-first backend
- Next.js 15 modern frontend
- Docker containerization
- DigitalOcean Gradient AI integration
- PostgreSQL + Redis infrastructure

🔌 **Enterprise Integration Ready**
- RESTful API with WebSocket support
- Multi-LLM provider support (Gradient, Gemini, HuggingFace, DigitalOcean Inference)
- Comprehensive logging and monitoring
- Extensible skill system

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Git
- Optional: Python 3.11+, Node.js 18+

### Local Development (5 minutes)

```bash
# Clone the repository
git clone https://github.com/Invariants0/axon.git
cd axon

# Start all services
docker compose up --build

# Wait for services to be healthy (~30 seconds)
# Access the dashboard
open http://localhost
```

Services will be available at:
- **Frontend Dashboard**: http://localhost
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432 (when running standalone)

### Environment Configuration

Create a `.env.local` file in the project root:

```env
# LLM Configuration
GRADIENT_API_KEY=your_gradient_api_key
GEMINI_API_KEY=your_gemini_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key

# Database
DATABASE_URL=postgresql://postgres:password@postgres:5432/axon_db
REDIS_URL=redis://redis:6379/0

# Agent Endpoints (DigitalOcean Gradient ADK)
PLANNER_AGENT_URL=https://agents.do-ai.run/your-planner-id/run
RESEARCHER_AGENT_URL=https://agents.do-ai.run/your-researcher-id/run
REASONING_AGENT_URL=https://agents.do-ai.run/your-reasoning-id/run
BUILDER_AGENT_URL=https://agents.do-ai.run/your-builder-id/run

# Platform Mode
AXON_MODE=test  # Options: test, gemini, gradient, real
TEST_MODE=false  # For development with mock LLMs

# System Settings
DEBUG=false
LOG_LEVEL=INFO
```

See [ENV_CONFIGURATION_GUIDE.md](docs/ENV_CONFIGURATION_GUIDE.md) for detailed configuration options.

## Architecture

### System Diagram

```
┌─────────────────────────────────────┐
│     Frontend (Next.js 15)            │
│   Dashboard, Task UI, Visualization │
│      State: Zustand + React Query   │
└────────────────┬────────────────────┘
                 │
         ┌───────↓────────┐
         │  Nginx Proxy   │ (Reverse proxy, CORS)
         └───────┬────────┘
                 │
┌────────────────↓────────────────────┐
│      Backend (FastAPI)               │
├──────────────────────────────────────┤
│  • Evolution Engine                  │
│  • Agent Orchestrator                │
│  • Task Manager & Skill Executor     │
│  • Vector Memory & Retrieval         │
│  • LLM Service (multi-provider)      │
│  • Event Bus (WebSocket streaming)   │
└────────────────┬────────────────────┘
         ┌───────┴────────┐
         ↓                ↓
    ┌────────┐      ┌──────────┐
    │ PostgreSQL │  │ Qdrant   │
    │(Metadata) │   │(Vectors) │
    └────────┘      └──────────┘

External Services:
┌──────────────────────────────────────┐
│  DigitalOcean Gradient ADK Agents    │
│  ├─ Planner Agent                    │
│  ├─ Research Agent                   │
│  ├─ Reasoning Agent                  │
│  └─ Builder Agent                    │
│         ↓                             │
│  Gradient Inference Endpoints         │
└──────────────────────────────────────┘
```

### Component Overview

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS | Interactive dashboard and UI |
| **Backend** | FastAPI, Python 3.11, SQLAlchemy | Core API and business logic |
| **Agents** | LangGraph, Gradient SDK, DigitalOcean ADK | AI orchestration and reasoning |
| **Primary DB** | PostgreSQL 16 | System metadata and state |
| **Vector DB** | Qdrant | Semantic memory and retrieval |
| **Cache** | Redis 7 | Session and result caching |
| **Inference** | DigitalOcean Gradient AI | LLM endpoints and agents |
| **Containers** | Docker, Docker Compose | Local and cloud deployment |

### Data Flow: Task Execution with Self-Evolution

```
1. User Task
   ↓
2. Planner Agent
   → Breaks task into steps
   ↓
3. Research Agent
   → Gathers context (vector DB, web search)
   ↓
4. Reasoning Agent
   → Analyzes approach
   ↓
5. Skill Check
   ├─ Capability exists? 
   │  └─ YES → Execute skill
   └─ NO → Trigger Evolution
         ↓
      6. Builder Agent
         → Generates new skill module
         ↓
      7. Validation & Registration
         → Skill system validates and registers
         ↓
      8. Version Update
         → System version incremented
         ↓
      9. Retry Task
         → Re-execute with new capability
         ↓
10. Return Results & Update History
```

## Project Structure

```
axon/
├── frontend/                    # Next.js 15 dashboard
│   ├── app/                    # App routing and pages
│   ├── components/             # Reusable React components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions
│   ├── store/                  # Zustand state management
│   ├── types/                  # TypeScript definitions
│   └── package.json            # Dependencies
│
├── backend/                    # FastAPI Python backend
│   ├── src/
│   │   ├── main.py            # FastAPI app definition
│   │   ├── api/               # HTTP route handlers
│   │   │   ├── routes/        # API endpoints
│   │   │   └── websocket/     # WebSocket handlers
│   │   ├── core/              # Core business logic
│   │   │   ├── evolution_engine.py
│   │   │   ├── agent_orchestrator.py
│   │   │   ├── task_manager.py
│   │   │   └── version_manager.py
│   │   ├── services/          # Service layer
│   │   ├── ai/                # LLM integrations
│   │   ├── skills/            # Skill system
│   │   │   ├── core_skills/   # Built-in skills
│   │   │   ├── generated_skills/  # LLM-generated skills
│   │   └── db/                # Database models & session
│   ├── scripts/               # Testing and admin scripts
│   ├── requirements.txt
│   └── start.py              # Startup script
│
├── agents/                    # DigitalOcean ADK agent code
│   ├── planner_agent/        # Task planning agent
│   ├── research_agent/       # Information gathering
│   ├── reasoning_agent/      # Analysis and planning
│   └── builder_agent/        # Code generation
│
├── docker/                    # Docker build configs
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
│
├── nginx/                     # Nginx reverse proxy config
│
├── utils/                     # Testing & utilities
│   ├── run_agent_evaluation.py
│   ├── test_evolution_e2e.py
│   └── test_full_agent_flow.py
│
├── docs/                      # Documentation
│   ├── api/                   # API reference
│   ├── AXON-(PRD).md         # Product requirements
│   ├── ARCHITECTURE_CHANGES.md
│   ├── ENV_CONFIGURATION_GUIDE.md
│   ├── DEPLOYMENT.md         # Deployment guide
│   └── README.md             # Doc index
│
├── docker-compose.yml        # Multi-container orchestration
└── README.md                 # This file
```

## API Documentation

### Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | System health status |
| `/tasks` | GET/POST | Task management |
| `/tasks/{id}` | GET | Task details |
| `/evolution/trigger` | POST | Initiate capability evolution |
| `/evolution/status` | GET | Evolution progress |
| `/skills` | GET | List available skills |
| `/skills/register` | POST | Register new skill |
| `/system` | GET | System configuration |
| `/ws/events` | WS | Real-time event stream |

### Full API Reference

- **[Health Checks](docs/api/README.md#health)** - System status endpoints
- **[Tasks API](docs/api/tasks.md)** - Task creation and management
- **[Evolution API](docs/api/evolution.md)** - Capability evolution control
- **[Skills API](docs/api/skills.md)** - Skill registry and execution
- **[System API](docs/api/system.md)** - System configuration and monitoring
- **[WebSocket API](docs/api/websocket.md)** - Real-time event streaming

### Interactive API Docs

When the backend is running, access interactive Swagger UI documentation:

```bash
curl http://localhost:8000/docs
```

## Development

### Backend Development

```bash
# Install dependencies
cd backend
python -m pip install -r requirements.txt

# Run migrations
python -m alembic upgrade head

# Start development server (auto-reload)
python start.py

# Run tests
pytest tests/ -v

# Format code
black src/ tests/
ruff check --fix src/
```

### Frontend Development

```bash
# Install dependencies
cd frontend
npm install

# Start development server (hot reload)
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

### Running Tests

```bash
# Full integration test
python backend/scripts/test_full_integration.py

# Evolution system test
python utils/test_evolution_e2e.py

# Agent evaluation
python utils/run_agent_evaluation.py

# Health check
python utils/test_health_endpoint.py
```

### Testing Different Modes

```bash
# Test mode (mocked LLMs, fast)
AXON_MODE=test docker compose up

# Gemini mode (Google Gemini API)
AXON_MODE=gemini GEMINI_API_KEY=your_key docker compose up

# Gradient mode (DigitalOcean Gradient)
AXON_MODE=gradient GRADIENT_API_KEY=your_key docker compose up

# Real mode (ADK agents)
AXON_MODE=real docker compose up
```

### Code Style & Quality

We follow:
- **Python**: PEP 8, enforced with `black` and `ruff`
- **TypeScript**: ESLint config in [eslint.config.mjs](frontend/eslint.config.mjs)
- **Commit messages**: Conventional commits format

## Deployment

### Docker Compose (Local)

```bash
docker compose up --build
```

### DigitalOcean App Platform

```bash
# Deploy with doctl
doctl apps create --spec app-spec.yml
```

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

### DigitalOcean Agents (ADK)

Deploy individual agents to Gradient:

```bash
# Deploy Planner Agent
cd agents/planner_agent
gradient-adk deploy
# Returns: PLANNER_AGENT_URL=https://agents.do-ai.run/{id}/run

# Repeat for other agents...
```

Configure URLs in `.env.local`

See [AGENTS_DEPLOYMENT_COMPLETE.md](AGENTS_DEPLOYMENT_COMPLETE.md) for full deployment details.

### Production Checklist

- [ ] Set environment variables for all services
- [ ] Configure LLM API keys (Gradient, Gemini, HuggingFace)
- [ ] Deploy agents to DigitalOcean Gradient
- [ ] Set up managed PostgreSQL instance
- [ ] Configure Qdrant instance
- [ ] Enable HTTPS/TLS
- [ ] Set up monitoring and logging
- [ ] Create database backups
- [ ] Configure CORS for frontend domain
- [ ] Run health checks: `curl https://your-domain/health`

## Advanced Features

### Skill System

Skills are Python modules that the system can execute. Two types:

**Core Skills** (static, built-in)
- Located in: `backend/src/skills/core_skills/`
- Examples: `planning.py`, `reasoning.py`, `web_search.py`

**Generated Skills** (dynamic, LLM-created)
- Located in: `backend/src/skills/generated_skills/`
- Auto-generated when capabilities are missing
- Follow template: `backend/src/skills/templates/`

### Vector Memory & Semantic Search

The system uses Qdrant for semantic similarity search:

```python
# Retrieve contextually relevant documents
results = vector_db.search(
    query_embedding=embed("find skill for web scraping"),
    limit=5,
    score_threshold=0.7
)
```

Used for:
- Context-aware agent reasoning
- Capability matching
- Knowledge retrieval

### Multi-LLM Provider Support

Automatic provider fallback:

```
Try Gradient → Fallback Gemini → Fallback HuggingFace → Fallback test mode
```

Configure in environment:

```env
AXON_LLM_PROVIDER=gradient  # Auto-route between providers
```

## Monitoring & Observability

Real-time dashboard shows:
- Active tasks and execution logs
- System version evolution timeline
- Generated code inspection
- Performance metrics
- Skill registry status

Logs available at: `backend/logs/` (in container: `/app/logs/`)

## Documentation Map

| Document | Purpose |
|----------|---------|
| [README.md](docs/README.md) | Documentation index |
| [AXON-(PRD).md](docs/AXON-(PRD).md) | Product requirements & vision |
| [ARCHITECTURE_CHANGES.md](docs/ARCHITECTURE_CHANGES.md) | System architecture decisions |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment procedures |
| [ENV_CONFIGURATION_GUIDE.md](docs/ENV_CONFIGURATION_GUIDE.md) | Configuration reference |
| [DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) | Pre-launch checklist |
| [API Reference](docs/api/README.md) | Complete API documentation |

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'feat: add amazing feature'` (conventional commits)
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Workflow

1. Run `docker compose up` to start dev environment
2. Make changes to frontend or backend
3. Frontend: Hot reload enabled, check http://localhost
4. Backend: Auto-reload enabled, check http://localhost:8000/docs
5. Run tests before submitting PR

### Reporting Issues

Please include:
- Description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Docker version, Python/Node version)
- Relevant logs from `docker compose logs`

## Key Technologies

### Backend Stack
- **Runtime**: Python 3.11+, Uvicorn, FastAPI
- **Database**: PostgreSQL 16, SQLAlchemy ORM
- **Vector DB**: Qdrant + sentence-transformers
- **Async**: asyncpg, aioredis
- **LLM Integration**: Gradient SDK, Google Gemini, HuggingFace, DigitalOcean Inference
- **Monitoring**: Loguru

### Frontend Stack
- **Framework**: Next.js 15.1, React 19
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS 4.0, shadcn/ui
- **State**: Zustand 5.0
- **HTTP**: TanStack React Query 5.66
- **Visualization**: @xyflow/react, three.js
- **Forms**: React Hook Form

### AI/Agent Stack
- **Framework**: LangGraph, Gradient ADK
- **Platform**: DigitalOcean Gradient AI
- **LLMs**: Multiple provider support
- **Embeddings**: sentence-transformers

## Troubleshooting

### Services won't start
```bash
# Check logs
docker compose logs -f

# Ensure ports are available
lsof -i :80 :3000 :8000 :5432 :6379

# Rebuild everything
docker compose down
docker compose up --build
```

### Database connection issues
```bash
# Check PostgreSQL is running
docker compose ps postgres

# View DB logs
docker compose logs postgres

# Recreate database
docker volume rm axon_postgres_data
docker compose up
```

### API not responding
```bash
# Health check
curl http://localhost:8000/health

# View backend logs
docker compose logs backend

# Check migrations
docker compose exec backend python -m alembic current
```

### Environment variable issues
```bash
# Validate configuration
docker compose exec backend python utils/validate_setup.py

# Check loaded env variables
docker compose exec backend python -c "import os; print({k: v[:10]+'...' if len(v) > 10 else v for k,v in os.environ.items() if 'AXON' in k or 'GRADIENT' in k})"
```

## Performance & Scalability

- **Async-first backend** handles 1000+ concurrent connections
- **Vector database** enables semantic search at scale
- **Caching layer** (Redis) reduces API response times
- **Horizontal scaling** supported via Kubernetes
- **Load balancing** ready with Nginx

## Security

- **Authentication**: API keys for LLM providers
- **Authorization**: Role-based access control ready
- **Secrets**: Environment variables, use `.env.local` (not in git)
- **CORS**: Configurable in docker-compose
- **SQL Injection**: Protected via SQLAlchemy ORM
- **HTTPS**: Supported via reverse proxy configuration

## Roadmap

- [ ] Role-based access control (RBAC)
- [ ] Advanced skill persistence and versioning
- [ ] Enhanced vector memory management
- [ ] Kubernetes deployment templates
- [ ] GraphQL API option
- [ ] Real-time collaborative features
- [ ] Advanced monitoring dashboard
- [ ] Cost tracking per agent/task

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support & Community

- 📖 [Documentation](docs/)
- 🐛 [Report Issues](https://github.com/Invariants0/axon/issues)
- 💬 [Discussions](https://github.com/Invariants0/axon/discussions)
- 📧 Contact: [project contact info]

---

<div align="center">

**Built with ❤️ using FastAPI, Next.js, and DigitalOcean Gradient AI**

[Back to Top](#axon-self-evolving-ai-agent-platform)

</div>
