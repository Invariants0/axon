# AXON DigitalOcean Integration File Tree

## New Files

```
agents/
├── .gitignore
├── README.md
├── planner_agent/
│   ├── .env.example
│   ├── main.py
│   └── requirements.txt
├── research_agent/
│   ├── .env.example
│   ├── main.py
│   └── requirements.txt
├── reasoning_agent/
│   ├── .env.example
│   ├── main.py
│   └── requirements.txt
└── builder_agent/
    ├── .env.example
    ├── main.py
    └── requirements.txt

backend/src/
├── providers/
│   ├── __init__.py
│   └── digitalocean/
│       ├── __init__.py
│       ├── digitalocean_agent_client.py
│       ├── digitalocean_agent_router.py
│       └── digitalocean_agent_types.py
└── config/
    └── agents_config.py

root/
├── DEPLOYMENT.md
├── INTEGRATION_SUMMARY.md
└── FILE_TREE.md
```

## Modified Files

```
backend/
├── .env.example (added AXON_MODE, DIGITALOCEAN_API_TOKEN, agent URLs)
└── src/
    ├── agents/
    │   ├── base_agent.py (added digitalocean_router parameter)
    │   ├── planning_agent.py (added real mode routing)
    │   ├── research_agent.py (added real mode routing)
    │   ├── reasoning_agent.py (added real mode routing)
    │   └── builder_agent.py (added real mode routing)
    ├── config/
    │   └── config.py (added AXON_MODE and agent URL settings)
    └── core/
        └── agent_orchestrator.py (initialize DigitalOceanAgentRouter)
```

## Unchanged Files (Preserved)

```
backend/src/
├── ai/
│   ├── gradient_client.py
│   ├── huggingface_client.py
│   └── llm_service.py
├── api/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── websocket/
├── core/
│   ├── debug_tools.py
│   ├── event_bus.py
│   ├── evolution_engine.py
│   ├── task_manager.py
│   └── version_manager.py
├── db/
│   ├── models.py
│   └── session.py
├── memory/
│   ├── embeddings.py
│   └── vector_store.py
├── schemas/
├── services/
├── skills/
├── storage/
└── utils/
```
