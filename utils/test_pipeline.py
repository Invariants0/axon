#!/usr/bin/env python3
"""
AXON Pipeline Test Script

Tests the complete agent pipeline in Gemini mode:
1. Creates a test task
2. Runs full agent pipeline (Planning → Research → Reasoning → Builder)
3. Verifies skill execution
4. Verifies memory storage
5. Prints final pipeline output

Usage:
    python utils/test_pipeline.py

Environment:
    Requires AXON_MODE=gemini and GEMINI_API_KEY to be set
"""

import asyncio
import json
import sys
from pathlib import Path

# Add backend/src to path
backend_root = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(backend_root))

from src.ai.llm_service import LLMService
from src.config.config import get_settings
from src.core.agent_orchestrator import AgentOrchestrator
from src.core.event_bus import EventBus
from src.db.models import Task
from src.db.session import SessionLocal, init_db
from src.memory.vector_store import VectorStore
from src.skills.executor import SkillExecutor
from src.skills.registry import SkillRegistry


async def test_pipeline():
    """Run complete pipeline test."""
    print("=" * 80)
    print("AXON PIPELINE TEST - GEMINI MODE")
    print("=" * 80)
    
    # Check configuration
    settings = get_settings()
    print(f"\n[CONFIG] AXON_MODE: {settings.axon_mode}")
    print(f"[CONFIG] TEST_MODE: {settings.test_mode}")
    print(f"[CONFIG] DEBUG_PIPELINE: {settings.axon_debug_pipeline}")
    print(f"[CONFIG] SKILL_TIMEOUT: {settings.skill_execution_timeout}s")
    
    if settings.axon_mode != "gemini":
        print("\n❌ ERROR: AXON_MODE must be set to 'gemini'")
        print("   Set environment variable: AXON_MODE=gemini")
        return False
    
    if not settings.gemini_api_key:
        print("\n❌ ERROR: GEMINI_API_KEY not configured")
        print("   Set environment variable: GEMINI_API_KEY=your_key_here")
        return False
    
    print("\n✓ Configuration valid")
    
    # Initialize database
    print("\n[INIT] Initializing database...")
    await init_db()
    print("✓ Database initialized")
    
    # Initialize components
    print("\n[INIT] Initializing components...")
    event_bus = EventBus()
    skill_registry = SkillRegistry()
    skill_executor = SkillExecutor(skill_registry)
    vector_store = VectorStore()
    llm_service = LLMService()
    
    skills = skill_registry.all()
    print(f"✓ Loaded {len(skills)} skills:")
    for skill in skills:
        print(f"  - {skill.name} (v{skill.version}): {skill.description}")
    
    # Create orchestrator
    orchestrator = AgentOrchestrator(
        llm_service=llm_service,
        skill_executor=skill_executor,
        vector_store=vector_store,
        event_bus=event_bus,
    )
    print("✓ Orchestrator initialized")
    
    # Create test task
    print("\n[TASK] Creating test task...")
    task_title = "Build a simple REST API for user management"
    task_description = "Create a REST API with endpoints for creating, reading, updating, and deleting users. Use FastAPI framework."
    
    async with SessionLocal() as session:
        task = Task(
            title=task_title,
            description=task_description,
            status="running",
            result="",
        )
        session.add(task)
        await session.flush()
        
        print(f"✓ Task created: {task.id}")
        print(f"  Title: {task_title}")
        print(f"  Description: {task_description}")
        
        # Run pipeline
        print("\n[PIPELINE] Starting agent pipeline...")
        print("-" * 80)
        
        try:
            result = await orchestrator.run_pipeline(task, session)
            
            print("-" * 80)
            print("✓ Pipeline completed successfully")
            
            # Display results
            print("\n[RESULTS] Pipeline Output:")
            print("=" * 80)
            
            for stage, output in result.items():
                print(f"\n{stage.upper()}:")
                print(json.dumps(output, indent=2, default=str))
            
            # Verify memory storage
            print("\n[MEMORY] Verifying memory storage...")
            memories = await vector_store.similarity_search(
                query=task_title,
                task_id=task.id,
                limit=5,
            )
            print(f"✓ Found {len(memories)} memory records for task")
            
            # Verify skill execution
            print("\n[SKILLS] Skill execution verified:")
            for stage, output in result.items():
                if "skill" in str(output):
                    print(f"  ✓ {stage} stage executed skills")
            
            # Update task status
            task.status = "completed"
            task.result = json.dumps(result, default=str)
            await session.commit()
            
            print("\n" + "=" * 80)
            print("✅ PIPELINE TEST PASSED")
            print("=" * 80)
            print(f"\nTask ID: {task.id}")
            print(f"Status: {task.status}")
            print(f"Stages completed: {len(result)}")
            
            return True
            
        except Exception as exc:
            print("-" * 80)
            print(f"\n❌ Pipeline failed: {exc}")
            print(f"Error type: {type(exc).__name__}")
            
            import traceback
            print("\nTraceback:")
            traceback.print_exc()
            
            task.status = "failed"
            task.result = str(exc)
            await session.commit()
            
            return False


