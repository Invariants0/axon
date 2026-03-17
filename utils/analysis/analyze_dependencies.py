#!/usr/bin/env python3
"""
AXON Backend Dependency Analysis Tool

Analyzes the backend source code to generate:
- Module structure and hierarchy
- Internal and external imports
- Classes and functions per module
- Circular dependencies detection
- Architecture metrics
"""

import ast
import json
from collections import defaultdict
from pathlib import Path
from typing import Any


def get_backend_src_path() -> Path:
    """Get backend/src directory path (relative)"""
    repo_root = Path(__file__).resolve().parents[2]
    return repo_root / 'backend' / 'src'


def extract_imports(tree: ast.AST) -> tuple[list[str], list[str]]:
    """Extract internal and external imports from AST"""
    internal = set()
    external = set()
    
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                module_name = alias.name
                if module_name.startswith('src.'):
                    internal.add(module_name)
                else:
                    external.add(module_name.split('.')[0])
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                if node.module.startswith('src.'):
                    internal.add(node.module)
                else:
                    external.add(node.module.split('.')[0])
    
    return sorted(list(internal)), sorted(list(external))


def extract_classes(tree: ast.AST) -> list[dict]:
    """Extract class definitions from AST"""
    classes = []
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            bases = [ast.get_source_segment(tree, base) or str(base) for base in node.bases]
            classes.append({
                'name': node.name,
                'lineno': node.lineno,
                'bases': bases,
                'methods': len([n for n in node.body if isinstance(n, ast.FunctionDef)])
            })
    return classes


def extract_functions(tree: ast.AST) -> list[dict]:
    """Extract function definitions from AST"""
    functions = []
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and not any(isinstance(parent, ast.ClassDef) for parent in ast.walk(tree)):
            functions.append({
                'name': node.name,
                'lineno': node.lineno,
                'args': len(node.args.args)
            })
    return functions


def analyze_module(filepath: Path) -> dict:
    """Analyze a single Python module"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            source = f.read()
        
        tree = ast.parse(source)
        internal_imports, external_imports = extract_imports(tree)
        classes = extract_classes(tree)
        functions = extract_functions(tree)
        
        repo_root = Path(__file__).resolve().parents[2]
        return {
            'path': str(filepath.relative_to(repo_root)),
            'line_count': len(source.splitlines()),
            'imports': [f"{imp}" for imp in ast.literal_eval('[' + ', '.join(f'"{i}"' for i in (internal_imports + external_imports)) + ']') if imp],
            'internal_imports': internal_imports,
            'external_imports': external_imports,
            'classes': classes,
            'functions': functions,
            'total_classes': len(classes),
            'total_functions': len(functions) + sum(c.get('methods', 0) for c in classes),
        }
    except Exception as e:
        repo_root = Path(__file__).resolve().parents[2]
        return {'error': str(e), 'path': str(filepath.relative_to(repo_root))}


def analyze_backend() -> dict:
    """Analyze entire backend structure"""
    src_root = get_backend_src_path()
    
    if not src_root.exists():
        print(f"❌ Error: {src_root} not found")
        return {}
    
    modules = {}
    total_lines = 0
    total_classes = 0
    total_functions = 0
    
    # Walk through all Python files
    for pyfile in sorted(src_root.rglob('*.py')):
        if '__pycache__' in str(pyfile):
            continue
        
        # Get module name
        relative_path = pyfile.relative_to(src_root)
        module_name = 'src.' + '.'.join(relative_path.with_suffix('').parts)
        
        print(f"  Analyzing: {module_name}...", end='', flush=True)
        
        analysis = analyze_module(pyfile)
        modules[module_name] = analysis
        
        if 'error' not in analysis:
            total_lines += analysis['line_count']
            total_classes += analysis['total_classes']
            total_functions += analysis['total_functions']
            print(f" ✓")
        else:
            print(f" ✗")
    
    # Detect cycles
    cycles = detect_cycles(modules)
    
    stats = {
        'total_modules': len([m for m in modules.values() if 'error' not in m]),
        'total_lines': total_lines,
        'total_classes': total_classes,
        'total_functions': total_functions,
    }
    
    return {
        'modules': modules,
        'stats': stats,
        'cycles': cycles,
    }


def detect_cycles(modules: dict) -> list[list[str]]:
    """Detect circular dependencies"""
    cycles = []
    visited = set()
    rec_stack = set()
    
    def dfs(node: str, path: list[str]) -> None:
        visited.add(node)
        rec_stack.add(node)
        path.append(node)
        
        if node in modules and 'error' not in modules[node]:
            for dep in modules[node]['internal_imports']:
                if dep.startswith('src.'):
                    if dep in rec_stack:
                        # Found a cycle
                        if dep in path:
                            cycle_start = path.index(dep)
                            cycle = path[cycle_start:] + [dep]
                            cycles.append(cycle)
                    elif dep not in visited:
                        dfs(dep, path.copy())
    
    for module in modules.keys():
        if module not in visited:
            dfs(module, [])
    
    return cycles


def main():
    print("📊 AXON Backend Dependency Analysis")
    print("=" * 60)
    
    src_root = get_backend_src_path()
    print(f"📁 Analyzing source at: {src_root}")
    print()
    
    analysis = analyze_backend()
    
    if not analysis:
        print("❌ Analysis failed")
        return
    
    # Save results
    output_path = Path(__file__).parent / 'DEPENDENCY_ANALYSIS.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(analysis, f, indent=2)
    
    print()
    print("=" * 60)
    print(f"✓ Analysis complete!")
    print(f"  Modules analyzed: {analysis['stats']['total_modules']}")
    print(f"  Total lines: {analysis['stats']['total_lines']:,}")
    print(f"  Total classes: {analysis['stats']['total_classes']}")
    print(f"  Total functions: {analysis['stats']['total_functions']}")
    print(f"  Circular dependencies: {len(analysis['cycles'])}")
    print()
    print(f"📄 Output saved to: {output_path}")


if __name__ == '__main__':
    main()
