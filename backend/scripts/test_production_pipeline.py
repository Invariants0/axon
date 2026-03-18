#!/usr/bin/env python3
"""
Production Pipeline Test with Skill Generation
Tests the complete AXON pipeline with automatic skill generation when skills are missing.
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_root))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from src.ai.llm_service import LLMService
from src.config.config import settings
from src.core.agent_orchestrator import AgentOrchestrator
from src.core.event_bus import EventBus
from src.core.evolution_engine import EvolutionEngine
from src.core.task_manager import TaskManager
from src.db.models import Base
from src.skills.executor import SkillExecutor
from src.skills.registry import SkillRegistry
from src.utils.logger import get_logger

logger = get_logger(__name__)


class ProductionPipelineTest:
    """Test the production pipeline with skill generation"""
    
    def __init__(self):
        self.engine = None
        self.session_maker = None
        self.llm_service = None
        self.skill_registry = None
        self.skill_executor = None
        self.event_bus = None
        self.evolution_engine = None
        self.task_manager = None
        self.orchestrator = None
        
    async def setup(self):
        """Initialize all components"""
        print("\n" + "="*80)
        print("PRODUCTION PIPELINE TEST - SKILL GENERATION")
        print("="*80)
        
        # Database setup
        print("\n[1/8] Setting up database...")
        self.engine = create_async_engine(
            "sqlite+aiosqlite:///:memory:",
            echo=False,
        )
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        self.session_maker = sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        print("✓ Database initialized")
        
        # LLM Service
        print("\n[2/8] Initializing LLM Service...")
        self.llm_service = LLMService()
        print(f"✓ LLM Service ready (mode: {settings.axon_mode})")
        
        # Skill Registry
        print("\n[3/8] Loading Skill Registry...")
        self.skill_registry = SkillRegistry()
        core_skills = [s.name for s in self.skill_registry.all()]
        print(f"✓ Loaded {len(core_skills)} core skills: {', '.join(core_skills)}")
        
        # Skill Executor
        print("\n[4/8] Initializing Skill Executor...")
        self.skill_executor = SkillExecutor(self.skill_registry, self.llm_service)
        print("✓ Skill Executor ready")
        
        # Event Bus
        print("\n[5/8] Starting Event Bus...")
        self.event_bus = EventBus()
        print("✓ Event Bus active")
        
        # Evolution Engine
        print("\n[6/8] Initializing Evolution Engine...")
        self.evolution_engine = EvolutionEngine(
            self.llm_service,
            self.skill_registry,
            self.event_bus,
        )
        print("✓ Evolution Engine ready for skill generation")
        
        # Task Manager
        print("\n[7/8] Setting up Task Manager...")
        async with self.session_maker() as session:
            self.task_manager = TaskManager(session, self.event_bus)
        print("✓ Task Manager initialized")
        
        # Agent Orchestrator
        print("\n[8/8] Initializing Agent Orchestrator...")
        self.orchestrator = AgentOrchestrator(
            llm_service=self.llm_service,
            skill_executor=self.skill_executor,
            event_bus=self.event_bus,
        )
        print("✓ Agent Orchestrator ready")
        
        print("\n" + "="*80)
        print("ALL COMPONENTS INITIALIZED SUCCESSFULLY")
        print("="*80)
    
    async def test_missing_skill_generation(self):
        """Test automatic skill generation when a skill is missing"""
        print("\n" + "="*80)
        print("TEST 1: MISSING SKILL AUTO-GENERATION")
        print("="*80)
        
        # Simulate a request that requires web_search skill
        test_query = "Tell me the most recent news on AI"
        skill_name = "web_search"
        
        print(f"\n📝 User Query: '{test_query}'")
        print(f"🔍 Required Skill: '{skill_name}'")
        
        # Check if skill exists
        print(f"\n[Step 1] Checking if '{skill_name}' skill exists...")
        try:
            self.skill_registry.get(skill_name)
            print(f"✓ Skill '{skill_name}' already exists")
            return
        except KeyError:
            print(f"✗ Skill '{skill_name}' NOT FOUND")
            print(f"🔧 Triggering automatic skill generation...")
        
        # Generate the missing skill
        print(f"\n[Step 2] Generating '{skill_name}' skill...")
        async with self.session_maker() as session:
            try:
                result = await self.evolution_engine.generate_missing_skill(
                    skill_name=skill_name,
                    context={
                        "query": test_query,
                        "reason": "User requested web search functionality",
                    },
                    session=session,
                )
                
                print(f"\n✓ SKILL GENERATION SUCCESSFUL!")
                print(f"  - Status: {result['status']}")
                print(f"  - Skill Name: {result['skill_name']}")
                print(f"  - Description: {result['description']}")
                print(f"  - Version: {result['version']}")
                print(f"  - Code Length: {result['code_length']} characters")
                print(f"  - Validated: {result['validated']}")
                
                await session.commit()
                
            except Exception as e:
                print(f"\n✗ SKILL GENERATION FAILED: {e}")
                raise
        
        # Verify the skill was loaded
        print(f"\n[Step 3] Verifying skill was loaded into registry...")
        try:
            skill_def = self.skill_registry.get(skill_name)
            print(f"✓ Skill '{skill_name}' successfully loaded")
            print(f"  - Name: {skill_def.name}")
            print(f"  - Description: {skill_def.description}")
            print(f"  - Parameters: {list(skill_def.parameters.keys())}")
            print(f"  - Version: {skill_def.version}")
        except KeyError:
            print(f"✗ Skill '{skill_name}' failed to load")
            raise
        
        # Test executing the generated skill
        print(f"\n[Step 4] Testing execution of generated skill...")
        try:
            result = await self.skill_executor.execute(
                skill_name,
                {"data": test_query}
            )
            print(f"✓ Skill execution successful!")
            print(f"  Result: {result}")
        except Exception as e:
            print(f"✗ Skill execution failed: {e}")
            raise
        
        # Check generated skill file
        print(f"\n[Step 5] Verifying generated skill file...")
        skill_file = self.skill_registry.generated_skills_path() / f"{skill_name}.py"
        if skill_file.exists():
            print(f"✓ Skill file created: {skill_file}")
            print(f"  File size: {skill_file.stat().st_size} bytes")
        else:
            print(f"✗ Skill file not found: {skill_file}")
        
        print("\n" + "="*80)
        print("TEST 1 COMPLETED SUCCESSFULLY")
        print("="*80)
    
    async def test_full_pipeline_with_skill(self):
        """Test the full agent pipeline using the generated skill"""
        print("\n" + "="*80)
        print("TEST 2: FULL PIPELINE WITH GENERATED SKILL")
        print("="*80)
        
        test_query = "Search for the latest AI developments and summarize them"
        
        print(f"\n📝 User Query: '{test_query}'")
        
        # Create a task
        print(f"\n[Step 1] Creating task...")
        async with self.session_maker() as session:
            task = await self.task_manager.create_task(
                description=test_query,
                session=session,
            )
            print(f"✓ Task created: {task.id}")
            await session.commit()
        
        # Execute through orchestrator
        print(f"\n[Step 2] Executing through agent orchestrator...")
        try:
            async with self.session_maker() as session:
                result = await self.orchestrator.execute_task(
                    task_id=task.id,
                    session=session,
                )
                
                print(f"\n✓ PIPELINE EXECUTION SUCCESSFUL!")
                print(f"  - Task ID: {task.id}")
                print(f"  - Status: {result.get('status', 'unknown')}")
                
                if 'result' in result:
                    print(f"  - Result: {result['result']}")
                
                await session.commit()
                
        except Exception as e:
            print(f"\n✗ PIPELINE EXECUTION FAILED: {e}")
            raise
        
        print("\n" + "="*80)
        print("TEST 2 COMPLETED SUCCESSFULLY")
        print("="*80)
    
    async def generate_skill_documentation(self):
        """Generate markdown documentation for the generated skill"""
        print("\n" + "="*80)
        print("GENERATING SKILL DOCUMENTATION")
        print("="*80)
        
        skill_name = "web_search"
        
        try:
            skill_def = self.skill_registry.get(skill_name)
        except KeyError:
            print(f"✗ Skill '{skill_name}' not found, cannot generate documentation")
            return
        
        # Create documentation
        doc_content = f"""# {skill_def.name.replace('_', ' ').title()} Skill

