"""Jarayon ichidagi embedding: `multilingual-e5-base` ning int8 ONNX nusxasi (onnxruntime).

Alohida xizmat (TEI konteyneri) kerak emas va ~0.5 GB RAM oladi. Model birinchi
`embed()` chaqiruvida Hugging Face'dan `LOCAL_EMBED_CACHE` ga yuklab olinadi
(~280 MB), keyin internetsiz ishlaydi. Natija TEI'dagi e5 bilan bir xil: o'sha
`query: ` / `passage: ` prefikslari, mean pooling va L2 normallashtirish.
"""

import asyncio
import threading
from collections.abc import Sequence
from typing import Any

import numpy as np

from app.ai.constants import EMBEDDING_DIM
from app.ai.providers import E5_PREFIX, EmbedTask

LOCAL_BATCH = 16
MAX_TOKENS = 512  # e5-base'ning pozitsion embedding chegarasi


class LocalEmbeddingProvider:
    def __init__(self, repo: str, onnx_file: str, cache_dir: str, threads: int) -> None:
        self.model_name = f"{repo}:{onnx_file}"
        self._repo = repo
        self._onnx_file = onnx_file
        self._cache_dir = cache_dir
        self._threads = threads
        self._session: Any = None
        self._tokenizer: Any = None
        # Bitta ONNX sessiyasi: parallel so'rovlar navbat bilan ishlaydi (RAM tejaladi).
        self._lock = threading.Lock()

    def _load(self) -> None:
        if self._session is not None:
            return
        import onnxruntime as ort
        from tokenizers import Tokenizer

        tokenizer_path = self._fetch("tokenizer.json")
        model_path = self._fetch(self._onnx_file)
        tokenizer = Tokenizer.from_file(tokenizer_path)
        tokenizer.enable_truncation(max_length=MAX_TOKENS)
        tokenizer.enable_padding()
        options = ort.SessionOptions()
        options.intra_op_num_threads = self._threads
        options.inter_op_num_threads = 1
        # Arena o'chiq: katta batch'dan keyin xotira OS'ga qaytadi.
        options.enable_cpu_mem_arena = False
        self._session = ort.InferenceSession(
            model_path, options, providers=["CPUExecutionProvider"]
        )
        self._tokenizer = tokenizer

    def _fetch(self, filename: str) -> str:
        """Avval keshdan (internetsiz), bo'lmasa Hugging Face'dan yuklab oladi."""
        from huggingface_hub import hf_hub_download
        from huggingface_hub.errors import LocalEntryNotFoundError

        try:
            return hf_hub_download(
                self._repo, filename, cache_dir=self._cache_dir, local_files_only=True
            )
        except LocalEntryNotFoundError:
            return hf_hub_download(self._repo, filename, cache_dir=self._cache_dir)

    def _embed_sync(self, texts: list[str]) -> list[list[float]]:
        with self._lock:
            self._load()
            names = {i.name for i in self._session.get_inputs()}
            result: list[list[float]] = []
            for start in range(0, len(texts), LOCAL_BATCH):
                encoded = self._tokenizer.encode_batch(texts[start : start + LOCAL_BATCH])
                ids = np.array([e.ids for e in encoded], dtype=np.int64)
                mask = np.array([e.attention_mask for e in encoded], dtype=np.int64)
                feed = {"input_ids": ids, "attention_mask": mask}
                if "token_type_ids" in names:
                    feed["token_type_ids"] = np.zeros_like(ids)
                hidden = self._session.run(None, feed)[0]  # (batch, tokens, dim)
                weights = mask[..., None].astype(np.float32)
                pooled = (hidden * weights).sum(axis=1) / np.maximum(weights.sum(axis=1), 1e-9)
                pooled /= np.maximum(np.linalg.norm(pooled, axis=1, keepdims=True), 1e-12)
                if pooled.shape[1] != EMBEDDING_DIM:
                    raise ValueError(
                        f"Embedding o'lchami {pooled.shape[1]}, kutilgan {EMBEDDING_DIM}"
                    )
                result.extend(pooled.astype(np.float32).tolist())
            return result

    async def embed(self, texts: Sequence[str], task: EmbedTask) -> list[list[float]]:
        prefixed = [E5_PREFIX[task] + t for t in texts]
        return await asyncio.to_thread(self._embed_sync, prefixed)
