#!/usr/bin/env python3
import asyncio
import csv
import sys
from datetime import datetime
from pathlib import Path

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.config.config import get_settings
from src.db.models import Base
from src.db.session import SessionLocal, engine


async def load_evaluation_dataset(csv_path: str) -> list[dict]:
    dataset = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            dataset.append({
                "query": row["query"],
                "expected_response": row["expected_response"],
            })
    return dataset


async def evaluate_agent(agent_url: str, query: str, expected: str, settings) -> dict:
    headers = {
        "Authorization": f"Bearer {settings.digitalocean_api_token}",
        "Content-Type": "application/json",
    }
    payload = {"prompt": query}
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{agent_url}/run",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()
            actual = data.get("response", "")
            
            return {
                "query": query,
                "expected": expected,
                "actual": actual,
                "status": "success",
                "match": expected.lower() in actual.lower(),
            }
    except Exception as exc:
        return {
            "query": query,
            "expected": expected,
            "actual": "",
            "status": "error",
            "error": str(exc),
            "match": False,
        }


async def run_evaluation(csv_path: str, agent_name: str):
    settings = get_settings()
    
    agent_urls = {
        "planner": settings.axon_planner_agent_url,
        "research": settings.axon_research_agent_url,
        "reasoning": settings.axon_reasoning_agent_url,
        "builder": settings.axon_builder_agent_url,
    }
    
    agent_url = agent_urls.get(agent_name)
    if not agent_url:
        print(f"Error: Unknown agent '{agent_name}'")
        return
    
    print(f"Loading evaluation dataset from {csv_path}")
    dataset = await load_evaluation_dataset(csv_path)
    print(f"Loaded {len(dataset)} test cases")
    
    print(f"\nEvaluating agent: {agent_name}")
    print(f"Agent URL: {agent_url}\n")
    
    results = []
    for i, test_case in enumerate(dataset, 1):
        print(f"[{i}/{len(dataset)}] Evaluating: {test_case['query'][:50]}...")
        result = await evaluate_agent(
            agent_url,
            test_case["query"],
            test_case["expected_response"],
            settings,
        )
        results.append(result)
        print(f"  Status: {result['status']}, Match: {result['match']}")
    
    success_count = sum(1 for r in results if r["status"] == "success")
    match_count = sum(1 for r in results if r.get("match", False))
    
    print(f"\n{'='*60}")
    print(f"Evaluation Summary")
    print(f"{'='*60}")
    print(f"Total test cases: {len(results)}")
    print(f"Successful calls: {success_count}")
    print(f"Matching responses: {match_count}")
    print(f"Accuracy: {match_count / len(results) * 100:.2f}%")
    
    output_path = Path(f"evaluation_results_{agent_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")
    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["query", "expected", "actual", "status", "match", "error"])
        writer.writeheader()
        for result in results:
            writer.writerow({
                "query": result["query"],
                "expected": result["expected"],
                "actual": result["actual"],
                "status": result["status"],
                "match": result.get("match", False),
                "error": result.get("error", ""),
            })
    
    print(f"\nResults saved to: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python run_agent_evaluation.py <csv_path> <agent_name>")
        print("Agent names: planner, research, reasoning, builder")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    agent_name = sys.argv[2]
    
    asyncio.run(run_evaluation(csv_path, agent_name))
