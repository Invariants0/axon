from __future__ import annotations

import hashlib
from functools import lru_cache

from sentence_transformers import SentenceTransformer

from src.config.config import get_settings


@lru_cache(maxsize=1)
def _load_model() -> SentenceTransformer | None:
    settings = get_settings()
    try:
        return SentenceTransformer(settings.embedding_model)
    except Exception:  # noqa: BLE001
        return None


def _fallback_embedding(text: str, dim: int = 384) -> list[float]:
    seed = hashlib.sha256(text.encode("utf-8")).digest()
    values = []
    for i in range(dim):
        values.append((seed[i % len(seed)] / 255.0) * 2 - 1)
    return values


async def embed(text: str) -> list[float]:
    model = _load_model()
    if model is None:
        return _fallback_embedding(text)
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()
