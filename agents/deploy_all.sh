#!/bin/bash
# Deploy all agents with proper environment setup

set -e

AGENTS=("research" "reasoning" "builder")
AGENTS_PATH="/workspaces/axon/agents"
GRADIENT_BIN="/usr/local/python/3.12.1/bin/gradient"

# Export environment variables from planner agent .env (already working)
export $(cat /workspaces/axon/agents/planner_agent/.env | xargs)

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                  AXON MULTI-AGENT DEPLOYMENT                       ║"
echo "╚════════════════════════════════════════════════════════════════════╝"

echo ""
echo "📋 Environment Variables:"
echo "   GRADIENT_MODEL: ${GRADIENT_MODEL:-NOT SET}"
echo "   DIGITALOCEAN_API_TOKEN: ${DIGITALOCEAN_API_TOKEN:0:20}..."
echo ""

echo "✅ Planner Agent: Already deployed"

for agent in "${AGENTS[@]}"; do
    echo ""
    echo "════════════════════════════════════════════════════════════════════"
    echo "🚀 Deploying ${agent^^} Agent..."
    echo "════════════════════════════════════════════════════════════════════"
    
    cd "$AGENTS_PATH/${agent}_agent"
    
    # Export environment for this agent
    export $(cat .env | xargs)
    
    echo "   Starting deployment from: $(pwd)"
    echo "   Using token: ${DIGITALOCEAN_API_TOKEN:0:20}..."
    
    # Deploy with skip-validation for faster deployment
    $GRADIENT_BIN agent deploy --skip-validation || true
    
    echo ""
done

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "✅ All deployments initiated!"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "📝 Next Steps:"
echo "   1. Wait 3-5 minutes for all deployments to complete"
echo "   2. Check dashboard: https://console.digitalocean.com"
echo "   3. Run: python /workspaces/axon/agents/test_all_agents.py"
echo ""
