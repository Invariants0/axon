#!/usr/bin/env python3
"""
Qdrant Integration Test Script

Tests Qdrant Cloud vector database integration with AXON backend.
Ensures full backward compatibility with Chroma while validating Qdrant functionality.

Usage:
    # Test with Chroma (default)
    python utils/test_qdrant_integration.py --provider chroma
    
    # Test with Qdrant Cloud
    QDRANT_URL="https://..." QDRANT_API_KEY="..." python utils/test_qdrant_integration.py --provider qdrant
    
    # Test both providers
    python utils/test_qdrant_integration.py --provider both

Dependencies:
    - qdrant-client >= 2.0.0
    - chromadb >= 0.4.0
    - sentence-transformers >= 2.2.0
"""

import asyncio
import sys
import time
from pathlib import Path
from typing import Literal

# Add backend/src to path
backend_root = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_root))

# Load .env BEFORE importing config
from dotenv import load_dotenv
env_path = backend_root / ".env"
load_dotenv(env_path, override=True)

from src.config.config import Settings, get_settings
from src.memory.vector_store import VectorStore
from src.memory.qdrant_store import QdrantStore

# Clear settings cache to force reload from environment
get_settings.cache_clear()


async def test_vector_store(
    provider: Literal["chroma", "qdrant"],
    test_content: list[str],
    test_task_id: str = "test-task-001",
) -> dict:
    """
    Test vector store operations.
    
    Args:
        provider: "chroma" or "qdrant"
        test_content: List of content strings to test
        test_task_id: Task ID for filtering
        
    Returns:
        Test results dictionary
    """
    print(f"\n{'='*60}")
    print(f"Testing {provider.upper()} Vector Store")
    print(f"{'='*60}\n")
    
    results = {
        "provider": provider,
        "tests_passed": 0,
        "tests_failed": 0,
        "operations": [],
        "errors": [],
    }
    
    try:
        # Initialize store
        print(f"[1/6] Initializing {provider} store...")
        start_time = time.time()
        
        if provider == "chroma":
            store = VectorStore()
        elif provider == "qdrant":
            store = QdrantStore()
        else:
            raise ValueError(f"Unknown provider: {provider}")
        
        init_time = time.time() - start_time
        print(f"      ✓ Initialized in {init_time:.2f}s")
        results["operations"].append(
            {"name": "initialization", "duration_ms": init_time * 1000, "status": "success"}
        )
        results["tests_passed"] += 1
        
    except Exception as e:
        error_msg = f"Failed to initialize {provider}: {str(e)}"
        print(f"      ✗ {error_msg}")
        results["errors"].append(error_msg)
        results["tests_failed"] += 1
        return results
    
    try:
        # Test add_embedding operations
        print(f"\n[2/6] Testing add_embedding operations...")
        memory_ids = []
        
        for i, content in enumerate(test_content):
            start_time = time.time()
            memory_id = await store.add_embedding(
                content=content,
                memory_type="test",
                task_id=test_task_id,
                metadata={"index": i},
            )
            add_time = time.time() - start_time
            memory_ids.append(memory_id)
            print(f"      ✓ Added embedding {i+1}/{len(test_content)} (ID: {memory_id[:8]}...) in {add_time*1000:.1f}ms")
        
        results["operations"].append(
            {"name": "add_embedding", "count": len(test_content), "status": "success"}
        )
        results["tests_passed"] += 1
        
    except Exception as e:
        error_msg = f"Failed to add embeddings: {str(e)}"
        print(f"      ✗ {error_msg}")
        results["errors"].append(error_msg)
        results["tests_failed"] += 1
        return results
    
    try:
        # Test similarity_search with task filter
        print(f"\n[3/6] Testing similarity_search with task filter...")
        start_time = time.time()
        
        search_results = await store.similarity_search(
            query="test query",
            limit=5,
            task_id=test_task_id,
        )
        search_time = time.time() - start_time
        
        print(f"      ✓ Found {len(search_results)} results in {search_time*1000:.1f}ms")
        for i, result in enumerate(search_results[:3]):
            print(f"        - Result {i+1}: {result['content'][:50]}... (distance: {result.get('distance', 'N/A'):.3f})")
        
        results["operations"].append(
            {
                "name": "similarity_search",
                "results_count": len(search_results),
                "duration_ms": search_time * 1000,
                "status": "success",
            }
        )
        results["tests_passed"] += 1
        
    except Exception as e:
        error_msg = f"Failed similarity search: {str(e)}"
        print(f"      ✗ {error_msg}")
        results["errors"].append(error_msg)
        results["tests_failed"] += 1
        return results
    
    try:
        # Test retrieve_context
        print(f"\n[4/6] Testing retrieve_context...")
        start_time = time.time()
        
        context = await store.retrieve_context(
            task_prompt="test query",
            task_id=test_task_id,
            limit=3,
        )
        context_time = time.time() - start_time
        
        context_preview = context[:100].replace("\n", " ")
        print(f"      ✓ Retrieved context in {context_time*1000:.1f}ms")
        print(f"        Context: {context_preview}...")
        
        results["operations"].append(
            {
                "name": "retrieve_context",
                "context_length": len(context),
                "duration_ms": context_time * 1000,
                "status": "success",
            }
        )
        results["tests_passed"] += 1
        
    except Exception as e:
        error_msg = f"Failed to retrieve context: {str(e)}"
        print(f"      ✗ {error_msg}")
        results["errors"].append(error_msg)
        results["tests_failed"] += 1
        return results
    
    try:
        # Test similarity search without task filter
        print(f"\n[5/6] Testing similarity_search without task filter...")
        start_time = time.time()
        
        search_results_all = await store.similarity_search(
            query="artificial intelligence",
            limit=10,
            task_id=None,  # Search across all tasks
        )
        search_time = time.time() - start_time
        
        print(f"      ✓ Found {len(search_results_all)} results in {search_time*1000:.1f}ms (cross-task search)")
        
        results["operations"].append(
            {
                "name": "cross_task_search",
                "results_count": len(search_results_all),
                "duration_ms": search_time * 1000,
                "status": "success",
            }
        )
        results["tests_passed"] += 1
        
    except Exception as e:
        error_msg = f"Failed cross-task search: {str(e)}"
        print(f"      ✗ {error_msg}")
        results["errors"].append(error_msg)
        results["tests_failed"] += 1
    
    try:
        # Test collection stats (if available)
        print(f"\n[6/6] Testing collection statistics...")
        
        if hasattr(store, "get_collection_stats"):
            stats = await store.get_collection_stats()
            print(f"      ✓ Collection stats:")
            for key, value in stats.items():
                print(f"        - {key}: {value}")
            
            results["operations"].append(
                {"name": "get_collection_stats", "status": "success", "stats": stats}
            )
            results["tests_passed"] += 1
        else:
            print(f"      ℹ Collection stats not available for {provider}")
        
    except Exception as e:
        error_msg = f"Failed to get collection stats: {str(e)}"
        print(f"      ✗ {error_msg}")
        results["errors"].append(error_msg)
        results["tests_failed"] += 1
    
    # Summary
    print(f"\n{'─'*60}")
    print(f"Tests: {results['tests_passed']} passed, {results['tests_failed']} failed")
    if results["errors"]:
        print(f"Errors:")
        for error in results["errors"]:
            print(f"  - {error}")
    print(f"{'─'*60}\n")
    
    return results


