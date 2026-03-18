#!/usr/bin/env python3
"""
Test LLM Service with DO Inference (glm-5).
"""

import asyncio
import sys
from pathlib import Path

backend_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_root))

# Load environment
from dotenv import load_dotenv
load_dotenv(backend_root / ".env")

from src.ai import LLMService
from src.config.config import get_settings


async def test_llm_service():
    print("=" * 60)
    print("LLM Service Test (DO Inference - glm-5)")
    print("=" * 60)
    
    settings = get_settings()
    print(f"\n✓ Configuration loaded")
    print(f"  Mode: {settings.axon_mode}")
    print(f"  Model: glm-5")
    print(f"  API Key: {settings.gradient_model_access_key[:20]}...")
    
    service = LLMService()
    
    # Test 1: Simple chat
    print("\n=== Test 1: Simple Chat ===")
    try:
        response = await service.chat([
            {"role": "user", "content": "What is AI? Answer in one sentence."}
        ])
        
        print(f"✓ Success")
        print(f"  Response: {response[:200]}")
        
    except Exception as e:
        print(f"✗ Failed: {e}")
        return 1
    
    # Test 2: Multi-turn conversation
    print("\n=== Test 2: Multi-turn Conversation ===")
    try:
        response = await service.chat([
            {"role": "user", "content": "What is 2+2?"},
            {"role": "assistant", "content": "4"},
            {"role": "user", "content": "What is 3+3?"}
        ])
        
        print(f"✓ Success")
        print(f"  Response: {response[:100]}")
        
    except Exception as e:
        print(f"✗ Failed: {e}")
        return 1
    
    # Test 3: Complex prompt
    print("\n=== Test 3: Complex Prompt ===")
    try:
        response = await service.chat([
            {"role": "user", "content": "Explain quantum computing in simple terms. Keep it under 50 words."}
        ])
        
        print(f"✓ Success")
        print(f"  Response: {response[:200]}")
        
    except Exception as e:
        print(f"✗ Failed: {e}")
        return 1
    
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print("✓ All tests passed!")
    print("  Model: glm-5")
    print("  Endpoint: https://inference.do-ai.run/v1")
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(test_llm_service())
    sys.exit(exit_code)
