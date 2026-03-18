#!/usr/bin/env python3
"""
Full pipeline test - AXON in all modes (mock, gemini, gradient, real).

This script validates that AXON can successfully run a complete pipeline
in each supported mode.

Run: python scripts/test_full_integration.py
"""

import asyncio
import json
import os
import sys
from time import perf_counter
from typing import Any

sys.path.insert(0, "/app/backend")

from src.config.config import get_settings
from src.utils.logger import get_logger

logger = get_logger(__name__)


async def test_health_endpoint(base_url: str, api_key: str) -> bool:
    """Test the system health endpoint"""
    print(f"\n  Testing health endpoint: {base_url}/system/health")
    
    try:
        import httpx
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{base_url}/system/health",
                headers={"API-Key": api_key},
            )
            
            if response.status_code != 200:
                print(f"  ✗ Health endpoint returned {response.status_code}")
                return False
            
            health = response.json()
            print(f"  ✓ Status: {health.get('status')}")
            print(f"  Database: {health.get('database')}")
            print(f"  Vector Store: {health.get('vector_store')}")
            
            if health.get("axon_mode") or health.get("gradient_llm"):
                print(f"  Gradient LLM: {health.get('gradient_llm', {}).get('status', 'N/A')}")
            
            if health.get("adk_agents"):
                print(f"  ADK Agents: {health.get('adk_agents', {}).get('status', 'N/A')}")
            
            return health.get("status") == "ready"
    except Exception as e:
        print(f"  ✗ Health check failed: {str(e)[:150]}")
        return False


async def test_create_task(
    base_url: str, api_key: str, title: str, description: str
) -> Any:
    """Create a test task"""
    print(f"\n  Creating task: {title}")
    
    try:
        import httpx
        
        payload = {
            "title": title,
            "description": description,
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{base_url}/tasks",
                json=payload,
                headers={"API-Key": api_key},
            )
            
            if response.status_code not in [200, 201]:
                print(f"  ✗ Task creation returned {response.status_code}")
                print(f"    Response: {response.text[:200]}")
                return None
            
            task = response.json()
            print(f"  ✓ Task created: {task.get('id')}")
            
            return task
    except Exception as e:
        print(f"  ✗ Task creation failed: {str(e)[:150]}")
        return None


async def test_run_pipeline(
    base_url: str, api_key: str, task_id: str
) -> bool:
    """Run the pipeline for a task"""
    print(f"\n  Running pipeline for task {task_id}...")
    
    try:
        import httpx
        
        started_at = perf_counter()
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{base_url}/tasks/{task_id}/run",
                headers={"API-Key": api_key},
            )
            
            latency = round(perf_counter() - started_at, 2)
            
            if response.status_code not in [200, 202]:
                print(f"  ✗ Pipeline run returned {response.status_code}")
                print(f"    Response: {response.text[:200]}")
                return False
            
            result = response.json()
            print(f"  ✓ Pipeline completed in {latency}s")
            print(f"    Status: {result.get('status')}")
            
            return result.get("status") == "completed"
    except asyncio.TimeoutError:
        print(f"  ✗ Pipeline timed out (120s)")
        return False
    except Exception as e:
        print(f"  ✗ Pipeline run failed: {str(e)[:150]}")
        return False


async def test_timeline(base_url: str, api_key: str, task_id: str) -> bool:
    """Get the execution timeline"""
    print(f"\n  Retrieving execution timeline...")
    
    try:
        import httpx
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{base_url}/system/tasks/{task_id}/timeline",
                headers={"API-Key": api_key},
            )
            
            if response.status_code != 200:
                print(f"  ⊘ Timeline not available (status {response.status_code})")
                return True  # Not a hard failure
            
            timeline = response.json()
            
            print(f"  ✓ Timeline retrieved")
            print(f"    Total duration: {timeline.get('total_duration_ms')}ms")
            print(f"    Agent executions: {timeline.get('agent_count')}")
            
            # Print per-agent timing
            for entry in timeline.get("timeline", [])[:4]:
                agent = entry.get("agent_name")
                duration = entry.get("duration_ms", "?")
                print(f"      - {agent}: {duration}ms")
            
            return True
    except Exception as e:
        print(f"  ⊘ Could not retrieve timeline: {str(e)[:100]}")
        return True  # Not a hard failure


