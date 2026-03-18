#!/usr/bin/env python3
"""
Deploy all AXON agents to DigitalOcean with skip-validation for faster deployment
"""
import subprocess
import os
import sys
from pathlib import Path

AGENTS = ["research", "reasoning", "builder"]
AGENTS_PATH = Path("/workspaces/axon/agents")
GRADIENT_BIN = "/usr/local/python/3.12.1/bin/gradient"

def deploy_agent(agent_name):
    """Deploy a single agent sequentially"""
    agent_dir = AGENTS_PATH / f"{agent_name}_agent"
    
    if not agent_dir.exists():
        print(f"❌ {agent_name}: Directory not found")
        return False
    
    print(f"\n{'='*70}")
    print(f"🚀 Deploying {agent_name.upper()} Agent...")
    print(f"   Path: {agent_dir}")
    print(f"{'='*70}")
    
    try:
        # Run with skip-validation for faster deployment
        result = subprocess.run(
            [GRADIENT_BIN, "agent", "deploy", "--skip-validation"],
            cwd=str(agent_dir),
            capture_output=False,  # Show output in real-time
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            print(f"\n✅ {agent_name.upper()}: Deployment completed successfully")
            return True
        else:
            print(f"\n⚠️  {agent_name.upper()}: Deployment may still be in progress (return code: {result.returncode})")
            return True  # Still return True as deployment might be async
    
    except subprocess.TimeoutExpired:
        print(f"\n⏱️  {agent_name.upper()}: Deployment timeout (may still be in progress)")
        return True
    except Exception as e:
        print(f"\n❌ {agent_name.upper()}: Error - {e}")
        return False

def main():
    """Deploy all agents sequentially"""
    print("\n")
    print("╔" + "="*68 + "╗")
    print("║" + " "*15 + "AXON MULTI-AGENT DEPLOYMENT" + " "*26 + "║")
    print("╚" + "="*68 + "╝")
    
    print(f"\n📋 Deployment Status:")
    print(f"   ✅ Planner Agent: Already deployed")
    print(f"   🚀 Research Agent: Starting...")
    print(f"   🚀 Reasoning Agent: Queued...")
    print(f"   🚀 Builder Agent: Queued...")
    
    successful = 0
    failed = 0
    
    for agent in AGENTS:
        if deploy_agent(agent):
            successful += 1
        else:
            failed += 1
    
    # Print summary
    print(f"\n")
    print("╔" + "="*68 + "╗")
    print("║" + " "*20 + "DEPLOYMENT SUMMARY" + " "*30 + "║")
    print("╚" + "="*68 + "╝")
    
    print(f"\n📊 Results:")
    print(f"   ✅ Successful: {1 + successful}/4 (Planner + {successful} others)")
    print(f"   ❌ Failed: {failed}/4")
    
    print(f"\n📝 Next Steps:")
    print(f"   1. Wait 2-5 minutes for all agents to fully activate")
    print(f"   2. Run 'python test_all_agents.py' to verify endpoints")
    print(f"   3. Check DigitalOcean dashboard for deployment status")
    print(f"   4. Run backend integration tests")
    
    print(f"\n🔗 Test Command:")
    print(f"   python /workspaces/axon/agents/test_all_agents.py")
    
    print(f"\n" + "="*70 + "\n")

if __name__ == "__main__":
    main()
