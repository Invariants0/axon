#!/usr/bin/env python3
"""
Test LLM routing logic with different modes.
"""

import asyncio
import sys
from pathlib import Path

backend_root = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(backend_root))

async def test_llm_service():
    print("=" * 80)
    print("LLM SERVICE ROUTING TEST")
    print("=" * 80)
    
    try:
        from src.config.config import get_settings
        from src.ai.llm_service import LLMService
        
        settings = get_settings()
        
        print(f"\n[CONFIG]")
        print(f"  AXON_MODE: {settings.axon_mode}")
        print(f"  TEST_MODE: {settings.test_mode}")
        print(f"  GEMINI_MODEL: {settings.gemini_model}")
        print(f"  GEMINI_API_KEY: {'SET' if settings.gemini_api_key else 'NOT SET'}")
        
        print(f"\n[TEST] Creating LLM service...")
        llm = LLMService()
        print(f"✓ LLM service created")
        
        print(f"\n[TEST] Sending chat message through LLM service...")
        messages = [
            {"role": "user", "content": "What is 2+2? Answer with just the number."}
        ]
        
        response = await llm.chat(messages)
        
        print(f"✓ Response received")
        print(f"\n[RESPONSE]")
        print(f"  {response}")
        
        print(f"\n[TEST] Testing complete() method...")
        prompt = "Name one programming language. Just the name."
        response2 = await llm.complete(prompt)
        
        print(f"✓ Response received")
        print(f"\n[RESPONSE]")
        print(f"  {response2}")
        
        print("\n" + "=" * 80)
        print("✅ LLM SERVICE ROUTING TEST PASSED")
        print("=" * 80)
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_llm_service())
    sys.exit(0 if success else 1)
