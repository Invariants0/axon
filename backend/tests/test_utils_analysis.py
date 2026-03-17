import ast
import importlib.util
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
ANALYSIS_PATH = REPO_ROOT / "utils" / "analysis" / "analyze_dependencies.py"


def _load_module():
    spec = importlib.util.spec_from_file_location("utils_analysis", ANALYSIS_PATH)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_get_backend_src_path_points_to_repo_backend_src():
    module = _load_module()
    expected = REPO_ROOT / "backend" / "src"
    assert module.get_backend_src_path() == expected


def test_extract_imports_splits_internal_and_external():
    module = _load_module()
    tree = ast.parse(
        """
import os
import src.core.agent_orchestrator
from src.config.config import get_settings
from fastapi import FastAPI
"""
    )

    internal, external = module.extract_imports(tree)

    assert "src.core.agent_orchestrator" in internal
    assert "src.config.config" in internal
    assert "os" in external
    assert "fastapi" in external


def test_detect_cycles_finds_cycle_without_crashing_on_missing_dep():
    module = _load_module()
    modules = {
        "src.a": {"internal_imports": ["src.b"]},
        "src.b": {"internal_imports": ["src.a", "src.missing"]},
        "src.c": {"internal_imports": []},
    }

    cycles = module.detect_cycles(modules)

    assert any(cycle[:2] == ["src.a", "src.b"] and cycle[-1] == "src.a" for cycle in cycles)
