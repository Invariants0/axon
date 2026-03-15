#!/usr/bin/env python3
"""
Comprehensive dependency analyzer for AXON project
Extracts imports, classes, functions, and builds dependency graph
"""

import os
import ast
import json
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Set, Tuple

class ModuleAnalyzer(ast.NodeVisitor):
    """Extract module metadata from AST"""
    
    def __init__(self, module_path: str):
        self.module_path = module_path
        self.imports = []
        self.internal_imports = set()
        self.external_imports = set()
        self.classes = []
        self.functions = []
        self.line_count = 0
        
    def visit_Import(self, node):
        for alias in node.names:
            name = alias.name
            self.imports.append(name)
            if any(x in name for x in ['src.', 'agents', 'ai', 'api', 'config', 'core', 'db', 'memory', 'providers', 'schemas', 'services', 'skills', 'storage', 'utils']):
                self.internal_imports.add(name)
            else:
                self.external_imports.add(name)
        self.generic_visit(node)
    
    def visit_ImportFrom(self, node):
        module = node.module if node.module else ''
        for alias in node.names:
            name = f"{module}.{alias.name}" if module else alias.name
            self.imports.append(name)
            if any(x in module for x in ['src.', 'agents', 'ai', 'api', 'config', 'core', 'db', 'memory', 'providers', 'schemas', 'services', 'skills', 'storage', 'utils']) or module.startswith('.'):
                self.internal_imports.add(module if module else '')
            else:
                self.external_imports.add(module if module else '')
        self.generic_visit(node)
    
    def visit_ClassDef(self, node):
        bases = [ast.unparse(base) for base in node.bases]
        self.classes.append({
            'name': node.name,
            'bases': bases,
            'lineno': node.lineno,
            'methods': [m.name for m in node.body if isinstance(m, ast.FunctionDef)]
        })
        self.generic_visit(node)
    
    def visit_FunctionDef(self, node):
        # Only track module-level functions
        if not isinstance(self.classes, list) or not self.classes:
            self.functions.append({
                'name': node.name,
                'lineno': node.lineno,
                'args': [arg.arg for arg in node.args.args]
            })
        self.generic_visit(node)

def analyze_module(file_path: str, src_root: str) -> Dict:
    """Analyze a single Python module"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        tree = ast.parse(content)
        analyzer = ModuleAnalyzer(file_path)
        analyzer.visit(tree)
        analyzer.line_count = len(content.split('\n'))
        
        # Convert relative path for module name
        rel_path = os.path.relpath(file_path, src_root)
        module_name = rel_path.replace('\\', '.').replace('/', '.').replace('.py', '')
        
        return {
            'path': rel_path,
            'module_name': module_name,
            'line_count': analyzer.line_count,
            'imports': list(analyzer.imports),
            'internal_imports': list(analyzer.internal_imports),
            'external_imports': sorted(list(analyzer.external_imports)),
            'classes': analyzer.classes,
            'functions': analyzer.functions,
            'total_classes': len(analyzer.classes),
            'total_functions': len(analyzer.functions)
        }
    except Exception as e:
        return {
            'path': os.path.relpath(file_path, src_root),
            'error': str(e)
        }

def build_dependency_graph(modules: Dict) -> Dict:
    """Build dependency graph from module data"""
    graph = defaultdict(set)
    reverse_graph = defaultdict(set)
    
    for module_name, module_data in modules.items():
        if 'error' in module_data:
            continue
            
        for internal_import in module_data['internal_imports']:
            if internal_import:
                # Normalize import paths
                dep = internal_import.lstrip('.')
                graph[module_name].add(dep)
                reverse_graph[dep].add(module_name)
    
    return {
        'forward': {k: list(v) for k, v in graph.items()},
        'reverse': {k: list(v) for k, v in reverse_graph.items()}
    }

def find_circular_dependencies(graph: Dict) -> List[List[str]]:
    """Find circular dependencies in module graph"""
    def has_cycle(node, visited, rec_stack, path):
        visited.add(node)
        rec_stack.add(node)
        path.append(node)
        
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                cycle = has_cycle(neighbor, visited, rec_stack, path.copy())
                if cycle:
                    return cycle
            elif neighbor in rec_stack:
                return path + [neighbor]
        
        rec_stack.remove(node)
        return None
    
    cycles = []
    visited = set()
    
    for node in graph.keys():
        if node not in visited:
            cycle = has_cycle(node, visited, set(), [])
            if cycle:
                cycles.append(cycle)
    
    return cycles

def analyze_repository(src_root: str) -> Dict:
    """Main analysis function"""
    modules = {}
    
    # Find all Python files
    for root, dirs, files in os.walk(src_root):
        # Skip __pycache__
        dirs[:] = [d for d in dirs if d != '__pycache__']
        
        for file in files:
            if file.endswith('.py') and file != '__init__.py':
                file_path = os.path.join(root, file)
                result = analyze_module(file_path, src_root)
                
                module_name = result['module_name']
                modules[module_name] = result
    
    # Build graphs
    forward_graph = {}
    reverse_graph = defaultdict(set)
    
    for module_name, module_data in modules.items():
        if 'error' in module_data:
            continue
        
        forward_graph[module_name] = module_data['internal_imports']
        
        # Build reverse dependencies
        for dep in module_data['internal_imports']:
            if dep:
                reverse_graph[dep.split('.')[0]].add(module_name.split('.')[0])
    
    # Find circular dependencies
    cycles = find_circular_dependencies(forward_graph)
    
    # Calculate module importance
    module_importance = {}
    for module_name in modules.keys():
        if 'error' not in modules[module_name]:
            depended_by = len(reverse_graph.get(module_name.split('.')[0], set()))
            depends_on = len(modules[module_name]['internal_imports'])
            module_importance[module_name] = {
                'depended_by': depended_by,
                'depends_on': depends_on,
                'criticality_score': depended_by * 2 - depends_on  # More dependencies = higher score
            }
    
    return {
        'modules': modules,
        'module_importance': module_importance,
        'cycles': cycles,
        'stats': {
            'total_modules': len(modules),
            'modules_with_errors': len([m for m in modules.values() if 'error' in m]),
            'total_lines': sum(m.get('line_count', 0) for m in modules.values()),
            'total_classes': sum(m.get('total_classes', 0) for m in modules.values()),
            'total_functions': sum(m.get('total_functions', 0) for m in modules.values())
        }
    }

if __name__ == '__main__':
    src_root = r'e:\Codebase\Hackathon\axon\backend\src'
    
    print("Starting comprehensive repository analysis...")
    results = analyze_repository(src_root)
    
    # Save full results
    output_path = os.path.join(src_root, '..', 'DEPENDENCY_ANALYSIS.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"Analysis complete. Results saved to {output_path}")
    print(f"Total modules: {results['stats']['total_modules']}")
    print(f"Total lines of code: {results['stats']['total_lines']}")
    print(f"Circular dependencies found: {len(results['cycles'])}")
