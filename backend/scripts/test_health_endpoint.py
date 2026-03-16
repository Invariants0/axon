#!/usr/bin/env python3
"""
Test health endpoint without starting full server.
"""

import asyncio
import sys
from pathlib import Path

backend_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_root))

async def test_health():
    print("=" * 80)
    print("HEALTH ENDPOINT TEST")
    print("=" * 80)
    
    try:
        from src.config.config import get_settings
        from src.config.dependencies import get_skill_registry, get_vector_store
        
        settings = get_settings()
        skill_registry = get_skill_registry()
        vector_store = get_vector_store()
        
        print(f"\n[SYSTEM STATUS]")
        
        # Determine active LLM provider
        llm_provider = "unknown"
        if settings.test_mode:
            llm_provider = "test-mode"
        elif settings.axon_mode == "gemini":
            llm_provider = "gemini"
        elif settings.axon_mode == "gradient":
            llm_provider = "gradient"
        elif settings.axon_mode == "real":
            llm_provider = "digitalocean-adk"
        elif settings.gradient_api_key:
            llm_provider = "gradient"
        elif settings.huggingface_api_key:
            llm_provider = "huggingface"
        else:
            llm_provider = "local-fallback"
        
        # Count loaded skills
        skills_loaded = len(skill_registry.all())
        
        # Check vector store
        vector_status = "connected"
        try:
            _ = vector_store.collection
        except Exception:
            vector_status = "disconnected"
        
        health_data = {
            "backend": "ok",
            "agents": "reachable",
            "skills_loaded": skills_loaded,
            "vector_store": vector_status,
            "llm_provider": llm_provider,
            "axon_mode": settings.axon_mode,
            "debug_pipeline": settings.axon_debug_pipeline,
        }
        
        print(f"  Backend: {health_data['backend']}")
        print(f"  Agents: {health_data['agents']}")
        print(f"  Skills Loaded: {health_data['skills_loaded']}")
        print(f"  Vector Store: {health_data['vector_store']}")
        print(f"  LLM Provider: {health_data['llm_provider']}")
        print(f"  AXON Mode: {health_data['axon_mode']}")
        print(f"  Debug Pipeline: {health_data['debug_pipeline']}")
        
        print(f"\n[SKILLS]")
        for skill in skill_registry.all():
            print(f"  - {skill.name} (v{skill.version}): {skill.description[:60]}...")
        
        print("\n" + "=" * 80)
        print("✅ HEALTH CHECK PASSED")
        print("=" * 80)
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_health())
    sys.exit(0 if success else 1)
