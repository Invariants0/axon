from __future__ import annotations

import ast
import json
import os
import time

import httpx

BASE_URL = os.getenv("AXON_BASE_URL", "http://127.0.0.1:8000")
API_KEY = os.getenv("API_KEY", "")
POLL_TIMEOUT_SECONDS = int(os.getenv("AXON_TEST_TIMEOUT", "60"))
POLL_INTERVAL_SECONDS = float(os.getenv("AXON_TEST_POLL_INTERVAL", "1.0"))


def _headers() -> dict[str, str]:
    headers = {}
    if API_KEY:
        headers["x-api-key"] = API_KEY
    return headers


def _print_agent_status(name: str, output: dict) -> None:
    status = "\u2713" if output else "x"
    print(f"{name} {status}")


def main() -> None:
    print("## AXON TEST REPORT")
    with httpx.Client(timeout=10.0) as client:
        system_response = client.get(f"{BASE_URL}/system/", headers=_headers())
        system_response.raise_for_status()
        system_status = system_response.json()

        print(f"API: {'ok' if system_status.get('status') == 'ready' else 'error'}")
        print(f"Database: {system_status.get('database', 'unknown')}")
        print(f"Skills loaded: {system_status.get('skills_loaded', 0)}")
        print(f"Agents connected: {4 if system_status.get('agents_ready') else 0}")

        create_response = client.post(
            f"{BASE_URL}/tasks/",
            headers=_headers(),
            json={
                "title": "Deterministic pipeline test",
                "description": "Verify planning, research, reasoning, and builder stages.",
            },
        )
        create_response.raise_for_status()
        task = create_response.json()
        task_id = task["id"]

        print("\n## Test Task Execution")
        deadline = time.time() + POLL_TIMEOUT_SECONDS
        while time.time() < deadline:
            task_response = client.get(f"{BASE_URL}/tasks/{task_id}", headers=_headers())
            task_response.raise_for_status()
            task = task_response.json()
            if task.get("status") in {"completed", "failed"}:
                break
            time.sleep(POLL_INTERVAL_SECONDS)
        else:
            raise TimeoutError(f"Task {task_id} did not finish in {POLL_TIMEOUT_SECONDS} seconds")

        result_payload = {}
        raw_result = task.get("result", "")
        if isinstance(raw_result, str) and raw_result:
            try:
                result_payload = ast.literal_eval(raw_result)
            except Exception:
                result_payload = {"raw": raw_result}

        _print_agent_status("PlanningAgent", result_payload.get("planning", {}))
        _print_agent_status("ResearchAgent", result_payload.get("research", {}))
        _print_agent_status("ReasoningAgent", result_payload.get("reasoning", {}))
        _print_agent_status("BuilderAgent", result_payload.get("builder", {}))

        final_result = ""
        builder_result = result_payload.get("builder", {})
        if isinstance(builder_result, dict):
            final_result = str(builder_result.get("final") or builder_result.get("build") or "")
            if final_result:
                try:
                    parsed = json.loads(final_result)
                    if isinstance(parsed, dict) and "solution" in parsed:
                        final_result = str(parsed["solution"])
                except Exception:
                    pass

        print("\nFinal Result:")
        print(final_result or "<empty>")

        print("\n## Database Results")
        print(f"Task ID: {task.get('id')}")
        print(f"Status: {task.get('status')}")
        print(f"Stored Result: {task.get('result')}")


if __name__ == "__main__":
    main()
