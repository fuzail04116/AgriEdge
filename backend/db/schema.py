"""
AgriEdge — SQLite database schema and helpers.

Three core tables:
  - sensor_readings: raw telemetry from field nodes
  - images: metadata for ingested leaf/camera images
  - alerts: inference-generated alerts with optional farmer confirmation

Uses raw sqlite3 for zero-dependency simplicity.
"""

import sqlite3
import os
import threading

# ---------------------------------------------------------------------------
# Database path — always relative to project root
# ---------------------------------------------------------------------------
_DB_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
_DB_PATH = os.path.join(_DB_DIR, "agriedge.db")

# Thread-local connections (sqlite3 objects can't cross threads in FastAPI)
_local = threading.local()


def _get_conn() -> sqlite3.Connection:
    """Return a thread-local SQLite connection."""
    if not hasattr(_local, "conn") or _local.conn is None:
        os.makedirs(_DB_DIR, exist_ok=True)
        _local.conn = sqlite3.connect(_DB_PATH, check_same_thread=False)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL;")
    return _local.conn


def get_conn() -> sqlite3.Connection:
    """Public accessor for a thread-local DB connection."""
    return _get_conn()


def init_db() -> None:
    """Create tables if they do not already exist. Safe to call multiple times."""
    conn = _get_conn()
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS sensor_readings (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                node_id       TEXT    NOT NULL,
                ts            INTEGER NOT NULL,
                soil_moisture REAL,
                n             INTEGER,
                p             INTEGER,
                k             INTEGER,
                gas_voc       REAL,
                temp_c        REAL
            );

            CREATE TABLE IF NOT EXISTS images (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                node_id  TEXT    NOT NULL,
                ts       INTEGER NOT NULL,
                filename TEXT    NOT NULL,
                trigger  TEXT    DEFAULT 'scheduled'
            );

            CREATE TABLE IF NOT EXISTS alerts (
                alert_id           TEXT PRIMARY KEY,
                type               TEXT    NOT NULL,
                confidence         REAL    NOT NULL,
                field_zone         TEXT    NOT NULL,
                image_url          TEXT,
                recommended_action TEXT,
                ts                 INTEGER NOT NULL,
                confirmed          INTEGER   -- NULL=pending, 1=confirmed, 0=denied
            );

            CREATE INDEX IF NOT EXISTS idx_sensor_node_ts
                ON sensor_readings(node_id, ts);

            CREATE INDEX IF NOT EXISTS idx_alerts_ts
                ON alerts(ts);
        """)
        conn.commit()
        
        # Migrations for Recent Detections
        try:
            conn.execute("ALTER TABLE images ADD COLUMN disease_label TEXT")
            conn.execute("ALTER TABLE images ADD COLUMN disease_conf REAL")
        except sqlite3.OperationalError:
            pass

        # Migrations for Master Dashboard detailed inferences
        try:
            conn.execute("ALTER TABLE images ADD COLUMN pest_count INTEGER")
            conn.execute("ALTER TABLE images ADD COLUMN pest_conf REAL")
            conn.execute("ALTER TABLE images ADD COLUMN gas_label TEXT")
            conn.execute("ALTER TABLE images ADD COLUMN gas_conf REAL")
            conn.execute("ALTER TABLE sensor_readings ADD COLUMN irrigation_rec TEXT")
            conn.commit()
            print("[db] Migrated tables for Master Dashboard details.")
        except sqlite3.OperationalError:
            pass
            
        # Table for overrides
        conn.execute("""
            CREATE TABLE IF NOT EXISTS irrigation_overrides (
                node_id TEXT PRIMARY KEY,
                override_state TEXT NOT NULL,
                ts INTEGER NOT NULL
            );
        """)
        conn.commit()

        print("[db] Database initialised at", os.path.abspath(_DB_PATH))
    except Exception as exc:
        print(f"[db] ERROR initialising database: {exc}")
        raise
