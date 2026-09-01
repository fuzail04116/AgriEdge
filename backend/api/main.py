"""
AgriEdge — FastAPI Backend

Main application serving the dashboard API. Routes:
  POST /ingest/sensor      — receive sensor payloads from simulator/ESP32
  POST /ingest/image       — receive base64-encoded leaf images
  GET  /alerts/latest      — recent alerts for the dashboard
  GET  /sensors/{node_id}/history — sensor time series
  GET  /field/health       — composite field health score
  POST /alerts/{alert_id}/confirm — farmer verification (confirm/deny)
  GET  /field/irrigation   — irrigation recommendations per zone

The ingest routes mirror what a real MQTT subscriber would call internally —
swapping in Mosquitto + MQTT later is a drop-in replacement that calls the
same processing functions.
"""

import os
import sys
import time
import uuid
import base64
import json
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional

# ---------------------------------------------------------------------------
# Ensure project root is on sys.path so imports work with `uvicorn backend.api.main:app`
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.db.schema import init_db, get_conn
from backend.inference import disease as disease_clf
from backend.inference import gas as gas_clf
from backend.inference import pest as pest_det
from backend.fusion.engine import fuse
from backend.rules.irrigation import evaluate as irrigation_evaluate

# ---------------------------------------------------------------------------
# Media directory for saved images
# ---------------------------------------------------------------------------
MEDIA_DIR = PROJECT_ROOT / "backend" / "media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
simulated_offline = False

