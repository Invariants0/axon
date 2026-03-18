#!/usr/bin/env python3
"""Debug script to see actual API response."""

import asyncio
import json
from pathlib import Path
import sys

backend_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_root))

from dotenv import load_dotenv
load_dotenv(backend_root / ".env")

from src.ai.do_inference_client import DOInferenceClient


async def debug():
    client = DOInferenceClient()
    
    messages = [
        {"role": "user", "content": "What is 2+2?"}
    ]
    
    response = await client.chat(messages, max_tokens=50)
    
    print("Full Response:")
    print(json.dumps(response, indent=2))
    
    print("\nResponse Type:", type(response))
    print("Response Keys:", response.keys() if isinstance(response, dict) else "Not a dict")


if __name__ == "__main__":
    asyncio.run(debug())
