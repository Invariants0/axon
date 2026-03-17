#!/usr/bin/env python3
"""
Generate structured JSON dependency graph for AXON project.
"""

import json
from collections import defaultdict
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ANALYSIS_FILE = SCRIPT_DIR / "DEPENDENCY_ANALYSIS.json"
GRAPH_FILE = SCRIPT_DIR / "DEPENDENCY_GRAPH.json"
VIZ_FILE = SCRIPT_DIR / "GRAPH_VISUALIZATION.json"


with open(ANALYSIS_FILE, "r", encoding="utf-8") as handle:
    data = json.load(handle)

modules = data.get("modules", {})


def get_layer(module_name: str) -> str:
    parts = module_name.split(".")
    if parts and parts[0] == "src" and len(parts) > 1:
        return parts[1]
    return parts[0] if parts else "unknown"


def build_layer_graph() -> dict:
    layers = defaultdict(list)
    for module_name, module_data in modules.items():
        if "error" in module_data:
            continue
        layers[get_layer(module_name)].append(module_name)

    layer_deps = defaultdict(set)
    for module_name, module_data in modules.items():
        if "error" in module_data:
            continue
        src_layer = get_layer(module_name)
        for dep in module_data.get("internal_imports", []):
            dep_layer = get_layer(dep)
            if dep_layer and dep_layer != src_layer:
                layer_deps[src_layer].add(dep_layer)

    return {
        "layers": {
            layer: {"modules": sorted(module_list), "count": len(module_list)}
            for layer, module_list in sorted(layers.items())
        },
        "dependencies": {
            layer: sorted(list(deps))
            for layer, deps in sorted(layer_deps.items())
        },
    }


def build_module_graph() -> dict:
    module_graph = {}
    for module_name in sorted(modules.keys()):
        module_data = modules[module_name]
        if "error" in module_data:
            continue
        module_graph[module_name] = {
            "path": module_data.get("path"),
            "lines": module_data.get("line_count", 0),
            "classes": module_data.get("total_classes", 0),
            "functions": module_data.get("total_functions", 0),
            "dependencies": module_data.get("internal_imports", []),
            "external_deps": module_data.get("external_imports", []),
            "exports": {
                "classes": [item["name"] for item in module_data.get("classes", [])],
                "functions": [item["name"] for item in module_data.get("functions", [])],
            },
        }
    return module_graph


def build_reverse_graph() -> dict:
    reverse = defaultdict(set)
    for module_name, module_data in modules.items():
        if "error" in module_data:
            continue
        for dep in module_data.get("internal_imports", []):
            if dep in modules:
                reverse[dep].add(module_name)

    return {module: sorted(list(deps)) for module, deps in sorted(reverse.items())}


def calculate_metrics() -> dict:
    valid = [module for module in modules.values() if "error" not in module]
    total_modules = len(valid)
    total_lines = sum(module.get("line_count", 0) for module in valid)
    total_classes = sum(module.get("total_classes", 0) for module in valid)
    total_functions = sum(module.get("total_functions", 0) for module in valid)
    total_deps = sum(len(module.get("internal_imports", [])) for module in valid)

    return {
        "total_modules": total_modules,
        "total_lines": total_lines,
        "total_classes": total_classes,
        "total_functions": total_functions,
        "avg_lines_per_module": (total_lines // total_modules) if total_modules else 0,
        "avg_classes_per_module": (total_classes // total_modules) if total_modules else 0,
        "avg_deps_per_module": (total_deps / total_modules) if total_modules else 0,
        "circular_dependencies": len(data.get("cycles", [])),
    }


print("Generating layer graph...")
layer_graph = build_layer_graph()

print("Generating module graph...")
module_graph = build_module_graph()

print("Generating reverse dependencies...")
reverse_graph = build_reverse_graph()

print("Calculating metrics...")
metrics = calculate_metrics()

output = {
    "metadata": {
        "project": "AXON",
        "analysis_version": "1.0",
        "total_modules": metrics["total_modules"],
    },
    "metrics": metrics,
    "architecture": {"layers": layer_graph},
    "modules": module_graph,
    "dependency_graph": {"reverse_dependencies": reverse_graph},
}

with open(GRAPH_FILE, "w", encoding="utf-8") as handle:
    json.dump(output, handle, indent=2)

print(f"✓ Dependency graph saved to {GRAPH_FILE}")

simple_graph = {"nodes": [], "edges": []}
for layer, info in layer_graph["layers"].items():
    simple_graph["nodes"].append(
        {
            "id": layer,
            "label": layer.upper(),
            "type": "layer",
            "count": info["count"],
        }
    )

for layer, deps in layer_graph["dependencies"].items():
    for dep in deps:
        simple_graph["edges"].append(
            {"source": layer, "target": dep, "type": "dependency"}
        )

with open(VIZ_FILE, "w", encoding="utf-8") as handle:
    json.dump(simple_graph, handle, indent=2)

print(f"✓ Visualization graph saved to {VIZ_FILE}")
