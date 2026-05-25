"""
RxLens Medicine Explanation Cache
==================================
SQLite-backed cache for Gemini responses keyed on:
  (drug_name_normalised, explanation_level, language)

TTL: 7 days (604 800 seconds).
All drug name lookups are case-folded + stripped to maximise hit rate.
"""

import os
import json
import time
import hashlib
import sqlite3
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Cache DB lives next to the backend package
_DB_DIR = Path(__file__).parent.parent / "backend"
_DB_PATH = _DB_DIR / "rxlens_cache.db"
_TTL_SECONDS = 7 * 24 * 60 * 60   # 7 days

# ─────────────────────────────────────────────────────────────────────
# Initialisation
# ─────────────────────────────────────────────────────────────────────

def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(_DB_PATH), check_same_thread=False)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS medicine_cache (
            cache_key   TEXT PRIMARY KEY,
            payload     TEXT NOT NULL,
            created_at  REAL NOT NULL
        )
    """)
    conn.commit()
    return conn


# ─────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────

def _make_key(drug_name: str, explanation_level: str, lang: str) -> str:
    normalised = drug_name.lower().strip()
    raw = f"{normalised}|{explanation_level.lower()}|{lang.lower()}"
    return hashlib.sha256(raw.encode()).hexdigest()


def get_cached(drug_name: str, explanation_level: str = "standard", lang: str = "English") -> dict | None:
    """
    Return cached Gemini payload for this drug if it exists and is fresh.
    Returns None on cache miss or expiry.
    """
    key = _make_key(drug_name, explanation_level, lang)
    try:
        conn = _get_conn()
        row = conn.execute(
            "SELECT payload, created_at FROM medicine_cache WHERE cache_key = ?", (key,)
        ).fetchone()
        conn.close()

        if row is None:
            return None

        payload_json, created_at = row
        if time.time() - created_at > _TTL_SECONDS:
            logger.debug("Cache EXPIRED for %s", drug_name)
            return None

        logger.info("Cache HIT for %s [%s/%s]", drug_name, explanation_level, lang)
        return json.loads(payload_json)

    except Exception as exc:
        logger.warning("Cache read error: %s", exc)
        return None


def set_cache(drug_name: str, payload: Any, explanation_level: str = "standard", lang: str = "English") -> None:
    """Store a Gemini response payload in the cache."""
    key = _make_key(drug_name, explanation_level, lang)
    try:
        conn = _get_conn()
        conn.execute(
            "INSERT OR REPLACE INTO medicine_cache (cache_key, payload, created_at) VALUES (?, ?, ?)",
            (key, json.dumps(payload), time.time()),
        )
        conn.commit()
        conn.close()
        logger.info("Cache SET for %s [%s/%s]", drug_name, explanation_level, lang)
    except Exception as exc:
        logger.warning("Cache write error: %s", exc)


def clear_expired() -> int:
    """Prune rows older than TTL. Returns number of rows deleted."""
    cutoff = time.time() - _TTL_SECONDS
    try:
        conn = _get_conn()
        cur = conn.execute("DELETE FROM medicine_cache WHERE created_at < ?", (cutoff,))
        deleted = cur.rowcount
        conn.commit()
        conn.close()
        return deleted
    except Exception as exc:
        logger.warning("Cache prune error: %s", exc)
        return 0
