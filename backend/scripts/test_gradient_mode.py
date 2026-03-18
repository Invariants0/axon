#!/usr/bin/env python3
"""
Test Gradient LLM integration in AXON backend.

This script validates that Gradient LLM is properly configured and callable
in AXON_MODE=gradient.

Run: python -m pytest scripts/test_gradient_mode.py -v
Or:  python scripts/test_gradient_mode.py
"""

import asyncio
import json
import sys
from time import perf_counter

sys.path.insert(0, "/app/backend")

from src.ai.gradient_client import GradientClient
from src.ai.llm_service import LLMService
from src.config.config import get_settings
from src.utils.logger import get_logger

logger = get_logger(__name__)


async def test_gradient_config() -> bool:
    """Test that Gradient is properly configured"""
    print("\n[TEST] Gradient Configuration Check")
    print("=" * 50)
    
    settings = get_settings()
    
    checks = {
        "GRADIENT_MODEL_ACCESS_KEY set": bool(settings.GRADIENT_MODEL_ACCESS_KEY),
        "GRADIENT_MODEL set": bool(settings.gradient_model),
        "GRADIENT_BASE_URL set": bool(settings.gradient_base_url),
    }
    
    for check, result in checks.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {check}")
    
    all_passed = all(checks.values())
    print(f"\nConfiguration: {'VALID' if all_passed else 'INVALID'}")
    
    return all_passed


async def test_gradient_client() -> bool:
    """Test GradientClient directly"""
    print("\n[TEST] Gradient Client Health Check")
    print("=" * 50)
    
    settings = get_settings()
    
    if not settings.GRADIENT_MODEL_ACCESS_KEY:
        print("✗ SKIP: GRADIENT_MODEL_ACCESS_KEY not configured")
        return False
    
    try:
        client = GradientClient()
        health = await client.health()
        
        print(f"Provider: {health.get('provider')}")
        print(f"Configured: {health.get('configured')}")
        
        is_ok = health.get('configured') == 'yes'
        print(f"\nHealth Status: {'✓ OK' if is_ok else '✗ ERROR'}")
        
        return is_ok
    except Exception as e:
        print(f"✗ ERROR: {str(e)[:200]}")
        return False


async def test_gradient_llm_service() -> bool:
    """Test LLMService with Gradient mode"""
    print("\n[TEST] LLMService Gradient Routing")
    print("=" * 50)
    
    settings = get_settings()
    
    if settings.axon_mode != "gradient":
        print(f"✗ SKIP: AXON_MODE={settings.axon_mode}, expected 'gradient'")
        print(f"  Set AXON_MODE=gradient to test")
        return False
    
    if not settings.GRADIENT_MODEL_ACCESS_KEY:
        print("✗ SKIP: GRADIENT_MODEL_ACCESS_KEY not configured")
        return False
    
    try:
        llm = LLMService()
        
        messages = [
            {"role": "user", "content": "This is a test message."}
        ]
        
        print(f"AXON_MODE: {settings.axon_mode}")
        print(f"Model: {settings.gradient_model}")
        print(f"Endpoint: {settings.gradient_base_url}")
        print(f"\nSending request...")
        
        started_at = perf_counter()
        response = await llm.chat(messages)
        latency = round(perf_counter() - started_at, 6)
        
        response_preview = str(response)[:100]
        print(f"\nResponse (preview): {response_preview}...")
        print(f"Latency: {latency}s")
        print(f"\n✓ SUCCESS: Got response from Gradient")
        
        return True
    except ValueError as e:
        print(f"✗ CONFIG ERROR: {str(e)}")
        return False
    except Exception as e:
        print(f"✗ ERROR: {str(e)[:200]}")
        logger.exception("gradient_test_error", error=str(e))
        return False


async def test_gradient_chat_performance() -> bool:
    """Test Gradient chat performance with logging"""
    print("\n[TEST] Gradient Chat Performance")
    print("=" * 50)
    
    settings = get_settings()
    
    if settings.axon_mode != "gradient" or not settings.GRADIENT_MODEL_ACCESS_KEY:
        print("✗ SKIP: Gradient not configured")
        return False
    
    try:
        llm = LLMService()
        
        test_prompts = [
            "Refine this task plan into concise actionable steps: Task: Test Gradient",
            "Summarize practical research notes: Basic test data",
            "Evaluate this strategy and provide final reasoning: Simple test",
        ]
        
        results = []
        for prompt in test_prompts:
            started_at = perf_counter()
            response = await llm.complete(prompt)
            latency = round(perf_counter() - started_at, 6)
            
            results.append({
                "prompt_size": len(prompt),
                "response_size": len(response),
                "latency": latency,
            })
            
            print(f"✓ Prompt: {prompt[:50]}...")
            print(f"  Latency: {latency}s | Response size: {len(response)} chars")
        
        avg_latency = sum(r["latency"] for r in results) / len(results)
        print(f"\nAverage Latency: {avg_latency:.6f}s")
        print(f"✓ SUCCESS: All {len(results)} chats completed")
        
        return True
    except Exception as e:
        print(f"✗ ERROR: {str(e)[:200]}")
        logger.exception("gradient_performance_error", error=str(e))
        return False


async def test_gradient_error_handling() -> bool:
    """Test error handling with invalid config"""
    print("\n[TEST] Gradient Error Handling")
    print("=" * 50)
    
    import os
    original_key = os.environ.get("GRADIENT_MODEL_ACCESS_KEY")
    
    try:
        # Temporarily set invalid key
        os.environ["GRADIENT_MODEL_ACCESS_KEY"] = "invalid_test_key"
        
        # Force reload settings
        from importlib import reload
        import src.config.config as config_module
        reload(config_module)
        
        llm = LLMService()
        
        try:
            await llm.complete("test prompt")
            print("✗ FAIL: Should have raised error with invalid API key")
            return False
        except Exception as e:
            print(f"✓ Correctly caught error: {type(e).__name__}")
            print(f"  Message: {str(e)[:100]}")
            return True
    finally:
        # Restore original key
        if original_key:
            os.environ["GRADIENT_MODEL_ACCESS_KEY"] = original_key
        elif "GRADIENT_MODEL_ACCESS_KEY" in os.environ:
            del os.environ["GRADIENT_MODEL_ACCESS_KEY"]
        
        # Reload settings again
        from importlib import reload
        import src.config.config as config_module
        reload(config_module)


async def main():
    """Run all Gradient tests"""
    print("\n" + "=" * 60)
    print("AXON GRADIENT LLM INTEGRATION TEST SUITE")
    print("=" * 60)
    
    tests = [
        ("Configuration Check", test_gradient_config),
        ("Client Health Check", test_gradient_client),
        ("LLMService Routing", test_gradient_llm_service),
        ("Chat Performance", test_gradient_chat_performance),
        ("Error Handling", test_gradient_error_handling),
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
