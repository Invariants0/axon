#!/usr/bin/env python3
"""
Test full agent flow without database dependency.
Tests the complete pipeline: Planning → Research → Reasoning → Builder
"""

import asyncio
import json
import sys
from pathlib import Path

backend_root = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(backend_root))

async def test_agent_flow():
    print("=" * 80)
    print("FULL AGENT PIPELINE TEST (NO DATABASE)")
    print("=" * 80)
    
    try:
        from src.config.config import get_settings
        from src.ai.llm_service import LLMService
        from src.core.event_bus import EventBus
        from src.memory.vector_store import VectorStore
        from src.skills.executor import SkillExecutor
        from src.skills.registry import SkillRegistry
        from src.agents.planning_agent import PlanningAgent
        from src.agents.research_agent import ResearchAgent
        from src.agents.reasoning_agent import ReasoningAgent
        from src.agents.builder_agent import BuilderAgent
        
        settings = get_settings()
        
        print(f"\n[CONFIG]")
        print(f"  AXON_MODE: {settings.axon_mode}")
        print(f"  GEMINI_MODEL: {settings.gemini_model}")
        print(f"  TEST_MODE: {settings.test_mode}")
        print(f"  DEBUG_PIPELINE: {settings.axon_debug_pipeline}")
        
        # Initialize components
        print(f"\n[INIT] Initializing components...")
        event_bus = EventBus()
        skill_registry = SkillRegistry()
        skill_executor = SkillExecutor(skill_registry)
        vector_store = VectorStore()
        llm_service = LLMService()
        
        skills = skill_registry.all()
        print(f"✓ Loaded {len(skills)} skills:")
        for skill in skills:
            print(f"  - {skill.name} (v{skill.version})")
        
        # Create agents
        print(f"\n[AGENTS] Creating agents...")
        planning_agent = PlanningAgent(llm_service, skill_executor, vector_store, event_bus, None)
        research_agent = ResearchAgent(llm_service, skill_executor, vector_store, event_bus, None)
        reasoning_agent = ReasoningAgent(llm_service, skill_executor, vector_store, event_bus, None)
        builder_agent = BuilderAgent(llm_service, skill_executor, vector_store, event_bus, None)
        print(f"✓ All agents created")
        
        # Test task
        task_id = "test-task-001"
        task_title = "Build a REST API for todo management"
        task_description = "Create a FastAPI REST API with CRUD endpoints for managing todo items"
        
        print(f"\n[TASK]")
        print(f"  ID: {task_id}")
        print(f"  Title: {task_title}")
        print(f"  Description: {task_description}")
        
        # Stage 1: Planning
        print(f"\n[STAGE 1] Running PlanningAgent...")
        planning_input = {
            "id": task_id,
            "title": task_title,
            "description": task_description
        }
        planning_result = await planning_agent.execute(planning_input)
        print(f"✓ Planning completed")
        print(f"  Output keys: {list(planning_result.keys())}")
        
        # Stage 2: Research
        print(f"\n[STAGE 2] Running ResearchAgent...")
        research_input = {
            "id": task_id,
            "title": task_title,
            "description": task_description,
            "plan": planning_result.get("plan", {})
        }
        research_result = await research_agent.execute(research_input)
        print(f"✓ Research completed")
        print(f"  Output keys: {list(research_result.keys())}")
        
        # Stage 3: Reasoning
        print(f"\n[STAGE 3] Running ReasoningAgent...")
        reasoning_input = {
            "id": task_id,
            "title": task_title,
            "description": task_description,
            "plan": planning_result.get("plan", {}),
            "research": research_result
        }
        reasoning_result = await reasoning_agent.execute(reasoning_input)
        print(f"✓ Reasoning completed")
        print(f"  Output keys: {list(reasoning_result.keys())}")
        
        # Stage 4: Builder
        print(f"\n[STAGE 4] Running BuilderAgent...")
        builder_input = {
            "id": task_id,
            "title": task_title,
            "description": task_description,
            "plan": planning_result.get("plan", {}),
            "research": research_result,
            "reasoning": reasoning_result
        }
        builder_result = await builder_agent.execute(builder_input)
        print(f"✓ Builder completed")
        print(f"  Output keys: {list(builder_result.keys())}")
        
        # Display results
        print(f"\n" + "=" * 80)
        print("PIPELINE RESULTS")
        print("=" * 80)
        
        print(f"\n[PLANNING]")
        print(json.dumps(planning_result, indent=2, default=str)[:500] + "...")
        
        print(f"\n[RESEARCH]")
        print(json.dumps(research_result, indent=2, default=str)[:500] + "...")
        
        print(f"\n[REASONING]")
        print(json.dumps(reasoning_result, indent=2, default=str)[:500] + "...")
        
        print(f"\n[BUILDER]")
        print(json.dumps(builder_result, indent=2, default=str)[:500] + "...")
        
        print(f"\n" + "=" * 80)
        print("✅ FULL AGENT PIPELINE TEST PASSED")
        print("=" * 80)
        print(f"\nAll 4 agents executed successfully:")
        print(f"  ✓ PlanningAgent")
        print(f"  ✓ ResearchAgent")
        print(f"  ✓ ReasoningAgent")
        print(f"  ✓ BuilderAgent")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_agent_flow())
    sys.exit(0 if success else 1)
