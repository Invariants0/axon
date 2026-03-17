#!/usr/bin/env python3
"""
Generate a markdown repository analysis report from DEPENDENCY_ANALYSIS.json.
"""

import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ANALYSIS_FILE = SCRIPT_DIR / "DEPENDENCY_ANALYSIS.json"
REPORT_FILE = SCRIPT_DIR / "REPOSITORY_INDEX_ANALYSIS.md"


def layer_name(module_name: str) -> str:
    parts = module_name.split(".")
    if len(parts) >= 2 and parts[0] == "src":
        return parts[1]
    return parts[0] if parts else "unknown"


with open(ANALYSIS_FILE, "r", encoding="utf-8") as handle:
    data = json.load(handle)

modules = data.get("modules", {})
stats = data.get("stats", {})
cycles = data.get("cycles", [])

valid_modules = {
    name: module for name, module in modules.items() if "error" not in module
}

layer_counts = {}
for name in valid_modules:
    layer = layer_name(name)
    layer_counts[layer] = layer_counts.get(layer, 0) + 1

largest = sorted(
    valid_modules.items(), key=lambda item: item[1].get("line_count", 0), reverse=True
)[:10]

lines = [
    "# AXON Repository Index Analysis",
    "",
    "## Summary",
    f"- Modules analyzed: {stats.get('total_modules', len(valid_modules))}",
    f"- Total lines: {stats.get('total_lines', 0):,}",
    f"- Total classes: {stats.get('total_classes', 0)}",
    f"- Total functions: {stats.get('total_functions', 0)}",
    f"- Circular dependencies: {len(cycles)}",
    "",
    "## Layer Breakdown",
]

for layer, count in sorted(layer_counts.items(), key=lambda item: item[1], reverse=True):
    lines.append(f"- {layer}: {count}")

lines.extend(["", "## Largest Modules", "", "| Module | Lines |", "|---|---:|"])
for name, module in largest:
    lines.append(f"| {name} | {module.get('line_count', 0)} |")

if cycles:
    lines.extend(["", "## Circular Dependencies", ""])
    for cycle in cycles[:20]:
        lines.append(f"- {' -> '.join(cycle)}")
else:
    lines.extend(["", "## Circular Dependencies", "", "- None detected"])

REPORT_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"✓ Report saved to {REPORT_FILE}")
