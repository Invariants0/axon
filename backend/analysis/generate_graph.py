#!/usr/bin/env python3
"""
Generate structured JSON dependency graph for AXON project
"""

import json
from collections import defaultdict
from typing import Dict, List, Set

# Load analysis
with open(r'e:\Codebase\Hackathon\axon\backend\DEPENDENCY_ANALYSIS.json', 'r') as f:
    data = json.load(f)

modules = data['modules']


def build_layer_graph() -> Dict:
    """Build layer-level dependency graph"""
    layers = {
        'main': ['main'],
        'api': [m for m in modules.keys() if m.startswith('api.') and 'error' not in modules[m]],
        'config': [m for m in modules.keys() if m.startswith('config.') and 'error' not in modules[m]],
        'core': [m for m in modules.keys() if m.startswith('core.') and 'error' not in modules[m]],
        'services': [m for m in modules.keys() if m.startswith('services.') and 'error' not in modules[m]],
        'agents': [m for m in modules.keys() if m.startswith('agents.') and 'error' not in modules[m]],
        'skills': [m for m in modules.keys() if m.startswith('skills.') and 'error' not in modules[m]],
        'ai': [m for m in modules.keys() if m.startswith('ai.') and 'error' not in modules[m]],
        'memory': [m for m in modules.keys() if m.startswith('memory.') and 'error' not in modules[m]],
        'providers': [m for m in modules.keys() if m.startswith('providers.') and 'error' not in modules[m]],
        'db': [m for m in modules.keys() if m.startswith('db.') and 'error' not in modules[m]],
        'storage': [m for m in modules.keys() if m.startswith('storage.') and 'error' not in modules[m]],
        'schemas': [m for m in modules.keys() if m.startswith('schemas.') and 'error' not in modules[m]],
        'utils': [m for m in modules.keys() if m.startswith('utils.') and 'error' not in modules[m]],
    }
    
    # Build layer dependencies
    layer_deps = defaultdict(set)
    for layer_name, layer_modules in layers.items():
        for module_name in layer_modules:
            if module_name in modules and 'error' not in modules[module_name]:
                for dep in modules[module_name]['internal_imports']:
                    if dep:
                        dep_layer = dep.split('.')[0]
                        if dep_layer != layer_name:
                            layer_deps[layer_name].add(dep_layer)
    
    return {
        'layers': {layer: {'modules': mods, 'count': len(mods)} for layer, mods in layers.items()},
        'dependencies': {layer: sorted(list(deps)) for layer, deps in layer_deps.items() if layer != 'main'}
    }


def build_module_graph() -> Dict:
    """Build detailed module-level graph"""
    module_graph = {}
    
    for module_name in sorted(modules.keys()):
        if 'error' not in modules[module_name]:
            module_data = modules[module_name]
            module_graph[module_name] = {
                'path': module_data['path'],
                'lines': module_data['line_count'],
                'classes': module_data['total_classes'],
                'functions': module_data['total_functions'],
                'dependencies': module_data['internal_imports'],
                'external_deps': module_data['external_imports'],
                'exports': {
                    'classes': [c['name'] for c in module_data['classes']],
                    'functions': [f['name'] for f in module_data['functions']]
                }
            }
    
    return module_graph


def build_reverse_graph() -> Dict:
    """Build what each module depends on it"""
    reverse = defaultdict(set)
    
    for module_name, module_data in modules.items():
        if 'error' not in module_data:
            for dep in module_data['internal_imports']:
                if dep:
                    # Map to module name
                    parts = dep.split('.')
                    for i in range(len(parts), 0, -1):
                        candidate = '.'.join(parts[:i])
                        if candidate in modules:
                            reverse[candidate].add(module_name)
                            break
    
    return {module: sorted(list(deps)) for module, deps in reverse.items()}


def calculate_metrics() -> Dict:
    """Calculate various metrics"""
    metrics = {
        'total_modules': len([m for m in modules.values() if 'error' not in m]),
        'total_lines': sum(m.get('line_count', 0) for m in modules.values() if 'error' not in m),
        'total_classes': sum(m.get('total_classes', 0) for m in modules.values() if 'error' not in m),
        'total_functions': sum(m.get('total_functions', 0) for m in modules.values() if 'error' not in m),
        'avg_lines_per_module': 0,
        'avg_classes_per_module': 0,
        'circular_dependencies': len(data.get('cycles', [])),
    }
    
    metrics['avg_lines_per_module'] = metrics['total_lines'] // metrics['total_modules']
    metrics['avg_classes_per_module'] = metrics['total_classes'] // metrics['total_modules']
    
    # Calculate connectivity
    total_deps = sum(len(m.get('internal_imports', [])) for m in modules.values() if 'error' not in m)
    metrics['avg_deps_per_module'] = total_deps / metrics['total_modules']
    
    return metrics


def identify_critical_paths() -> Dict:
    """Identify critical execution paths"""
    paths = {
        'entry_point': 'main',
        'critical_paths': {
            'api_request_handling': [
                'main',
                'api.routes',
                'services',
                'core.task_manager',
                'core.agent_orchestrator',
                'agents'
            ],
            'skill_execution': [
                'core.agent_orchestrator',
                'skills.executor',
                'skills.registry',
                'core.evolution_engine'
            ],
            'memory_management': [
                'agents',
                'memory.vector_store',
                'memory.context_manager'
            ],
            'database_operations': [
                'core.task_manager',
                'db.session',
                'db.models'
            ]
        }
    }
    return paths


# Generate all structures
print("Generating layer graph...")
layer_graph = build_layer_graph()

print("Generating module graph...")
module_graph = build_module_graph()

print("Generating reverse dependencies...")
reverse_graph = build_reverse_graph()

print("Calculating metrics...")
metrics = calculate_metrics()

print("Identifying critical paths...")
critical_paths = identify_critical_paths()

# Combine into single JSON
output = {
    'metadata': {
        'project': 'AXON',
        'analysis_version': '1.0',
        'total_modules': len([m for m in modules.values() if 'error' not in m]),
        'analysis_timestamp': '2026-03-14'
    },
    'metrics': metrics,
    'architecture': {
        'layers': layer_graph,
        'critical_paths': critical_paths
    },
    'modules': module_graph,
    'dependency_graph': {
        'reverse_dependencies': reverse_graph
    }
}

# Save
output_path = r'e:\Codebase\Hackathon\axon\DEPENDENCY_GRAPH.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2)

print(f"\n✓ Dependency graph saved to {output_path}")

# Also generate a simplified graph for visualization
simple_graph = {
    'nodes': [],
    'edges': []
}

# Add all layer nodes
for layer, info in layer_graph['layers'].items():
    simple_graph['nodes'].append({
        'id': layer,
        'label': layer.upper(),
        'type': 'layer',
        'count': info['count']
    })

# Add layer dependencies as edges
for layer, deps in layer_graph['dependencies'].items():
    for dep in deps:
        simple_graph['edges'].append({
            'source': layer,
            'target': dep,
            'type': 'dependency'
        })

# Save simple graph
simple_path = r'e:\Codebase\Hackathon\axon\GRAPH_VISUALIZATION.json'
with open(simple_path, 'w', encoding='utf-8') as f:
    json.dump(simple_graph, f, indent=2)

print(f"✓ Visualization graph saved to {simple_path}")
