#!/usr/bin/env python3
"""
Test all deployed AXON agents on DigitalOcean
"""
import httpx
import asyncio
import json
from pathlib import Path
import os
import sys
from typing import Optional

# Agent endpoints - All deployed successfully
AGENTS_CONFIG = {
    "planner": {
        "url": "https://agents.do-ai.run/v1/19c9775d-9c16-4899-b54d-09b2f1b21c3a/axon-planner-agent/run",
        "test_prompt": "Create a detailed plan for building a machine learning pipeline"
    },
    "research": {
        "url": "https://agents.do-ai.run/v1/6d2bc932-395d-4db2-b7a2-323a8ac5e89d/axon-research-agent/run",
        "test_prompt": "Research the latest advances in retrieval augmented generation"
    },
    "reasoning": {
        "url": "https://agents.do-ai.run/v1/f9226f93-7398-4dec-bd78-d47fa459ce18/axon-reasoning-agent/run",
        "test_prompt": "Evaluate the pros and cons of different database architectures"
    },
    "builder": {
        "url": "https://agents.do-ai.run/v1/37484ece-6465-4aeb-ab17-68611a9fb082/axon-builder-agent/run",
        "test_prompt": "Generate a complete implementation plan for a REST API"
    }
}

def get_token() -> str:
    """Get DigitalOcean API token from environment"""
    token = os.getenv("DIGITALOCEAN_API_TOKEN")
    if not token:
        print("❌ Error: DIGITALOCEAN_API_TOKEN not set")
        sys.exit(1)
    return token

async def test_agent(agent_name: str, url: str, prompt: str, token: str) -> dict:
    """Test a single agent"""
    if not url:
        return {
            "agent": agent_name,
            "status": "SKIPPED",
            "error": "URL not configured",
            "timestamp": None
        }
    
    print(f"\n🧪 Testing {agent_name.upper()} Agent...")
    print(f"   URL: {url}")
    print(f"   Prompt: {prompt[:50]}...")
    
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "prompt": prompt,
                "context": {
                    "user_id": "test-user",
                    "session_id": "test-session",
                    "mode": "test"
                }
            }
            
            response = await client.post(url, json=payload, headers=headers)
            
            result = {
                "agent": agent_name,
                "status_code": response.status_code,
                "url": url,
                "timestamp": None
            }
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    result["status"] = "SUCCESS"
                    result["response_size"] = len(response.text)
                    result["has_response"] = "response" in data
                    result["has_metadata"] = "metadata" in data
                    
                    print(f"   ✅ Status: {response.status_code}")
                    print(f"   ✅ Response size: {result['response_size']} bytes")
                    print(f"   ✅ Valid JSON structure")
                    
                except json.JSONDecodeError:
                    result["status"] = "ERROR"
                    result["error"] = "Invalid JSON response"
                    print(f"   ❌ Invalid JSON response")
            else:
                result["status"] = "ERROR"
                result["error"] = f"HTTP {response.status_code}"
                print(f"   ❌ Status: {response.status_code}")
                print(f"   ❌ Response: {response.text[:200]}")
            
            return result
    
    except httpx.ConnectError as e:
        print(f"   ❌ Connection error: {str(e)[:100]}")
        return {
            "agent": agent_name,
            "status": "ERROR",
            "error": "Connection failed",
            "url": url
        }
    except asyncio.TimeoutError:
        print(f"   ⏱️  Timeout (60s) - Agent may still be initializing")
        return {
            "agent": agent_name,
            "status": "TIMEOUT",
            "error": "Request timeout",
            "url": url
        }
    except Exception as e:
        print(f"   ❌ Error: {str(e)[:100]}")
        return {
            "agent": agent_name,
            "status": "ERROR",
            "error": str(e)[:100],
            "url": url
        }

async def main():
    """Test all deployed agents"""
    token = get_token()
    
    print("\n")
    print("╔" + "="*68 + "╗")
    print("║" + " "*15 + "AXON AGENT ENDPOINT TESTING" + " "*27 + "║")
    print("╚" + "="*68 + "╝")
    
    print(f"\n📋 Agent Configuration:")
    for agent, config in AGENTS_CONFIG.items():
        status = "✅ Configured" if config["url"] else "⚠️  Not configured"
        print(f"   {agent.upper()}: {status}")
    
    # Test all agents
    results = []
    for agent_name, config in AGENTS_CONFIG.items():
        result = await test_agent(
            agent_name,
            config["url"],
            config["test_prompt"],
            token
        )
        results.append(result)
        await asyncio.sleep(1)  # Rate limiting
    
    # Print summary
    print(f"\n")
    print("╔" + "="*68 + "╗")
    print("║" + " "*20 + "TEST RESULTS SUMMARY" + " "*28 + "║")
    print("╚" + "="*68 + "╝")
    
    successful = sum(1 for r in results if r["status"] == "SUCCESS")
    errors = sum(1 for r in results if r["status"] == "ERROR")
    timeouts = sum(1 for r in results if r["status"] == "TIMEOUT")
    skipped = sum(1 for r in results if r["status"] == "SKIPPED")
    
    print(f"\n📊 Results:")
    print(f"   ✅ Successful: {successful}/4")
    print(f"   ⏱️  Timeout: {timeouts}/4")
    print(f"   ❌ Errors: {errors}/4")
    print(f"   ⊘  Skipped: {skipped}/4")
    
    print(f"\n📝 Detailed Results:")
    for result in results:
        status_emoji = {
            "SUCCESS": "✅",
            "ERROR": "❌",
            "TIMEOUT": "⏱️",
            "SKIPPED": "⊘"
        }
        print(f"   {status_emoji.get(result['status'], '?')} {result['agent'].upper()}: {result['status']}")
        if result.get("error"):
            print(f"      Error: {result['error']}")
    
    print(f"\n🔗 Configuration Instructions:")
    print(f"   Once all agents are deployed, update AGENTS_CONFIG with:")
    print(f"   - Planner: https://agents.do-ai.run/v1/<project-id>/axon-planner-agent/run")
    print(f"   - Research: https://agents.do-ai.run/v1/<project-id>/axon-research-agent/run")
    print(f"   - Reasoning: https://agents.do-ai.run/v1/<project-id>/axon-reasoning-agent/run")
    print(f"   - Builder: https://agents.do-ai.run/v1/<project-id>/axon-builder-agent/run")
    
    print(f"\n📖 Backend Integration:")
    print(f"   Update backend/.env with the agent URLs above")
    print(f"   Then run: python tests/integration/test_all_agents.py")
    
    print(f"\n" + "="*70 + "\n")
    
    # Return exit code based on results
    return 0 if successful == 4 else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
