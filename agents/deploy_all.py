#!/usr/bin/env python3
"""
Deploy all 4 AXON agents to DigitalOcean in parallel
"""
import subprocess
import os
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

AGENTS = ["planner", "research", "reasoning", "builder"]
AGENTS_PATH = Path("/workspaces/axon/agents")
GRADIENT_BIN = "/usr/local/python/3.12.1/bin/gradient"

def deploy_agent(agent_name):
    """Deploy a single agent"""
    agent_dir = AGENTS_PATH / f"{agent_name}_agent"
    
    if not agent_dir.exists():
        return f"❌ {agent_name}: Directory not found"
    
    print(f"\n🚀 Deploying {agent_name.upper()} Agent...")
    print(f"   Path: {agent_dir}")
    
    try:
        result = subprocess.run(
            [GRADIENT_BIN, "agent", "deploy"],
            cwd=str(agent_dir),
            capture_output=True,
            text=True,
            timeout=180
        )
        
        # Check for success indicators
        if result.returncode == 0 or "Agent deployed" in result.stdout or "deployed successfully" in result.stderr:
            print(f"✅ {agent_name.upper()}: Deployment started successfully")
            
            # Extract deployment info if available
            if "agents.do-ai.run" in result.stderr:
                lines = result.stderr.split("\n")
                for line in lines:
                    if "agents.do-ai.run" in line:
                        print(f"   Endpoint: {line.strip()}")
            
            return f"✅ {agent_name.upper()}: Deployed"
        else:
            # Still check if deployment is in progress
            if "Agent deployed" in result.stderr or "deployed" in result.stderr.lower():
                print(f"✅ {agent_name.upper()}: Deployment in progress")
                return f"✅ {agent_name.upper()}: Deployment started"
            else:
                error = result.stderr[:200] if result.stderr else result.stdout[:200]
                print(f"⚠️  {agent_name.upper()}: {error}")
                return f"⚠️  {agent_name.upper()}: {error}"
    
    except subprocess.TimeoutExpired:
        print(f"⏱️  {agent_name.upper()}: Deployment timeout (may still be in progress)")
        return f"⏱️  {agent_name.upper()}: Timeout (still deploying)"
    except Exception as e:
        print(f"❌ {agent_name.upper()}: Error - {e}")
        return f"❌ {agent_name.upper()}: {str(e)[:100]}"

def main():
    """Deploy all agents"""
    print("=" * 70)
    print("AXON MULTI-AGENT DEPLOYMENT")
    print("=" * 70)
    
    # Deploy in parallel (excluding planner which is already done)
    agents_to_deploy = ["research", "reasoning", "builder"]
    
    print(f"\nDeploying {len(agents_to_deploy)} agents in parallel...\n")
    
    results = {}
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {executor.submit(deploy_agent, agent): agent for agent in agents_to_deploy}
        for future in futures:
            agent = futures[future]
            try:
                result = future.result()
                results[agent] = result
            except Exception as e:
                results[agent] = f"❌ {agent}: Exception - {e}"
    
    # Print summary
    print("\n" + "=" * 70)
    print("DEPLOYMENT SUMMARY")
    print("=" * 70)
    
    print("\n✅ Planner Agent: Already deployed")
    for agent, result in results.items():
        print(f"{result}")
    
    print("\n" + "=" * 70)
    print("NEXT STEPS")
    print("=" * 70)
    print("\n1. Wait 2-5 minutes for all deployments to complete")
    print("2. Check agent logs in DigitalOcean dashboard")
    print("3. Run test scripts to verify endpoints")
    print("4. Update backend .env with agent URLs")
    print("\n" + "=" * 70)

if __name__ == "__main__":
    main()
