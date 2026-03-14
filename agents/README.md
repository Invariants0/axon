# AXON DigitalOcean Gradient ADK Agents

## Agent Deployment

### Prerequisites
- DigitalOcean account with Gradient AI access
- `gradient-adk` CLI installed
- API token with agent deployment permissions

### Install ADK CLI
```bash
pip install gradient-adk
```

### Deploy Agents

#### 1. Planner Agent
```bash
cd agents/planner_agent
cp .env.example .env
# Edit .env with your OPENAI_API_KEY and DIGITALOCEAN_API_TOKEN
gradient-adk deploy
```

#### 2. Research Agent
```bash
cd agents/research_agent
cp .env.example .env
# Edit .env with your OPENAI_API_KEY and DIGITALOCEAN_API_TOKEN
gradient-adk deploy
```

#### 3. Reasoning Agent
```bash
cd agents/reasoning_agent
cp .env.example .env
# Edit .env with your OPENAI_API_KEY and DIGITALOCEAN_API_TOKEN
gradient-adk deploy
```

#### 4. Builder Agent
```bash
cd agents/builder_agent
cp .env.example .env
# Edit .env with your OPENAI_API_KEY and DIGITALOCEAN_API_TOKEN
gradient-adk deploy
```

### Get Agent URLs
After deployment, each agent will have a URL like:
```
https://agents.do-ai.run/<agent-id>/run
```

Copy these URLs to your backend `.env` file:
```
AXON_PLANNER_AGENT_URL=https://agents.do-ai.run/<planner-id>
AXON_RESEARCH_AGENT_URL=https://agents.do-ai.run/<research-id>
AXON_REASONING_AGENT_URL=https://agents.do-ai.run/<reasoning-id>
AXON_BUILDER_AGENT_URL=https://agents.do-ai.run/<builder-id>
```

## Agent Architecture

Each agent implements:
- LangGraph state machine
- OpenAI LLM integration
- ADK entrypoint decorator
- JSON response format

## Testing Agents Locally

```bash
cd agents/planner_agent
gradient-adk run --input '{"prompt": "Create a plan for building a REST API"}'
```

## Monitoring

View agent logs:
```bash
gradient-adk logs <agent-id>
```

Check agent status:
```bash
gradient-adk status <agent-id>
```
