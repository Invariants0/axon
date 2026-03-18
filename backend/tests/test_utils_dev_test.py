import importlib.util
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
DEV_TEST_PATH = REPO_ROOT / "utils" / "dev_test.py"


def _load_module():
    spec = importlib.util.spec_from_file_location("utils_dev_test", DEV_TEST_PATH)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_headers_empty_when_api_key_not_set(monkeypatch):
    module = _load_module()
    monkeypatch.setattr(module, "AXON_API_KEY", "")
    assert module._headers() == {}


def test_headers_include_api_key(monkeypatch):
    module = _load_module()
    monkeypatch.setattr(module, "AXON_API_KEY", "secret")
    assert module._headers() == {"X-AXON-KEY": "secret"}