async def main():
    """Run all tests."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test Qdrant integration")
    parser.add_argument(
        "--provider",
        choices=["chroma", "qdrant", "both"],
        default="both",
        help="Vector store provider to test",
    )
    args = parser.parse_args()
    
    # Test data
    test_content = [
        "Artificial intelligence is transforming the world",
        "Machine learning enables systems to learn from data",
        "Deep learning uses neural networks with multiple layers",
        "Natural language processing helps understand human language",
        "Python is a popular language for AI development",
    ]
    
    all_results = []
    
    # Test Chroma
    if args.provider in ("chroma", "both"):
        try:
            chroma_results = await test_vector_store("chroma", test_content)
            all_results.append(chroma_results)
        except Exception as e:
            print(f"\n✗ Chroma test failed: {e}")
            all_results.append(
                {
                    "provider": "chroma",
                    "tests_passed": 0,
                    "tests_failed": 1,
                    "errors": [str(e)],
                }
            )
    
    # Test Qdrant
    if args.provider in ("qdrant", "both"):
        try:
            qdrant_results = await test_vector_store("qdrant", test_content, test_task_id="test-task-002")
            all_results.append(qdrant_results)
        except Exception as e:
            print(f"\n✗ Qdrant test failed: {e}")
            if "Qdrant configuration missing" in str(e):
                print("  (Skipping Qdrant - not configured)")
            else:
                all_results.append(
                    {
                        "provider": "qdrant",
                        "tests_passed": 0,
                        "tests_failed": 1,
                        "errors": [str(e)],
                    }
                )
    
    # Final summary
    print("\n" + "="*60)
    print("FINAL TEST SUMMARY")
    print("="*60)
    
    total_passed = sum(r.get("tests_passed", 0) for r in all_results)
    total_failed = sum(r.get("tests_failed", 0) for r in all_results)
    
    for result in all_results:
        provider = result["provider"].upper()
        passed = result.get("tests_passed", 0)
        failed = result.get("tests_failed", 0)
        status = "✓ PASS" if failed == 0 else "✗ FAIL"
        print(f"{provider:10} | {status} | {passed} passed, {failed} failed")
    
    print("="*60)
    print(f"Total: {total_passed} passed, {total_failed} failed")
    
    if total_failed == 0:
        print("✓ All tests passed!")
        return 0
    else:
        print("✗ Some tests failed")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