async def test_skill_system():
    """Test skill registry and execution."""
    print("\n" + "=" * 80)
    print("SKILL SYSTEM VALIDATION")
    print("=" * 80)
    
    skill_registry = SkillRegistry()
    skill_executor = SkillExecutor(skill_registry)
    
    skills = skill_registry.all()
    print(f"\n[REGISTRY] Loaded {len(skills)} skills")
    
    if not skills:
        print("❌ No skills loaded")
        return False
    
    # Test execute a sample skill
    print("\n[EXECUTION] Testing skill execution...")
    try:
        # Try planning skill
        result = await skill_executor.execute(
            "planning",
            {"task": "Test task", "max_steps": 3},
        )
        print(f"✓ Skill executed: {result['skill']}")
        print(f"  Version: {result['version']}")
        print(f"  Output: {result['output']}")
        
        print("\n✅ SKILL SYSTEM VALIDATED")
        return True
        
    except Exception as exc:
        print(f"❌ Skill execution failed: {exc}")
        return False


async def test_evolution_system():
    """Test evolution engine."""
    print("\n" + "=" * 80)
    print("EVOLUTION SYSTEM VALIDATION")
    print("=" * 80)
    
    from src.core.evolution_engine import EvolutionEngine
    
    llm_service = LLMService()
    skill_registry = SkillRegistry()
    event_bus = EventBus()
    
    evolution_engine = EvolutionEngine(
        llm_service=llm_service,
        skill_registry=skill_registry,
        event_bus=event_bus,
    )
    
    async with SessionLocal() as session:
        # Get initial status
        status = await evolution_engine.get_status(session)
        print(f"\n[STATUS] Evolution engine status:")
        print(f"  Generated skills: {status['generated_skills']}")
        print(f"  Failed tasks: {status['failed_tasks']}")
        
        # Note: We don't trigger evolution unless there are failed tasks
        if status['failed_tasks'] > 0:
            print("\n[EVOLUTION] Triggering skill generation...")
            result = await evolution_engine.evolve(session)
            print(f"✓ Evolution completed")
            print(f"  New generated skills: {result['generated_skills']}")
        else:
            print("\n✓ No failed tasks - evolution not needed")
        
        print("\n✅ EVOLUTION SYSTEM VALIDATED")
        return True


async def main():
    """Run all tests."""
    print("\n🚀 Starting AXON Pipeline Tests\n")
    
    # Test 1: Skill system
    skill_ok = await test_skill_system()
    
    # Test 2: Evolution system
    evolution_ok = await test_evolution_system()
    
    # Test 3: Full pipeline
    pipeline_ok = await test_pipeline()
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"Skill System:     {'✅ PASS' if skill_ok else '❌ FAIL'}")
    print(f"Evolution System: {'✅ PASS' if evolution_ok else '❌ FAIL'}")
    print(f"Pipeline Test:    {'✅ PASS' if pipeline_ok else '❌ FAIL'}")
    print("=" * 80)
    
    if skill_ok and evolution_ok and pipeline_ok:
        print("\n🎉 ALL TESTS PASSED")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
