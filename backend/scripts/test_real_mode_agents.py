#!/usr/bin/env python3
"""
Test DigitalOcean ADK Agent integration in AXON backend.

This script validates that ADK agents are properly configured and callable
in AXON_MODE=real.

Run: python scripts/test_real_mode_agents.py
"""

import asyncio
import json
import sys
from time import perf_counter

sys.path.insert(0, "/app/backend")

from src.config.config import get_settings
from src.providers.digitalocean.digitalocean_agent_client import (
    DigitalOceanAgentClient,
)
from src.providers.digitalocean.digitalocean_agent_router import (
    DigitalOceanAgentRouter,
)
from src.providers.digitalocean.digitalocean_agent_types import AgentRequest
from src.utils.logger import get_logger

logger = get_logger(__name__)


async def test_adk_config() -> bool:
    """Test that ADK agents are properly configured"""
    print("\n[TEST] ADK Agent Configuration Check")
    print("=" * 50)
    
    settings = get_settings()
    
    checks = {
        "DIGITALOCEAN_API_TOKEN set": bool(settings.digitalocean_api_token),
        "AXON_PLANNER_AGENT_URL set": bool(settings.axon_planner_agent_url),
        "AXON_RESEARCH_AGENT_URL set": bool(settings.axon_research_agent_url),
        "AXON_REASONING_AGENT_URL set": bool(settings.axon_reasoning_agent_url),
        "AXON_BUILDER_AGENT_URL set": bool(settings.axon_builder_agent_url),
    }
    
    for check, result in checks.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {check}")
    
    if settings.digitalocean_api_token:
        print(f"\nAPI Token: {settings.digitalocean_api_token[:10]}...")
    
    all_passed = all(checks.values())
    print(f"\nConfiguration: {'VALID' if all_passed else 'INVALID'}")
    
    return all_passed


async def test_adk_client_health() -> bool:
    """Test DigitalOceanAgentClient health checks"""
    print("\n[TEST] ADK Client Health Checks")
    print("=" * 50)
    
    settings = get_settings()
    
    if not settings.digitalocean_api_token:
        print("✗ SKIP: DIGITALOCEAN_API_TOKEN not configured")
        return False
    
    try:
        client = DigitalOceanAgentClient()
        
        agent_urls = {
            "planner": settings.axon_planner_agent_url,
            "research": settings.axon_research_agent_url,
            "reasoning": settings.axon_reasoning_agent_url,
            "builder": settings.axon_builder_agent_url,
        }
        
        all_healthy = True
        for agent_name, url in agent_urls.items():
            if not url:
                print(f"⊘ SKIPPED: {agent_name} - no URL configured")
                continue
            
            health = await client.health_check(url)
            status_icon = "✓" if health.get("status") == "healthy" else "✗"
            
            print(f"{status_icon} {agent_name}: {health.get('status')}")
            if health.get("error"):
                print(f"   Error: {health.get('error')[:100]}")
            
            if health.get("status") != "healthy":
                all_healthy = False
        
        return all_healthy
    except Exception as e:
        print(f"✗ ERROR: {str(e)[:200]}")
        logger.exception("adk_health_check_error", error=str(e))
        return False


