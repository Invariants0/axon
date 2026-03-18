# DigitalOcean Setup - Quick Reference Card

**Print this or keep handy while setting up AXON! 📋**

---

## Environment Variables at a Glance

```bash
# ===== REQUIRED FOR ALL MODES =====
DIGITALOCEAN_API_TOKEN=dop_v1_xxxx...
AXON_MODE=gradient  # or: mock, gemini, real

# ===== REQUIRED IF USING GRADIENT MODE =====
GRADIENT_API_KEY=dop_v1_xxxx...  # Usually same as DIGITALOCEAN_API_TOKEN
GRADIENT_MODEL=gpt-4.1-mini
GRADIENT_BASE_URL=https://api.digitalocean.com/v2/ai

# ===== REQUIRED IF USING REAL MODE (ADK Agents) =====
AXON_PLANNER_AGENT_URL=https://axon-planner.ondigitalocean.app
AXON_RESEARCH_AGENT_URL=https://axon-research.ondigitalocean.app
AXON_REASONING_AGENT_URL=https://axon-reasoning.ondigitalocean.app
AXON_BUILDER_AGENT_URL=https://axon-builder.ondigitalocean.app
```

---

## 5-Minute Setup Checklist

### ✓ Step 1: Create Account (2 min)
- [ ] Go to https://www.digitalocean.com/ → Sign Up
- [ ] Verify email
- [ ] Add payment method
- **RESULT:** Active DigitalOcean account

### ✓ Step 2: Generate API Token (1 min)
- [ ] Go to https://cloud.digitalocean.com/
- [ ] Navigate: Account → Settings → API → Tokens
- [ ] Click "Generate New Token"
- [ ] Name: `axon-backend`
- [ ] Scopes: Read & Write
- [ ] Copy token: `dop_v1_xxxx...`
- **RESULT:** `DIGITALOCEAN_API_TOKEN=dop_v1_xxxx...`

### ✓ Step 3: Enable Gradient (1 min)
- [ ] In dashboard, click AI/ML → Gradient
- [ ] Click "Enable Gradient"
- [ ] Wait for activation
- **RESULT:** Gradient API ready. Model: `gpt-4.1-mini`, URL: `https://api.digitalocean.com/v2/ai`

### ✓ Step 4: Deploy Agents (Optional, ~15 min)
- [ ] Prepare agent code (or use mock URLs)
- [ ] Go to App Platform → Create App
- [ ] Deploy each agent (4 total)
- [ ] Get public URL for each
- **RESULT:** 4 agent URLs

### ✓ Step 5: Create .env (1 min)
- [ ] Create `backend/.env`
- [ ] Add all variables from above
- [ ] Run tests
- **RESULT:** Ready to run AXON!

---

## Where to Find Each Variable

| Variable | Where | Username |
|----------|-------|----------|
| **DIGITALOCEAN_API_TOKEN** | https://cloud.digitalocean.com/ → Account → Settings → API | Use your DigitalOcean account |
| **GRADIENT_MODEL** | https://cloud.digitalocean.com/ → AI/ML → Gradient → Dashboard | Check available models |
| **GRADIENT_BASE_URL** | Fixed value (copied below) | Always this URL |
| **AXON_*_AGENT_URL** | https://cloud.digitalocean.com/ → App Platform → Your Apps | After deployment |

---

## Copy-Paste Template

Open your text editor and fill this in:

```bash
# backend/.env

AXON_MODE=gradient

# From Step 2: API Token
DIGITALOCEAN_API_TOKEN=paste_your_token_here

# From Step 3: Gradient
GRADIENT_API_KEY=paste_your_token_here_again
GRADIENT_MODEL=gpt-4.1-mini
GRADIENT_BASE_URL=https://api.digitalocean.com/v2/ai

# From Step 4: Agent URLs (leave empty if using mock)
AXON_PLANNER_AGENT_URL=https://your-planner-url.ondigitalocean.app
AXON_RESEARCH_AGENT_URL=https://your-research-url.ondigitalocean.app
AXON_REASONING_AGENT_URL=https://your-reasoning-url.ondigitalocean.app
AXON_BUILDER_AGENT_URL=https://your-builder-url.ondigitalocean.app

# Timeouts
AXON_AGENT_TIMEOUT=120
```

---

## Quick Validation (Copy-Paste These Commands)

### Test API Token
```bash
# Replace YOUR_TOKEN with actual token
curl -X GET "https://api.digitalocean.com/v2/account" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return: account info with "status": "active"
```

### Test Gradient Endpoint
```bash
# Replace YOUR_TOKEN with actual token
curl -X POST "https://api.digitalocean.com/v2/ai/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "model": "gpt-4.1-mini",
    "messages": [{"role": "user", "content": "Say hello"}]
  }'

# Should return: a message response
```

### Test Agent Health
```bash
# Test one agent URL
curl "https://your-planner-url.ondigitalocean.app/health"

# Should return: {"status": "healthy"}
```

---

## Troubleshooting in 30 Seconds

| Issue | Fix |
|-------|-----|
| "auth failed" | Check token name has "dop_v1_" prefix |
| "invalid token" | Regenerate from dashboard |
| "404 not found" | Check agent deployment is complete |
| "timeout" | Increase AXON_AGENT_TIMEOUT to 180 |
| "Gradient not available" | Click Enable in AI/ML section |

---

## Example: Real Working Setup

Here's what a completed DigitalOcean setup looks like:

```bash
# backend/.env (REAL EXAMPLE)

AXON_MODE=gradient

DIGITALOCEAN_API_TOKEN=dop_v1_abc123xyz789...

GRADIENT_API_KEY=dop_v1_abc123xyz789...
GRADIENT_MODEL=gpt-4.1-mini
GRADIENT_BASE_URL=https://api.digitalocean.com/v2/ai

AXON_PLANNER_AGENT_URL=https://axon-planner-a1b2.ondigitalocean.app
AXON_RESEARCH_AGENT_URL=https://axon-research-c3d4.ondigitalocean.app
AXON_REASONING_AGENT_URL=https://axon-reasoning-e5f6.ondigitalocean.app
AXON_BUILDER_AGENT_URL=https://axon-builder-g7h8.ondigitalocean.app

AXON_AGENT_TIMEOUT=120
```

---

## Links You'll Need

- **DigitalOcean Dashboard:** https://cloud.digitalocean.com/
- **Account Settings:** https://cloud.digitalocean.com/settings/account
- **API Tokens:** https://cloud.digitalocean.com/account/api/tokens
- **Gradient:** https://cloud.digitalocean.com/ai/
- **App Platform:** https://cloud.digitalocean.com/apps/

---

## Did You Know?

- **API Token is your password:** Treat it like a credit card number - don't share!
- **GRADIENT_API_KEY is the same token:** Use DIGITALOCEAN_API_TOKEN for Gradient
- **Agent URLs are public:** You can test them manually with `curl`
- **Free tier available:** Check if you qualify for DigitalOcean free credits
- **24/7 Support:** DigitalOcean has live chat support in dashboard

---

## You're Done When...

✅ DIGITALOCEAN_API_TOKEN obtained  
✅ GRADIENT_* variables configured  
✅ (Optional) AXON_*_AGENT_URL values collected  
✅ backend/.env file created  
✅ .env added to .gitignore  
✅ curl tests passing  
✅ AXON backend starting successfully  

**🎉 Ready to demo AXON!**

---

**Questions?** Check DIGITALOCEAN_SETUP_GUIDE.md for full details!
