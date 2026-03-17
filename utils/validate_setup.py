#!/usr/bin/env python3
"""Quick validation script to check AXON setup."""

import sys
from pathlib import Path

backend_root = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(backend_root))

print("Validating AXON setup...")
print("-" * 60)

# Check config
try:
    from src.config.config import Settings
    s = Settings()
    print("✓ Config module loads")
    print(f"  - gemini_api_key: {'set' if s.gemini_api_key else 'not set'}")
    print(f"  - axon_mode: {s.axon_mode}")
    print(f"  - axon_debug_pipeline: {s.axon_debug_pipeline}")
    print(f"  - skill_execution_timeout: {s.skill_execution_timeout}s")
except Exception as e:
    print(f"✗ Config error: {e}")
    sys.exit(1)

# Check Gemini client
try:
    from src.ai.gemini_client import GeminiClient
    print("✓ GeminiClient imports")
except Exception as e:
    print(f"✗ GeminiClient error: {e}")
    sys.exit(1)

# Check LLM service
try:
    from src.ai.llm_service import LLMService
    print("✓ LLMService imports")
except Exception as e:
    print(f"✗ LLMService error: {e}")
    sys.exit(1)

# Check exceptions
try:
    from src.core.exceptions import (
        AgentExecutionError,
        SkillExecutionError,
        PipelineStageError,
    )
    print("✓ Exception classes import")
except Exception as e:
    print(f"✗ Exceptions error: {e}")
    sys.exit(1)

# Check skill executor
try:
    from src.skills.executor import SkillExecutor
    print("✓ SkillExecutor imports")
except Exception as e:
    print(f"✗ SkillExecutor error: {e}")
    sys.exit(1)

print("-" * 60)
print("✅ All components validated successfully!")
print("\nNext steps:")
print("1. Set AXON_MODE=gemini")
print("2. Set GEMINI_API_KEY=your_key")
print("3. Run: python utils/test_pipeline.py")