async def test_adk_router() -> bool:
    """Test DigitalOceanAgentRouter"""
    print("\n[TEST] ADK Agent Router")
    print("=" * 50)
    
    settings = get_settings()
    
    if not settings.digitalocean_api_token:
        print("✗ SKIP: DIGITALOCEAN_API_TOKEN not configured")
        return False
    
    if not all([
        settings.axon_planner_agent_url,
        settings.axon_research_agent_url,
        settings.axon_reasoning_agent_url,
        settings.axon_builder_agent_url,
    ]):
        print("✗ SKIP: Not all agent URLs configured")
        return False
    
    try:
        router = DigitalOceanAgentRouter()
        
        agents = ["planning", "research", "reasoning", "builder"]
        all_ok = True
        
        for agent_name in agents:
            try:
                request = AgentRequest(
                    prompt=f"Test prompt for {agent_name}",
                    context={"test": True},
                )
                
                print(f"\nTesting {agent_name} agent...")
                
                started_at = perf_counter()
                response = await router.route_to_agent(
                    agent_name,
                    request.prompt,
                    request.context,
                    trace_id="test_trace_123",
                )
                latency = round(perf_counter() - started_at, 6)
                
                response_preview = response.response[:50] if response.response else "(empty)"
                print(f"✓ {agent_name}: Got response")
                print(f"  Response: {response_preview}...")
                print(f"  Latency: {latency}s")
                
            except Exception as e:
                print(f"✗ {agent_name}: {str(e)[:150]}")
                all_ok = False
        
        return all_ok
    except Exception as e:
        print(f"✗ ERROR: {str(e)[:200]}")
        logger.exception("adk_router_error", error=str(e))
        return False


async def test_adk_health_check_all() -> bool:
    """Test health_check_all method"""
    print("\n[TEST] ADK Router Health Check All")
    print("=" * 50)
    
    settings = get_settings()
    
    if not settings.digitalocean_api_token:
        print("✗ SKIP: DIGITALOCEAN_API_TOKEN not configured")
        return False
    
    try:
        router = DigitalOceanAgentRouter()
        results = await router.health_check_all()
        
        print(f"\nHealth check results:")
        all_ok = True
        for agent_name, status in results.items():
            status_text = status.get("status", "unknown")
            print(f"  {agent_name}: {status_text}")
            
            if status_text not in ["healthy", "not_configured"]:
                all_ok = False
        
        print(f"\n✓ All agents checked")
        return all_ok
    except Exception as e:
        print(f"✗ ERROR: {str(e)[:200]}")
        logger.exception("adk_health_all_error", error=str(e))
        return False


async def test_adk_error_recovery() -> bool:
    """Test error handling and recovery"""
    print("\n[TEST] ADK Error Recovery")
    print("=" * 50)
    
    settings = get_settings()
    
    if not settings.digitalocean_api_token:
        print("✗ SKIP: DIGITALOCEAN_API_TOKEN not configured")
        return False
    
    try:
        client = DigitalOceanAgentClient()
        
        # Test with invalid URL
        print("\nTesting with invalid agent URL...")
        try:
            request = AgentRequest(prompt="test")
            response = await client.call_agent(
                "http://invalid.local/agent",
                request,
                trace_id="error_test_123",
            )
            print("✗ FAIL: Should have raised error for invalid URL")
            return False
        except Exception as e:
            error_type = type(e).__name__
            print(f"✓ Correctly raised {error_type}")
            print(f"  Message: {str(e)[:100]}")
        
        # Test circuit breaker status
        print("\nCircuit breaker status:")
        breaker_status = await client.breaker_status()
        print(f"  State: {breaker_status.get('state', 'unknown')}")
        print(f"  Failure count: {breaker_status.get('failure_count', 0)}")
        
        return True
    except Exception as e:
        print(f"✗ ERROR: {str(e)[:200]}")
        logger.exception("adk_error_recovery_error", error=str(e))
        return False


async def main():
    """Run all ADK tests"""
    print("\n" + "=" * 60)
    print("AXON DIGITALOCEAN ADK AGENT INTEGRATION TEST SUITE")
    print("=" * 60)
    
    tests = [
        ("Configuration Check", test_adk_config),
        ("Client Health Checks", test_adk_client_health),
        ("Agent Router", test_adk_router),
        ("Health Check All", test_adk_health_check_all),
        ("Error Recovery", test_adk_error_recovery),
    ]
    
    results = {}
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results[test_name] = result
        except Exception as e:
            print(f"✗ EXCEPTION in {test_name}: {str(e)}")
            results[test_name] = False
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    return all(results.values())


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
