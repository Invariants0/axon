# DigitalOcean Setup Guide for AXON Backend

**Date:** March 18, 2026  
**Purpose:** Complete step-by-step guide to obtaining all DigitalOcean environment variables for AXON backend  
**Scope:** Gradient API Key, ADK Agent URLs, API Token

---

## TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Create DigitalOcean Account](#create-digitalocean-account)
3. [Generate API Token](#generate-api-token)
4. [Enable Gradient API](#enable-gradient-api)
5. [Deploy ADK Agents](#deploy-adk-agents)
6. [Collect All Environment Variables](#collect-all-environment-variables)
7. [Configure Backend .env](#configure-backend-env)
8. [Verify Setup](#verify-setup)

---

## Prerequisites

- A valid email address
- Credit/debit card (for billing)
- Browser (Chrome, Firefox, Safari, Edge)
- Terminal/PowerShell access
- Git installed (for cloning agent repositories)

---

## Create DigitalOcean Account

### Step 1: Sign Up

1. Go to **https://www.digitalocean.com/**
2. Click **"Sign Up"** in the top right
3. Choose sign-up method:
   - Email & password (recommended)
   - GitHub OAuth
   - Google OAuth

### Step 2: Verify Email

1. Check your email for verification link
2. Click the verification link
3. This activates your account

### Step 3: Complete Account Setup

1. Fill in:
   - Full name
   - Company (optional)
   - Country
2. Select "Business use" or personal project
3. Click **"Create Account"**

### Step 4: Add Payment Method

1. Go to **Settings → Billing** (or **Account → Billing**)
2. Click **"Add payment method"**
3. Enter:
   - Credit/Debit card number
   - Expiration date
   - CVC
   - Billing address
4. Click **"Save"**

You now have a DigitalOcean account! ✅

---

## Generate API Token

### Why You Need This

The **DIGITALOCEAN_API_TOKEN** authorizes all API calls to:
- Gradient LLM endpoints
- ADK agent endpoints
- Database management
- Any other DigitalOcean resources

### How to Get It

#### From Dashboard:

1. Log in to **https://cloud.digitalocean.com/**
2. Navigate to:
   ```
   Account → Settings → API → Tokens
   ```
   OR
   ```
   Account → Security → Access Tokens
   ```

3. Click **"Generate New Token"**

4. Configure token:
   ```
   Token name: axon-backend
   Expiration: 90 days (recommended for production)
   Scopes: Read & Write (required!)
   ```

5. Click **"Generate Token"**

#### ⚠️ IMPORTANT

```
The token is shown ONLY ONCE!
Copy it immediately:
dop_v1_1234567890abcdefghijklmnopqrstuvwxyz...

Store it securely in your .env file:
DIGITALOCEAN_API_TOKEN=dop_v1_xxxx...
```

### Store Securely

```bash
# backend/.env
DIGITALOCEAN_API_TOKEN=dop_v1_xxxx...
```

✅ **You now have:** `DIGITALOCEAN_API_TOKEN`

---

## Enable Gradient API

### What is Gradient?

Gradient is DigitalOcean's managed LLM service with OpenAI-compatible API for inference.

### Step 1: Access AI/ML Services

1. Go to **https://cloud.digitalocean.com/**
2. In left sidebar, click **"AI/ML"** or search for **"Gradient"**
3. Click **"Gradient"** (if not visible, enable in Marketplace)

### Step 2: Enable Gradient

1. Click **"Enable Gradient"** or **"Get Started"**
2. Read terms of service
3. Click **"Enable"** to activate

Your account now has Gradient API access! ✅

### Step 3: Create Gradient Project (Optional)

Gradient works at account level, but you can organize tokens by project:

1. Navigate to **Gradient → Projects** (if available)
2. Click **"New Project"**
3. Name: `axon-backend`
4. Click **"Create"**

### Step 4: Get Gradient Configuration

In Gradient dashboard, you'll see:

```
Provider:     DigitalOcean Gradient
Base URL:     https://api.digitalocean.com/v2/ai
Model:        gpt-4.1-mini (or other available models)
API Key:      Use your DIGITALOCEAN_API_TOKEN (from Step: Generate API Token)
```

### Store Gradient Config

```bash
# backend/.env
AXON_MODE=gradient  # Use Gradient as LLM provider
GRADIENT_API_KEY=dop_v1_xxxx...  # Same as DIGITALOCEAN_API_TOKEN
GRADIENT_MODEL=gpt-4.1-mini
GRADIENT_BASE_URL=https://api.digitalocean.com/v2/ai
```

✅ **You now have:**
- `GRADIENT_API_KEY` (same as DIGITALOCEAN_API_TOKEN)
- `GRADIENT_MODEL`
- `GRADIENT_BASE_URL`

---

## Deploy ADK Agents

### Overview

ADK agents are 4 specialized services that handle planning, research, reasoning, and building tasks.

For hackathon, you have options:
1. **Option A:** Use mock endpoint URLs (development)
2. **Option B:** Deploy actual agents to App Platform (production)

---

## Option A: Mock Agent URLs (For Dev/Testing)

If you want to develop/test without deploying actual agents:

```bash
# backend/.env
AXON_MODE=mock  # Use mock mode to generate test responses
# OR keep AXON_MODE=gradient and don't use real agents yet
```

You can come back to deploy real agents later.

**Skip to: [Collect All Environment Variables](#collect-all-environment-variables)**

---

## Option B: Deploy Real ADK Agents

### Prerequisites for Deployment

- Git installed
- Agent code repositories
- DigitalOcean account with API token (from above ✓)
- ~5-10 minutes per agent deployment

### Step 1: Prepare Agent Code

Create 4 agent repositories (or clone from templates):

```
/agents
  ├─ planner-agent/
  │  ├─ main.py
  │  ├─ requirements.txt
  │  └─ Dockerfile
  ├─ research-agent/
  │  ├─ main.py
  │  ├─ requirements.txt
  │  └─ Dockerfile
  ├─ reasoning-agent/
  │  ├─ main.py
  │  ├─ requirements.txt
  │  └─ Dockerfile
  └─ builder-agent/
     ├─ main.py
     ├─ requirements.txt
     └─ Dockerfile
```

Each agent needs:
- **main.py** - FastAPI app with `/run` and `/health` endpoints
- **requirements.txt** - Python dependencies
- **Dockerfile** - Container configuration

### Example Agent Structure (main.py)

```python
# agents/planner-agent/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

app = FastAPI()

class AgentRequest(BaseModel):
    prompt: str
    context: Optional[Dict[str, Any]] = None

class AgentResponse(BaseModel):
    response: str
    metadata: Optional[Dict[str, Any]] = None

@app.post("/run")
async def run_agent(request: AgentRequest):
    """Execute planning agent"""
    try:
        # Your agent logic here
        response = await process_planning(request.prompt, request.context)
        
        return AgentResponse(
            response=response,
            metadata={"tokens": 1024, "model": "planner-v1"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "agent": "planner"}

async def process_planning(prompt: str, context: Optional[Dict]) -> str:
    """Your planning logic"""
    # TODO: Implement actual planning logic
    return f"Planning response for: {prompt}"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Example Dockerfile

```dockerfile
# agents/planner-agent/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### Step 2: Deploy to App Platform

DigitalOcean's App Platform is the easiest way to deploy agents.

#### Via Dashboard:

1. Go to **https://cloud.digitalocean.com/apps**
2. Click **"Create App"**
3. Select source:
   - **GitHub** (recommended for auto-deployment)
   - **Docker Hub**
   - **Docker Registry**
   - **Upload Docker Image**

#### If Using GitHub:

1. Click **"GitHub"**
2. Authorize DigitalOcean to access your GitHub
3. Select repository with agent code
4. Select branch (main/master)
5. Choose plan:
   - **Basic** ($5-20/month) - Good for dev
   - **Professional** ($20+/month) - For production

#### Configure App:

1. **Name:** `axon-planner-agent`
2. **Source:** Select Dockerfile path
3. **Environment Variables:**
   ```
   AXON_MODE=real
   LOG_LEVEL=INFO
   ```
4. **HTTP Port:** 8080
5. Click **"Next"**

#### Set Resources:

- Instance Type: Basic (1GB RAM, 1 vCPU)
- Instances: 1 (scale to 3+ for production)
- Click **"Create Resources"**

#### Monitor Deployment:

The deployment takes 3-5 minutes. Watch the logs:
```
Building Docker image...
Pushing to registry...
Deploying to App Platform...
App is live!
```

#### Get Public URL:

Once deployed, App Platform assigns a public URL:
```
https://axon-planner-agent.ondigitalocean.app
```

This is your **AXON_PLANNER_AGENT_URL** ✅

### Step 3: Repeat for All 4 Agents

Repeat Step 2 for:
- Research Agent → `AXON_RESEARCH_AGENT_URL`
- Reasoning Agent → `AXON_REASONING_AGENT_URL`
- Builder Agent → `AXON_BUILDER_AGENT_URL`

### Via CLI (Alternative - Advanced)

If you prefer command-line:

```bash
# Install DigitalOcean CLI
brew install doctl  # macOS
# or
choco install doctl  # Windows
# or
apt-get install doctl  # Linux

# Authenticate
doctl auth init

# Create app from app.yaml
doctl apps create --spec app.yaml

# Get app status
doctl apps list
doctl apps get <app-id>
```

---

## Collect All Environment Variables

### Summary Table

| Variable | Value | How to Get | Status |
|----------|-------|-----------|--------|
| `DIGITALOCEAN_API_TOKEN` | `dop_v1_xxxx...` | [Generate API Token](#generate-api-token) | ✅ |
| `GRADIENT_API_KEY` | `dop_v1_xxxx...` | Same as above | ✅ |
| `GRADIENT_MODEL` | `gpt-4.1-mini` | Shown in Gradient dashboard | ✅ |
| `GRADIENT_BASE_URL` | `https://api.digitalocean.com/v2/ai` | Fixed value | ✅ |
| `AXON_PLANNER_AGENT_URL` | `https://axon-planner.ondigitalocean.app` | [Deploy ADK Agents](#deploy-adk-agents) | ⏳ |
| `AXON_RESEARCH_AGENT_URL` | `https://axon-research.ondigitalocean.app` | [Deploy ADK Agents](#deploy-adk-agents) | ⏳ |
| `AXON_REASONING_AGENT_URL` | `https://axon-reasoning.ondigitalocean.app` | [Deploy ADK Agents](#deploy-adk-agents) | ⏳ |
| `AXON_BUILDER_AGENT_URL` | `https://axon-builder.ondigitalocean.app` | [Deploy ADK Agents](#deploy-adk-agents) | ⏳ |

### Quick Copy-Paste Template

Once you have all values:

```bash
# backend/.env

# ===== DigitalOcean Authentication =====
DIGITALOCEAN_API_TOKEN=dop_v1_xxxx...

# ===== Gradient LLM Configuration =====
AXON_MODE=gradient
GRADIENT_API_KEY=dop_v1_xxxx...
GRADIENT_MODEL=gpt-4.1-mini
GRADIENT_BASE_URL=https://api.digitalocean.com/v2/ai

# ===== ADK Agent URLs (Real Mode) =====
# AXON_MODE=real  # Uncomment to switch to real mode
AXON_PLANNER_AGENT_URL=https://axon-planner.ondigitalocean.app
AXON_RESEARCH_AGENT_URL=https://axon-research.ondigitalocean.app
AXON_REASONING_AGENT_URL=https://axon-reasoning.ondigitalocean.app
AXON_BUILDER_AGENT_URL=https://axon-builder.ondigitalocean.app

# ===== Timeouts =====
AXON_AGENT_TIMEOUT=120
```

---

## Configure Backend .env

### Step 1: Create .env File

```bash
cd backend
touch .env
```

### Step 2: Add All Variables

Copy template above and paste into `.env`

### Step 3: Update Values

Replace placeholders with your actual values:

```bash
DIGITALOCEAN_API_TOKEN=dop_v1_1a2b3c4d5e...  # Your actual token
GRADIENT_API_KEY=dop_v1_1a2b3c4d5e...        # Same as above
AXON_PLANNER_AGENT_URL=https://axon-planner-xxxx.ondigitalocean.app  # Your URL
```

### Step 4: Keep .env Secure

```bash
# Make sure .env is in .gitignore
echo ".env" >> .gitignore

# Don't commit credentials!
git add .gitignore
git commit -m "Add .env to gitignore"
```

### Step 5: Load Environment

```bash
# Load .env (your backend should automatically load this)
source .env  # macOS/Linux
# or in PowerShell:
# Get-Content .env | ForEach-Object { $parts = $_.Split('='); if ($parts.length -eq 2) { [Environment]::SetEnvironmentVariable($parts[0], $parts[1]) } }
```

---

## Verify Setup

### Step 1: Test API Token

```bash
# Test DIGITALOCEAN_API_TOKEN
curl -X GET "https://api.digitalocean.com/v2/account" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dop_v1_xxxx..."

# Expected response:
# {
#   "account": {
#     "droplet_limit": 10,
#     "floating_ip_limit": 3,
#     "email": "your-email@example.com",
#     "status": "active",
#     ...
#   }
# }
```

### Step 2: Test Gradient Endpoint

```bash
# Test GRADIENT_API_KEY
curl -X POST "https://api.digitalocean.com/v2/ai/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dop_v1_xxxx..." \
  -d '{
    "model": "gpt-4.1-mini",
    "messages": [
      {"role": "user", "content": "Say hello"}
    ]
  }'

# Expected response:
# {
#   "choices": [
#     {
#       "message": {
#         "content": "Hello! How can I assist you today?",
#         "role": "assistant"
#       },
#       "finish_reason": "stop",
#       "index": 0
#     }
#   ],
#   "usage": {
#     "prompt_tokens": 8,
#     "completion_tokens": 10,
#     "total_tokens": 18
#   }
# }
```

### Step 3: Test Agent URLs

```bash
# Test AXON_PLANNER_AGENT_URL
curl -X GET "https://axon-planner.ondigitalocean.app/health" \
  -H "Authorization: Bearer dop_v1_xxxx..."

# Expected response:
# {
#   "status": "healthy",
#   "agent": "planner"
# }
```

### Step 4: Run AXON Backend Tests

```bash
cd backend

# Test Gradient
python scripts/test_gradient_mode.py

# Test ADK Agents
python scripts/test_real_mode_agents.py

# Full integration
AXON_BACKEND_URL=http://localhost:8000 python scripts/test_full_integration.py
```

---

## Troubleshooting

### Issue: "Invalid API Token"

**Cause:** Token is incorrect or expired
**Solution:**
1. Go to DigitalOcean dashboard → Settings → API
2. Delete old token
3. Generate new token
4. Update .env file

### Issue: "Gradient API not accessible"

**Cause:** Gradient not enabled on account
**Solution:**
1. Go to AI/ML → Gradient
2. Click "Enable Gradient"
3. Wait 1-2 minutes
4. Test again

### Issue: "Agent URL returns 404"

**Cause:** Agent not deployed or still deploying
**Solution:**
1. Go to App Platform
2. Check deployment status
3. Wait for "Live" status
4. Verify URL is correct
5. Test health endpoint

### Issue: "Timeout connecting to agent"

**Cause:** 
- Agent not responding
- Network connectivity issue
- Agent crashed
**Solution:**
1. Check App Platform logs
2. Restart app
3. Check agent code for errors
4. Increase timeout in `.env`: `AXON_AGENT_TIMEOUT=180`

### Issue: "401 Unauthorized"

**Cause:** API token missing or incorrect in request headers
**Solution:**
1. Verify token in .env
2. Check header format: `Authorization: Bearer dop_v1_xxxx`
3. Ensure no extra spaces or quotes

---

## Next Steps

### 1. Start AXON Backend

```bash
cd backend
python start.py
```

### 2. Test with Gradient

```bash
export AXON_MODE=gradient
curl -X POST http://localhost:8000/tasks \
  -H "API-Key: test-key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "Testing Gradient integration"
  }'
```

### 3. Switch to Real Mode (When Ready)

```bash
export AXON_MODE=real
# Make sure all agent URLs are deployed first
python start.py
```

### 4. Monitor Logs

```bash
# Watch for LLM/agent calls
tail -f backend/logs/axon.log | grep "llm_call\|agent"
```

---

## Security Best Practices

✅ **DO:**
- Store API tokens in .env (add to .gitignore)
- Rotate tokens quarterly
- Use environment-specific tokens (dev/prod separate)
- Enable DigitalOcean billing alerts
- Monitor API usage in dashboard

❌ **DON'T:**
- Commit .env to Git
- Share API tokens in Slack/email
- Use same token for multiple environments
- Expose tokens in logs
- Disable API key validation

---

## Cost Estimation

| Service | Price | Notes |
|---------|-------|-------|
| Gradient API | Pay-per-use | ~$0.01 per 1K tokens |
| App Platform (1 agent) | $5-20/month | Starts at $5/month |
| App Platform (4 agents) | $20-80/month | Scales with usage |
| Database (PostgreSQL) | $10-100/month | Depends on size |
| **Total (small setup)** | **~$60-150/month** | Entry-level production |

---

## Support & Resources

- **DigitalOcean Docs:** https://docs.digitalocean.com/
- **Gradient Docs:** https://docs.digitalocean.com/products/ai/
- **App Platform Guide:** https://docs.digitalocean.com/products/app-platform/
- **Community Forums:** https://www.digitalocean.com/community/
- **Support:** Create ticket in DigitalOcean dashboard

---

## Checklist: Ready for Production

- [ ] DigitalOcean account created
- [ ] API token generated (DIGITALOCEAN_API_TOKEN)
- [ ] Gradient enabled on account
- [ ] Gradient config obtained (MODEL, BASE_URL)
- [ ] 4 ADK agents deployed to App Platform
- [ ] All agent URLs collected
- [ ] .env file created with all variables
- [ ] .env added to .gitignore
- [ ] API token tested with curl
- [ ] Gradient endpoint tested with curl
- [ ] Agent health endpoints tested
- [ ] AXON backend started successfully
- [ ] Tests passing (gradient + real mode)
- [ ] Logs showing successful LLM calls
- [ ] Ready for hackathon demo!

---

**Congratulations! You're ready to use AXON with DigitalOcean Gradient & ADK Agents! 🚀**