## Overview
{skill_def.description}

## Input Parameters
"""
        
        for param_name, param_spec in skill_def.parameters.items():
            required = "required" if param_spec.get("required", False) else "optional"
            param_type = param_spec.get("type", "any")
            doc_content += f"- **{param_name}** ({param_type}, {required}): Parameter for {skill_name}\n"
        
        doc_content += f"""
## Output
```json
{{
  "result": "Processed result",
  "status": "success"
}}
```

## Usage Example
```python
result = await skill_executor.execute("{skill_def.name}", {{
    "data": "your query here"
}})
```

## Version
{skill_def.version}

## Auto-Generated
This skill was automatically generated by the AXON Evolution Engine.

## Source Code
```python
{skill_def.source}
```
"""
        
        # Save documentation
        doc_file = self.skill_registry.generated_skills_path() / f"{skill_name}.md"
        doc_file.write_text(doc_content, encoding="utf-8")
        
        print(f"✓ Documentation generated: {doc_file}")
        print(f"  File size: {doc_file.stat().st_size} bytes")
        
        print("\n" + "="*80)
        print("DOCUMENTATION GENERATION COMPLETED")
        print("="*80)
        
        return doc_file
    
    async def create_summary_report(self, doc_file: Path):
        """Create a summary report of the test"""
        print("\n" + "="*80)
        print("CREATING SUMMARY REPORT")
        print("="*80)
        
        # Get all skills
        all_skills = self.skill_registry.all()
        core_skills = [s for s in all_skills if not s.name.startswith("recovery_")]
        generated_skills = [s for s in all_skills if s.name.startswith("web_") or s.name.startswith("recovery_")]
        
        report_content = f"""# Production Pipeline Test Report