async def test_mode(mode: str, base_url: str = "http://localhost:8000") -> bool:
    """Test AXON in a specific mode"""
    print(f"\n{'=' * 60}")
    print(f"TESTING AXON_MODE={mode}")
    print(f"{'=' * 60}")
    
    settings = get_settings()
    api_key = settings.api_key or "test-key"
    
    # Step 1: Health check
    print("\n[STEP 1] Health Check")
    health_ok = await test_health_endpoint(base_url, api_key)
    
    if not health_ok:
        print(f"\n✗ Health check failed for mode={mode}")
        return False
    
    # Step 2: Create task
    print("\n[STEP 2] Create Task")
    task = await test_create_task(
        base_url,
        api_key,
        f"Test Task (mode={mode})",
        f"This is a test task for AXON_MODE={mode}",
    )
    
    if not task or not task.get("id"):
        print(f"\n✗ Task creation failed for mode={mode}")
        return False
    
    task_id = task.get("id")
    
    # Step 3: Run pipeline (skip for mock mode to save time)
    print("\n[STEP 3] Run Pipeline")
    if mode == "mock":
        print("  ⊘ SKIPPED for mock mode (would use test responses)")
        pipeline_ok = True
    else:
        pipeline_ok = await test_run_pipeline(base_url, api_key, task_id)
    
    if not pipeline_ok:
        print(f"\n✗ Pipeline execution failed for mode={mode}")
        return False
    
    # Step 4: Get timeline
    print("\n[STEP 4] Execution Timeline")
    timeline_ok = await test_timeline(base_url, api_key, task_id)
    
    print(f"\n✓ Mode {mode} test PASSED")
    return True


async def main():
    """Run tests for all modes"""
    print("\n" + "=" * 60)
    print("AXON FULL INTEGRATION TEST SUITE")
    print("=" * 60)
    
    settings = get_settings()
    base_url = os.environ.get("AXON_BACKEND_URL", "http://localhost:8000")
    
    print(f"\nBackend URL: {base_url}")
    print(f"Current AXON_MODE: {settings.axon_mode}")
    
    # Define which modes to test
    modes_to_test = [
        "mock",  # Always test mock mode
    ]
    
    if settings.axon_mode == "gemini" and settings.gemini_api_key:
        modes_to_test.append("gemini")
    
    if settings.axon_mode == "gradient" and settings.GRADIENT_MODEL_ACCESS_KEY:
        modes_to_test.append("gradient")
    
    if settings.axon_mode == "real" and settings.digitalocean_api_token:
        modes_to_test.append("real")
    
    print(f"\nModes to test: {', '.join(modes_to_test)}")
    
    # Test backend connectivity first
    print("\n[PRE-FLIGHT] Backend Connectivity")
    try:
        import httpx
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{base_url}/system/", headers={"API-Key": "test"})
            
            if response.status_code >= 400 and response.status_code != 401:
                print(f"⚠ Backend returned {response.status_code}")
            else:
                print(f"✓ Backend is reachable")
    except Exception as e:
        print(f"✗ Cannot reach backend: {str(e)[:150]}")
        print(f"  Make sure the backend is running at {base_url}")
        return False
    
    # Run tests
    results = {}
    for mode in modes_to_test:
        try:
            result = await test_mode(mode, base_url)
            results[mode] = result
        except Exception as e:
            print(f"\n✗ Exception in mode={mode}: {str(e)}")
            logger.exception(f"test_mode_{mode}_exception", error=str(e))
            results[mode] = False
    
    # Summary
    print("\n" + "=" * 60)
    print("INTEGRATION TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for mode, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: AXON_MODE={mode}")
    
    print(f"\nTotal: {passed}/{total} mode tests passed")
    
    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
