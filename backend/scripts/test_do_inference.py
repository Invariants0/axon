#!/usr/bin/env python3
"""
Test script for DigitalOcean AI Inference endpoint integration.

This script tests:
1. Model listing
2. Chat completions
3. Error handling
4. Health checks
"""

import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
backend_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_root))

# Load environment
from dotenv import load_dotenv
load_dotenv(backend_root / ".env")

from src.ai.do_inference_client import DOInferenceClient
from src.ai.gradient_client import GradientClient
from src.config.config import get_settings


async def test_list_models():
    """Test listing available models."""
    print("\n=== Testing Model Listing ===")
    client = DOInferenceClient()
    
    try:
        models = await client.list_models()
        print(f"✓ Successfully retrieved models")
        print(f"  Available models: {len(models.get('data', []))}")
        
        # Print first few models
        for model in models.get("data", [])[:5]:
            model_id = model.get("id", "unknown")
            print(f"  - {model_id}")
        
        return True
    except Exception as e:
        print(f"✗ Failed to list models: {e}")
        return False


async def test_chat_completion():
    """Test chat completion."""
    print("\n=== Testing Chat Completion ===")
    client = DOInferenceClient()
    
    messages = [
        {"role": "user", "content": "What is the capital of France?"}
    ]
    
    try:
        response = await client.chat(messages, max_tokens=200)
        print(f"✓ Successfully completed chat request")
        
        # Extract response - handle glm-5 reasoning model
        choices = response.get("choices", [])
        if choices:
            message = choices[0].get("message", {})
            content = message.get("content") or message.get("reasoning_content", "")
            print(f"  Response: {content[:200]}")
        
        # Print usage
        usage = response.get("usage", {})
        print(f"  Tokens: {usage.get('total_tokens', 0)} total")
        
        return True
    except Exception as e:
        print(f"✗ Failed chat completion: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_gradient_client():
    """Test updated Gradient client with DO Inference endpoint."""
    print("\n=== Testing Gradient Client (DO Inference) ===")
    client = GradientClient()
    
    messages = [
        {"role": "user", "content": "Explain quantum computing in one sentence."}
    ]
    
    try:
        response = await client.chat(messages, max_tokens=200)
        print(f"✓ Successfully completed chat via Gradient client")
        
        # Extract response - handle glm-5 reasoning model
        choices = response.get("choices", [])
        if choices:
            message = choices[0].get("message", {})
            content = message.get("content") or message.get("reasoning_content", "")
            print(f"  Response: {content[:200]}")
        
        return True
    except Exception as e:
        print(f"✗ Failed Gradient client chat: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_health_check():
    """Test health check."""
    print("\n=== Testing Health Check ===")
    client = DOInferenceClient()
    
    try:
        health = await client.health()
        print(f"✓ Health check completed")
        print(f"  Provider: {health.get('provider')}")
        print(f"  Configured: {health.get('configured')}")
        print(f"  Model: {health.get('model')}")
        print(f"  Status: {health.get('status')}")
        
        if health.get("available_models"):
            print(f"  Available models: {health.get('available_models')}")
        
        return health.get("status") == "healthy"
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False


async def main():
    """Run all tests."""
    print("=" * 60)
    print("DigitalOcean AI Inference Integration Test")
    print("=" * 60)
    
    # Check configuration
    settings = get_settings()
    api_key = settings.gradient_model_access_key
    
    if not api_key:
        print("\n✗ GRADIENT_MODEL_ACCESS_KEY not configured")
        print("  Please set it in backend/.env")
        return 1
    
    print(f"\n✓ Configuration loaded")
    print(f"  Model: {settings.gradient_model}")
    print(f"  API Key: {api_key[:20]}...")
    
    # Run tests
    results = []
    
    results.append(await test_health_check())
    results.append(await test_list_models())
    results.append(await test_chat_completion())
    results.append(await test_gradient_client())
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("✓ All tests passed!")
        return 0
    else:
        print(f"✗ {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
