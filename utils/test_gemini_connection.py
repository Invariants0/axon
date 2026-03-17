#!/usr/bin/env python3
"""
Quick test to verify Gemini API connection.
"""

import asyncio
import sys
from pathlib import Path

backend_root = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(backend_root))

async def test_gemini():
    print("=" * 80)
    print("GEMINI API CONNECTION TEST")
    print("=" * 80)
    
    try:
        from src.config.config import get_settings
        from src.ai.gemini_client import GeminiClient
        
        settings = get_settings()
        
        print(f"\n[CONFIG]")
        print(f"  AXON_MODE: {settings.axon_mode}")
        print(f"  GEMINI_MODEL: {settings.gemini_model}")
        print(f"  GEMINI_API_KEY: {'SET' if settings.gemini_api_key else 'NOT SET'}")
        print(f"  TEST_MODE: {settings.test_mode}")
        
        if not settings.gemini_api_key:
            print("\n❌ ERROR: GEMINI_API_KEY not set")
            return False
        
        print(f"\n[TEST] Creating Gemini client...")
        client = GeminiClient()
        print(f"✓ Client created")
        print(f"  Model: {client.model}")
        print(f"  Base URL: {client.base_url}")
        
        print(f"\n[TEST] Sending test message to Gemini...")
        messages = [
            {"role": "user", "content": "Say 'Hello from AXON!' and nothing else."}
        ]
        
        response = await client.chat(messages)
        
        print(f"✓ Response received")
        print(f"\n[RESPONSE]")
        print(f"  Choices: {len(response.get('choices', []))}")
        
        if response.get('choices'):
            content = response['choices'][0]['message']['content']
            print(f"  Content: {content}")
        
        usage = response.get('usage', {})
        print(f"\n[USAGE]")
        print(f"  Prompt tokens: {usage.get('prompt_tokens', 0)}")
        print(f"  Completion tokens: {usage.get('completion_tokens', 0)}")
        print(f"  Total tokens: {usage.get('total_tokens', 0)}")
        
        print("\n" + "=" * 80)
        print("✅ GEMINI CONNECTION TEST PASSED")
        print("=" * 80)
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_gemini())
    sys.exit(0 if success else 1)