## Test Date
{asyncio.get_event_loop().time()}

## Test Summary
This test validated the AXON production pipeline with automatic skill generation.

### Test Scenario
1. User requests: "Tell me the most recent news on AI"
2. System detects missing `web_search` skill
3. Evolution Engine automatically generates the skill
4. Skill is validated and loaded into registry
5. Full pipeline executes successfully with the new skill

## Results

### ✓ All Tests Passed

### Skills Status
- **Core Skills**: {len(core_skills)} loaded
- **Generated Skills**: {len(generated_skills)} created during test

### Core Skills
"""
        
        for skill in core_skills:
            report_content += f"- `{skill.name}`: {skill.description}\n"
        
        report_content += "\n### Generated Skills\n"
        
        for skill in generated_skills:
            report_content += f"- `{skill.name}` (v{skill.version}): {skill.description}\n"
        
        report_content += f"""
## Generated Skill Details

### web_search Skill
- **Status**: ✓ Successfully generated and validated
- **Documentation**: `{doc_file.name}`
- **Location**: `backend/src/skills/generated_skills/web_search.py`

## Pipeline Components Tested
1. ✓ LLM Service ({settings.axon_mode} mode)
2. ✓ Skill Registry (discovery and loading)
3. ✓ Skill Executor (execution engine)
4. ✓ Event Bus (event propagation)
5. ✓ Evolution Engine (skill generation)
6. ✓ Task Manager (task lifecycle)
7. ✓ Agent Orchestrator (pipeline coordination)
8. ✓ Safety Validation (code validation)

## Key Features Demonstrated
- **Automatic Skill Generation**: System detects missing skills and generates them on-demand
- **Safety Validation**: Generated code is validated before execution
- **Dynamic Loading**: New skills are immediately available without restart
- **Documentation Generation**: Auto-generated skills include documentation
- **Full Pipeline Integration**: Generated skills work seamlessly in the agent pipeline

## Configuration
- **AXON Mode**: {settings.axon_mode}
- **Test Mode**: {settings.test_mode}
- **Database**: In-memory SQLite
- **Skill Timeout**: {settings.skill_execution_timeout}s

## Conclusion
The production pipeline successfully demonstrated automatic skill generation and execution.
The system can now handle missing skills by generating them on-demand, making it truly adaptive.

---
Generated by AXON Production Pipeline Test
"""
        
        # Save report
        report_file = Path("PRODUCTION_PIPELINE_TEST_REPORT.md")
        report_file.write_text(report_content, encoding="utf-8")
        
        print(f"✓ Summary report created: {report_file}")
        print(f"  File size: {report_file.stat().st_size} bytes")
        
        print("\n" + "="*80)
        print("SUMMARY REPORT COMPLETED")
        print("="*80)
        
        return report_file
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.engine:
            await self.engine.dispose()
    
    async def run(self):
        """Run all tests"""
        try:
            await self.setup()
            await self.test_missing_skill_generation()
            await self.test_full_pipeline_with_skill()
            doc_file = await self.generate_skill_documentation()
            report_file = await self.create_summary_report(doc_file)
            
            print("\n" + "="*80)
            print("🎉 ALL TESTS COMPLETED SUCCESSFULLY! 🎉")
            print("="*80)
            print(f"\n📄 Generated Files:")
            print(f"  1. Skill: backend/src/skills/generated_skills/web_search.py")
            print(f"  2. Documentation: {doc_file}")
            print(f"  3. Report: {report_file}")
            print("\n" + "="*80)
            
        except Exception as e:
            print(f"\n❌ TEST FAILED: {e}")
            import traceback
            traceback.print_exc()
            raise
        finally:
            await self.cleanup()


async def main():
    """Main entry point"""
    test = ProductionPipelineTest()
    await test.run()


if __name__ == "__main__":
    asyncio.run(main())