app = FastAPI(
    title="AgriEdge API",
    description="Smart agriculture monitoring — sensor ingest, ML inference, and alert management",
    version="0.1.0",
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve saved alert images as static files
app.mount("/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")


# ---------------------------------------------------------------------------
# Startup — init DB
# ---------------------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    init_db()
    print("[api] AgriEdge API ready")


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class NPK(BaseModel):
    n: int = 0
    p: int = 0
    k: int = 0


class SensorPayload(BaseModel):
    node_id: str
    ts: int
    soil_moisture: float = 0.5
    npk: NPK = Field(default_factory=NPK)
    gas_voc: float = 100.0
    temp_c: float = 28.0


class ImagePayload(BaseModel):
    node_id: str
    ts: int
    image_b64: str
    trigger: str = "scheduled"


class ConfirmPayload(BaseModel):
    confirmed: bool


# ===========================  INGEST ROUTES  ===============================

@app.post("/ingest/sensor")
def ingest_sensor(payload: SensorPayload):
    """
    Receive a sensor reading from the simulator or real ESP32 node.
    Validates against schema, writes to SQLite.
    """
    try:
        conn = get_conn()
        conn.execute(
            """INSERT INTO sensor_readings
               (node_id, ts, soil_moisture, n, p, k, gas_voc, temp_c)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                payload.node_id,
                payload.ts,
                payload.soil_moisture,
                payload.npk.n,
                payload.npk.p,
                payload.npk.k,
                payload.gas_voc,
                payload.temp_c,
            ),
        )
        conn.commit()
        return {"status": "ok", "node_id": payload.node_id}
    except Exception as exc:
        print(f"[ingest] Sensor error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/ingest/image")
def ingest_image(payload: ImagePayload):
    """
    Receive a base64-encoded image from the simulator or real ESP32-CAM.
    Saves image, runs inference pipeline, and creates alert if warranted.

    This is where the full pipeline runs synchronously:
      decode → save → disease_clf → pest_det → gas_clf → fusion → alert
    """
    try:
        # --- 1. Decode and save image ---
        try:
            image_bytes = base64.b64decode(payload.image_b64)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")

        filename = f"{payload.node_id}_{payload.ts}.jpg"
        filepath = MEDIA_DIR / filename

        with open(filepath, "wb") as f:
            f.write(image_bytes)

        # Write image metadata to DB
        conn = get_conn()
        conn.execute(
            "INSERT INTO images (node_id, ts, filename, trigger) VALUES (?, ?, ?, ?)",
            (payload.node_id, payload.ts, filename, payload.trigger),
        )
        conn.commit()

        # --- 2. Run disease classifier ---
        disease_label, disease_conf = disease_clf.predict(str(filepath))

        # Delay update until all inferences are done

        # --- 3. Run pest mock detector ---
        pest_count, pest_conf = pest_det.detect(str(filepath))

        # --- 4. Fetch latest sensor data for this zone ---
        # Map cam node to sensor node: cam-01 → node-01
        sensor_node_id = payload.node_id.replace("cam-", "node-")
        row = conn.execute(
            "SELECT * FROM sensor_readings WHERE node_id = ? ORDER BY ts DESC LIMIT 1",
            (sensor_node_id,),
        ).fetchone()

        sensor_data = None
        gas_label, gas_conf = "unknown", 0.5
        if row:
            sensor_data = {
                "soil_moisture": row["soil_moisture"],
                "gas_voc": row["gas_voc"],
                "temp_c": row["temp_c"],
            }
            # --- 5. Run gas classifier ---
            gas_label, gas_conf = gas_clf.predict(
                row["gas_voc"], row["temp_c"]
            )

        # Update DB with all classification results
        conn.execute(
            "UPDATE images SET disease_label = ?, disease_conf = ?, pest_count = ?, pest_conf = ?, gas_label = ?, gas_conf = ? WHERE filename = ?",
            (disease_label, disease_conf, pest_count, pest_conf, gas_label, gas_conf, filename)
        )
        conn.commit()

        # --- 6. Run fusion ---
        fusion_result = fuse(
            disease_result=(disease_label, disease_conf),
            gas_result=(gas_label, gas_conf),
            pest_result=(pest_count, pest_conf),
            sensor_data=sensor_data,
        )

        # --- 7. Create alert if score warrants it ---
        alert_response = None
        if fusion_result["tier"] in ("auto_alert", "flag_review"):
            alert_id = f"a-{uuid.uuid4().hex[:6]}"
            image_url = f"/media/{filename}"
            alert_ts = int(time.time())

            conn.execute(
                """INSERT INTO alerts
                   (alert_id, type, confidence, field_zone, image_url,
                    recommended_action, ts, confirmed)
                   VALUES (?, ?, ?, ?, ?, ?, ?, NULL)""",
                (
                    alert_id,
                    fusion_result["alert_type"],
                    fusion_result["score"],
                    sensor_node_id,
                    image_url,
                    fusion_result["recommended_action"],
                    alert_ts,
                ),
            )
            conn.commit()

            alert_response = {
                "alert_id": alert_id,
                "type": fusion_result["alert_type"],
                "confidence": fusion_result["score"],
                "field_zone": sensor_node_id,
                "image_url": image_url,
                "recommended_action": fusion_result["recommended_action"],
                "ts": alert_ts,
            }

        return {
            "status": "ok",
            "filename": filename,
            "fusion": fusion_result,
            "alert": alert_response,
        }

    except HTTPException:
        raise
    except Exception as exc:
        print(f"[ingest] Image processing error: {exc}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc))


# ===========================  QUERY ROUTES  ================================

@app.get("/images/latest")
def get_latest_images(limit: int = 6):
    """Return the most recent processed images for the detections gallery."""
    try:
        conn = get_conn()
        rows = conn.execute(
            "SELECT * FROM images WHERE disease_label IS NOT NULL ORDER BY ts DESC LIMIT ?", 
            (limit,)
        ).fetchall()

        images = []
        for row in rows:
            images.append({
                "node_id": row["node_id"],
                "ts": row["ts"],
                "filename": row["filename"],
                "image_url": f"/media/{row['filename']}",
                "disease_label": row["disease_label"],
                "disease_conf": row["disease_conf"]
            })
        return {"images": images}
    except Exception as exc:
        print(f"[api] Images query error: {exc}")
        return {"images": []}

@app.get("/alerts/latest")
def get_latest_alerts(limit: int = 20):
    """Return the most recent alerts, newest first."""
    try:
        conn = get_conn()
        rows = conn.execute(
            "SELECT * FROM alerts ORDER BY ts DESC LIMIT ?", (limit,)
        ).fetchall()

        alerts = []
        for row in rows:
            alerts.append({
                "alert_id": row["alert_id"],
                "type": row["type"],
                "confidence": row["confidence"],
                "field_zone": row["field_zone"],
                "image_url": row["image_url"],
                "recommended_action": row["recommended_action"],
                "ts": row["ts"],
                "confirmed": row["confirmed"],
            })
        return {"alerts": alerts}

    except Exception as exc:
        print(f"[api] Alerts query error: {exc}")
        return {"alerts": []}


@app.get("/sensors/{node_id}/history")
def get_sensor_history(node_id: str, limit: int = 100):
    """Return recent sensor readings for a specific node."""
    try:
        conn = get_conn()
        rows = conn.execute(
            "SELECT * FROM sensor_readings WHERE node_id = ? ORDER BY ts DESC LIMIT ?",
            (node_id, limit),
        ).fetchall()

        readings = []
        for row in rows:
            readings.append({
                "node_id": row["node_id"],
                "ts": row["ts"],
                "soil_moisture": row["soil_moisture"],
                "npk": {"n": row["n"], "p": row["p"], "k": row["k"]},
                "gas_voc": row["gas_voc"],
                "temp_c": row["temp_c"],
            })

        # Return oldest-first for charting
        readings.reverse()
        return {"node_id": node_id, "readings": readings}

    except Exception as exc:
        print(f"[api] Sensor history error: {exc}")
        return {"node_id": node_id, "readings": []}


@app.get("/field/health")
def get_field_health():
    """
    Compute composite field health score across all zones.
    Uses the latest sensor reading per node + latest alerts.
    """
    try:
        conn = get_conn()

        # Get latest reading per node
        nodes = ["node-01", "node-02", "node-03", "node-04", "node-05"]
        zone_scores = []
        zone_details = []

        for node_id in nodes:
            row = conn.execute(
                "SELECT * FROM sensor_readings WHERE node_id = ? ORDER BY ts DESC LIMIT 1",
                (node_id,),
            ).fetchone()

            if row is None:
                zone_details.append({
                    "node_id": node_id,
                    "status": "no_data",
                    "health_score": 0.5,
                    "irrigation": "no data available",
                })
                zone_scores.append(0.5)
                continue

            sm = row["soil_moisture"]
            temp = row["temp_c"]
            voc = row["gas_voc"]

            # Simple health heuristic (inverted risk signals)
            sm_score = 1.0 - abs(sm - 0.45) * 2  # optimal ~0.45
            temp_score = 1.0 - max(0, (temp - 35) / 15)  # penalize >35
            voc_score = 1.0 - max(0, (voc - 200) / 400)  # penalize >200

            zone_health = max(0, min(1, (sm_score * 0.4 + temp_score * 0.3 + voc_score * 0.3)))
            zone_scores.append(zone_health)

            # Irrigation recommendation
            irr = irrigation_evaluate(sm, temp, voc)

            zone_details.append({
                "node_id": node_id,
                "status": "healthy" if zone_health > 0.6 else "warning" if zone_health > 0.35 else "critical",
                "health_score": round(zone_health, 3),
                "soil_moisture": round(sm, 3),
                "temp_c": round(temp, 1),
                "gas_voc": round(voc, 1),
                "npk": {"n": row["n"], "p": row["p"], "k": row["k"]},
                "irrigation": irr,
            })

        # Recent alert count
        recent_alerts = conn.execute(
            "SELECT COUNT(*) as cnt FROM alerts WHERE ts > ?",
            (int(time.time()) - 300,),  # last 5 minutes
        ).fetchone()["cnt"]

        composite = sum(zone_scores) / len(zone_scores) if zone_scores else 0.5

        return {
            "composite_score": round(composite, 3),
            "zone_count": len(nodes),
            "recent_alert_count": recent_alerts,
            "zones": zone_details,
        }

    except Exception as exc:
        print(f"[api] Field health error: {exc}")
        return {
            "composite_score": 0.5,
            "zone_count": 5,
            "recent_alert_count": 0,
            "zones": [],
        }


@app.post("/alerts/{alert_id}/confirm")
def confirm_alert(alert_id: str, payload: ConfirmPayload):
    """
    Record farmer verification of an alert (confirm or deny).
    Writes confirmed=1 or confirmed=0 to the DB.

    In the future, accumulated confirmations can be used to auto-tune
    the fusion engine weights via logistic regression.
    """
    try:
        conn = get_conn()
        val = 1 if payload.confirmed else 0
        cursor = conn.execute(
            "UPDATE alerts SET confirmed = ? WHERE alert_id = ?",
            (val, alert_id),
        )
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")

        return {"status": "ok", "alert_id": alert_id, "confirmed": payload.confirmed}

    except HTTPException:
        raise
    except Exception as exc:
        print(f"[api] Confirm error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/field/irrigation")
def get_irrigation():
    """Get irrigation recommendations for all zones."""
    try:
        conn = get_conn()
        nodes = ["node-01", "node-02", "node-03", "node-04", "node-05"]
        results = []

        for node_id in nodes:
            row = conn.execute(
                "SELECT * FROM sensor_readings WHERE node_id = ? ORDER BY ts DESC LIMIT 1",
                (node_id,),
            ).fetchone()

            if row:
                
                rec = irrigation_evaluate(row["soil_moisture"], row["temp_c"], row["gas_voc"])
                # check override
                over = conn.execute("SELECT override_state FROM irrigation_overrides WHERE node_id = ?", (node_id,)).fetchone()
                if over and over["override_state"] != "auto":
                    rec = over["override_state"]

                results.append({
                    "node_id": node_id,
                    "recommendation": rec,
                    "soil_moisture": row["soil_moisture"],
                    "temp_c": row["temp_c"],
                })
            else:
                results.append({
                    "node_id": node_id,
                    "recommendation": "no data available",
                    "soil_moisture": None,
                    "temp_c": None,
                })

        return {"zones": results}

    except Exception as exc:
        print(f"[api] Irrigation error: {exc}")
        return {"zones": []}



@app.get("/zones/{node_id}/detail")
def get_zone_detail(node_id: str):
    try:
        conn = get_conn()
        
        # Latest sensor reading
        sensor = conn.execute(
            "SELECT * FROM sensor_readings WHERE node_id = ? ORDER BY ts DESC LIMIT 1",
            (node_id,)
        ).fetchone()
        
        # Latest image
        cam_node_id = node_id.replace("node-", "cam-")
        image = conn.execute(
            "SELECT * FROM images WHERE node_id = ? ORDER BY ts DESC LIMIT 1",
            (cam_node_id,)
        ).fetchone()

        # Latest alert
        alert = conn.execute(
            "SELECT * FROM alerts WHERE field_zone = ? ORDER BY ts DESC LIMIT 1",
            (node_id,)
        ).fetchone()
        
        return {
            "node_id": node_id,
            "sensor": dict(sensor) if sensor else None,
            "image": dict(image) if image else None,
            "alert": dict(alert) if alert else None,
            "offline": simulated_offline
        }
    except Exception as exc:
        return {"error": str(exc)}

@app.get("/gas/{node_id}/history")
def get_gas_history(node_id: str, limit: int = 50):
    try:
        conn = get_conn()
        rows = conn.execute(
            "SELECT ts, gas_voc, temp_c FROM sensor_readings WHERE node_id = ? ORDER BY ts DESC LIMIT ?",
            (node_id, limit)
        ).fetchall()
        
        readings = [{"ts": r["ts"], "gas_voc": r["gas_voc"], "temp_c": r["temp_c"]} for r in rows]
        readings.reverse()
        return {"node_id": node_id, "history": readings}
    except Exception:
        return {"history": []}

@app.get("/fusion/{node_id}/breakdown")
def get_fusion_breakdown(node_id: str):
    try:
        conn = get_conn()
        # Fetch latest sensor & image to run fusion on the fly for the breakdown panel
        sensor = conn.execute(
            "SELECT * FROM sensor_readings WHERE node_id = ? ORDER BY ts DESC LIMIT 1",
            (node_id,)
        ).fetchone()
        
        cam_node_id = node_id.replace("node-", "cam-")
        image = conn.execute(
            "SELECT * FROM images WHERE node_id = ? ORDER BY ts DESC LIMIT 1",
            (cam_node_id,)
        ).fetchone()
        
        if not sensor or not image:
            return {"error": "Missing data for fusion"}
            
        sensor_data = {"soil_moisture": sensor["soil_moisture"], "gas_voc": sensor["gas_voc"], "temp_c": sensor["temp_c"]}
        disease_res = (image["disease_label"] or "healthy", image["disease_conf"] or 0.9)
        pest_res = (image["pest_count"] or 0, image["pest_conf"] or 0.9)
        gas_res = (image["gas_label"] or "normal", image["gas_conf"] or 0.9)
        
        res = fuse(disease_res, gas_res, pest_res, sensor_data)
        return {"node_id": node_id, "breakdown": res}
    except Exception as exc:
        return {"error": str(exc)}

@app.post("/irrigation/{node_id}/override")
def override_irrigation(node_id: str, payload: dict):
    try:
        state = payload.get("state", "auto")
        conn = get_conn()
        conn.execute(
            "INSERT OR REPLACE INTO irrigation_overrides (node_id, override_state, ts) VALUES (?, ?, ?)",
            (node_id, state, int(time.time()))
        )
        conn.commit()
        return {"status": "ok", "node_id": node_id, "override": state}
    except Exception as exc:
        return {"error": str(exc)}

@app.post("/system/offline-mode")
def set_offline_mode(payload: dict):
    global simulated_offline
    simulated_offline = payload.get("offline", False)
    return {"status": "ok", "offline": simulated_offline}

@app.get("/system/health")
def get_system_health():
    # Return status of all 5 nodes
    nodes = ["node-01", "node-02", "node-03", "node-04", "node-05"]
    conn = get_conn()
    statuses = []
    for n in nodes:
        row = conn.execute("SELECT ts FROM sensor_readings WHERE node_id = ? ORDER BY ts DESC LIMIT 1", (n,)).fetchone()
        if not row:
            statuses.append({"node_id": n, "status": "offline"})
        else:
            diff = time.time() - row["ts"]
            statuses.append({"node_id": n, "status": "online" if diff < 60 else "degraded"})
            
    return {"offline_simulation": simulated_offline, "nodes": statuses}



# ===========================  HEALTH CHECK  ================================

@app.get("/")
def root():
    return {"service": "AgriEdge API", "status": "running", "version": "0.1.0"}
