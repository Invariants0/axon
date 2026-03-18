#!/usr/bin/env python3
"""
Quick test script for DO Inference endpoint.
Minimal example for rapid testing.
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


async def quick_test():
    """Quick test of DO Inference endpoint."""
    from src.ai.do_inference_client import DOInferenceClient
    
    print("Testing DO Inference endpoint...")
    print("-" * 50)
    
    client = DOInferenceClient()
    
    # Simple chat test
    messages = [
        {"role": "user", "content": "What is 2+2? Answer in one word."}
    ]
    
    try:
        response = await client.chat(messages, max_tokens=100)
        
        # Handle glm-5 reasoning model response
        message = response["choices"][0]["message"]
        content = message.get("content") or message.get("reasoning_content", "")
        usage = response["usage"]
        
        print(f"✓ Success!")
        print(f"  Response: {content[:100]}")
        print(f"  Tokens: {usage['total_tokens']}")
        
    except Exception as e:
        print(f"✗ Failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(quick_test())
    sys.exit(exit_code)
