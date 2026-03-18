#!/usr/bin/env python3
"""
Simple synchronous test for all AXON agents
"""
import httpx
import json
import os
import sys

# Agent endpoints
AGENTS = {
    "planner": "https://agents.do-ai.run/v1/19c9775d-9c16-4899-b54d-09b2f1b21c3a/axon-planner-agent/run",
    "research": "https://agents.do-ai.run/v1/6d2bc932-395d-4db2-b7a2-323a8ac5e89d/axon-research-agent/run",
    "reasoning": "https://agents.do-ai.run/v1/f9226f93-7398-4dec-bd78-d47fa459ce18/axon-reasoning-agent/run",
    "builder": "https://agents.do-ai.run/v1/37484ece-6465-4aeb-ab17-68611a9fb082/axon-builder-agent/run",
}

TOKEN = os.getenv("DIGITALOCEAN_API_TOKEN")
if not TOKEN:
    print("❌ DIGITALOCEAN_API_TOKEN not set")
    sys.exit(1)

def test_agent(name, url):
    """Test a single agent"""
    print(f"\n{'='*70}")
    print(f"Testing {name.upper()} Agent")
    print(f"{'='*70}")
    print(f"URL: {url}")
    
    try:
        response = httpx.post(
            url,
            json={
                "prompt": f"What is the purpose of a {name} agent?",
                "context": {"user_id": "test"}
            },
            headers={"Authorization": f"Bearer {TOKEN}"},
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Size: {len(response.text)} bytes")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"✅ SUCCESS - Valid JSON response")
                print(f"Has response field: {'response' in data}")
                print(f"Has metadata field: {'metadata' in data}")
                return True
            except json.JSONDecodeError:
                print(f"❌ ERROR - Invalid JSON")
                print(f"Response: {response.text[:200]}")
                return False
        else:
            print(f"❌ ERROR - {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return False
    
    except httpx.TimeoutException:
        print(f"⏱️  TIMEOUT - Agent took too long (30s)")
        return False
    except httpx.ConnectError as e:
        print(f"❌ CONNECTION ERROR - {str(e)[:100]}")
        return False
    except Exception as e:
        print(f"❌ ERROR - {str(e)[:200]}")
        return False

def main():
    print("\n" + "╔" + "="*68 + "╗")
    print("║" + " "*15 + "AXON AGENTS QUICK TEST" + " "*31 + "║")
    print("╚" + "="*68 + "╝")
    
    results = {}
    for agent_name, agent_url in AGENTS.items():
        results[agent_name] = test_agent(agent_name, agent_url)
    
    # Summary
    print(f"\n" + "╔" + "="*68 + "╗")
    print("║" + " "*20 + "TEST SUMMARY" + " "*35 + "║")
    print("╚" + "="*68 + "╝\n")
    
    success_count = sum(1 for v in results.values() if v)
    
    for agent, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {agent.upper()}")
    
    print(f"\nTotal: {success_count}/4 agents passing")
    
    if success_count == 4:
        print("🎉 ALL AGENTS OPERATIONAL!")
        return 0
    else:
        print("⚠️  Some agents need attention")
        return 1

if __name__ == "__main__":
    sys.exit(main())
