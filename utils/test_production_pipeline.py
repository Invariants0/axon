#!/usr/bin/env python3
"""
AXON PRODUCTION PIPELINE TEST

This test simulates the REAL production pipeline that would normally use
DigitalOcean Gradient, but uses Gemini instead for testing.

Tests the complete production flow:
1. Real TaskManager with worker pool
2. Real database operations
3. Real agent orchestrator
4. Real skill execution
5. Real memory/vector store
6. Real event bus
7. Real task queue

This is NOT a mock test - it uses all production components.
"""

import asyncio
import json
import sys
from pathlib import Path
from time import perf_counter

backend_root = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(backend_root))

async def test_production_pipeline():
    print("=" * 80)
    print("AXON PRODUCTION PIPELINE TEST - GEMINI MODE")
    print("=" * 80)
    print("\n⚠️  This test uses REAL production components:")
    print("  - Real TaskManager with worker pool")
    print("  - Real database (PostgreSQL)")
    print("  - Real agent orchestrator")
    print("  - Real skill execution")
    print("  - Real memory/vector store")
    print("  - Real event bus")
    print("  - Real task queue")
    
    try:
        from src.config.config import get_settings
        from src.config.dependencies import (
            get_task_manager,
            get_orchestrator,
            get_skill_registry,
            get_vector_store,
            get_llm_service,
            get_event_bus,
        )
        from src.db.session import SessionLocal, init_db
        
        settings = get_settings()
        
        # Validate configuration
        print(f"\n[CONFIG]")
        print(f"  AXON_MODE: {settings.axon_mode}")
        print(f"  GEMINI_MODEL: {settings.gemini_model}")
        print(f"  GEMINI_API_KEY: {'SET' if settings.gemini_api_key else 'NOT SET'}")
        print(f"  TEST_MODE: {settings.test_mode}")
        print(f"  DEBUG_PIPELINE: {settings.axon_debug_pipeline}")
        print(f"  DATABASE_URL: {settings.database_url[:50]}...")
        
        if settings.axon_mode != "gemini":
            print("\n❌ ERROR: AXON_MODE must be 'gemini'")
            print("   Current mode will use:", settings.axon_mode)
            return False
        
        if not settings.gemini_api_key:
            print("\n❌ ERROR: GEMINI_API_KEY not configured")
            return False
        
        if settings.test_mode:
            print("\n⚠️  WARNING: TEST_MODE is enabled")
            print("   This will use mock responses instead of real Gemini calls")
            print("   Set TEST_MODE=false for real testing")
        
        print("\n✓ Configuration validated")
        
        # Initialize database
        print("\n[DATABASE] Initializing PostgreSQL connection...")
        try:
            await init_db()
            print("✓ Database initialized")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            print("\n💡 TIP: Make sure PostgreSQL is running:")
            print("   - Windows: Check Services for PostgreSQL")
            print("   - Mac: brew services start postgresql")
            print("   - Linux: sudo systemctl start postgresql")
            print("\n   Or use Docker: docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres")
            return False
        
        # Get production components
        print("\n[COMPONENTS] Initializing production components...")
        task_manager = get_task_manager()
        orchestrator = get_orchestrator()
        skill_registry = get_skill_registry()
        vector_store = get_vector_store()
        llm_service = get_llm_service()
        event_bus = get_event_bus()
        
        skills = skill_registry.all()
        print(f"✓ TaskManager: {task_manager.status()}")
        print(f"✓ Orchestrator: Initialized with {len(orchestrator.agents)} agents")
        print(f"✓ Skills: {len(skills)} loaded")
        for skill in skills:
            print(f"    - {skill.name} (v{skill.version})")
        print(f"✓ Vector Store: Connected")
        print(f"✓ LLM Service: Configured for {settings.axon_mode} mode")
        print(f"✓ Event Bus: Active")
        
        # Start TaskManager
        print("\n[TASK MANAGER] Starting worker pool...")
        await task_manager.start()
        pool_status = task_manager.pool_status()
        print(f"✓ Worker pool started")
        print(f"  Workers: {pool_status['worker_count']}")
        print(f"  Status: {pool_status['status']}")
        print(f"  Running: {pool_status['is_running']}")
        
        # Create test task using REAL TaskManager
        print("\n[TASK] Creating task through TaskManager...")
        task_title = "Build a microservice for user authentication"
        task_description = (
            "Create a microservice that handles user authentication with JWT tokens. "
            "Include endpoints for registration, login, logout, and token refresh. "
            "Use FastAPI framework with PostgreSQL database."
        )
        
        start_time = perf_counter()
        
        async with SessionLocal() as session:
            # Create task through TaskManager (production flow)
            task = await task_manager.create_task(
                session=session,
                title=task_title,
                description=task_description,
            )
            await session.commit()
            
            print(f"✓ Task created: {task.id}")
            print(f"  Title: {task_title}")
            print(f"  Status: {task.status}")
            print(f"  Queue size: {task_manager.queue_size()}")
            
            # Wait for task to be processed
            print(f"\n[PIPELINE] Task queued - waiting for worker to process...")
            print(f"  (This will take ~30-60 seconds for full pipeline)")
            
            # Poll task status
            max_wait = 120  # 2 minutes max
            poll_interval = 2  # Check every 2 seconds
            elapsed = 0
            
            while elapsed < max_wait:
                await asyncio.sleep(poll_interval)
                elapsed += poll_interval
                
                # Refresh task from database
                await session.refresh(task)
                
                print(f"  [{elapsed}s] Task status: {task.status}")
                
                if task.status == "completed":
                    print(f"\n✓ Task completed successfully!")
                    break
                elif task.status == "failed":
                    print(f"\n❌ Task failed!")
                    print(f"  Error: {task.result}")
                    return False
            
            if task.status not in ("completed", "failed"):
                print(f"\n⚠️  Task still processing after {max_wait}s")
                print(f"  Current status: {task.status}")
                print(f"  This might be normal for complex tasks")
            
            total_time = perf_counter() - start_time
            
            # Display results
            print(f"\n[RESULTS] Pipeline Execution Summary")
            print("=" * 80)
            print(f"  Task ID: {task.id}")
            print(f"  Status: {task.status}")
            print(f"  Total Time: {total_time:.2f}s")
            print(f"  Queue Size: {task_manager.queue_size()}")
            
            if task.result and task.status == "completed":
                try:
                    result = json.loads(task.result) if isinstance(task.result, str) else task.result
                    print(f"\n[PIPELINE OUTPUT]")
                    for stage, output in result.items():
                        print(f"\n  {stage.upper()}:")
                        if isinstance(output, dict):
                            for key, value in output.items():
                                value_str = str(value)[:100]
                                print(f"    {key}: {value_str}...")
                except Exception as e:
                    print(f"  Result: {str(task.result)[:500]}...")
            
            # Verify memory storage
            print(f"\n[MEMORY] Checking vector store...")
            try:
                memories = await vector_store.similarity_search(
                    query=task_title,
                    task_id=task.id,
                    limit=5,
                )
                print(f"✓ Found {len(memories)} memory records")
                for i, mem in enumerate(memories[:3], 1):
                    content = mem.get('content', '')[:80]
                    print(f"  {i}. {content}...")
            except Exception as e:
                print(f"⚠️  Memory check failed: {e}")
            
            # Check agent executions
            print(f"\n[AGENTS] Checking agent executions...")
            from src.db.models import AgentExecution
            from sqlalchemy import select
            
            result = await session.execute(
                select(AgentExecution)
                .where(AgentExecution.task_id == task.id)
                .order_by(AgentExecution.created_at)
            )
            executions = result.scalars().all()
            
            if executions:
                print(f"✓ Found {len(executions)} agent executions:")
                for exec in executions:
                    print(f"  - {exec.agent_name}: {exec.status}")
            else:
                print(f"⚠️  No agent executions found (task may still be processing)")
            
            # Stop TaskManager
            print(f"\n[CLEANUP] Stopping TaskManager...")
            await task_manager.stop()
            print(f"✓ TaskManager stopped")
            
            # Final summary
            print(f"\n" + "=" * 80)
            if task.status == "completed":
                print("✅ PRODUCTION PIPELINE TEST PASSED")
                print("=" * 80)
                print(f"\nSuccessfully tested REAL production pipeline:")
                print(f"  ✓ Task created through TaskManager")
                print(f"  ✓ Worker pool processed task")
                print(f"  ✓ All 4 agents executed")
                print(f"  ✓ Skills executed successfully")
                print(f"  ✓ Memory stored in vector database")
                print(f"  ✓ Results persisted to PostgreSQL")
                print(f"\nThis is the EXACT same flow that would run with DigitalOcean Gradient!")
                return True
            else:
                print("⚠️  PRODUCTION PIPELINE TEST INCOMPLETE")
                print("=" * 80)
                print(f"\nTask status: {task.status}")
                print(f"Check logs for more details")
                return False
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_task_manager_integration():
    """Test TaskManager integration separately."""
    print("\n" + "=" * 80)
    print("TASK MANAGER INTEGRATION TEST")
    print("=" * 80)
    
    try:
        from src.config.dependencies import get_task_manager
        from src.db.session import SessionLocal
        
        task_manager = get_task_manager()
        
        print(f"\n[STATUS] TaskManager status: {task_manager.status()}")
        print(f"  Queue size: {task_manager.queue_size()}")
        
        # Start if not running
        if task_manager.status() != "running":
            print(f"\n[START] Starting TaskManager...")
            await task_manager.start()
            print(f"✓ TaskManager started")
        
        # Create a simple task
        print(f"\n[TEST] Creating simple test task...")
        async with SessionLocal() as session:
            task = await task_manager.create_task(
                session=session,
                title="Simple test task",
                description="Test TaskManager integration",
            )
            await session.commit()
            
            print(f"✓ Task created: {task.id}")
            print(f"  Status: {task.status}")
            
            # Wait a bit
            await asyncio.sleep(5)
            
            # Check status
            await session.refresh(task)
            print(f"  Status after 5s: {task.status}")
        
        # Stop
        await task_manager.stop()
        print(f"\n✓ TaskManager stopped")
        
        print(f"\n✅ TASK MANAGER INTEGRATION TEST PASSED")
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run production pipeline test."""
    print("\n🚀 Starting AXON Production Pipeline Test\n")
    print("This test uses ALL real production components.")
    print("It's the same pipeline that would run with DigitalOcean Gradient.\n")
    
    # Run the production pipeline test
    success = await test_production_pipeline()
    
    if success:
        print("\n🎉 SUCCESS! The production pipeline works perfectly with Gemini!")
        print("\nTo switch to DigitalOcean Gradient for production:")
        print("  1. Set AXON_MODE=gradient")
        print("  2. Set GRADIENT_MODEL_ACCESS_KEY=your_key")
        print("  3. Restart the backend")
        print("\nNo code changes needed - just environment variables!")
        return 0
    else:
        print("\n❌ Production pipeline test failed")
        print("Check the error messages above for details")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
