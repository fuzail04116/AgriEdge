# AgriEdge — Smart Agriculture Monitoring System

## Architecture

AgriEdge is a smart-agriculture monitoring system that ingests sensor readings and leaf images from field nodes, runs ML-based disease/gas/pest inference, fuses results into composite confidence scores, and serves a real-time web dashboard for farm operators.

**This demo** replaces physical ESP32 sensor/camera nodes with a software simulator that speaks the exact same message protocol. Everything downstream — ingest → inference → fusion → API → dashboard — is real, production-shaped code.

```
Simulator (fake ESP32 nodes)
    │
    ├── POST /ingest/sensor   ──→  SQLite (sensor_readings)
    │                                    │
    └── POST /ingest/image    ──→  Save image → Disease Classifier
                                              → Pest Detector (mock)
                                              → Gas Classifier
                                              → Fusion Engine
                                              → Alert (if score > 0.50)
                                                    │
                                        FastAPI ←───┘
                                            │
                                     React Dashboard
                                     (polls every 3-5s)
```

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### Run Order (exact)

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Generate mock training dataset
python ml_training/generate_mock_dataset.py

# 3. Train ML models
python ml_training/train_models.py

# 4. Start the backend API server
uvicorn backend.api.main:app --reload --port 8000

# 5. In a new terminal, start the simulator
python simulator/run_simulator.py

# 6. In a new terminal, start the dashboard
cd dashboard && npm install && npm run dev

# 7. Open http://localhost:5173 — live data flows within ~10-20 seconds
```

## Key Design Decisions

- **HTTP POST** instead of MQTT broker — drop-in replaceable with Mosquitto later
- **scikit-learn** classifiers (not TensorFlow/PyTorch) — lightweight, fast, version-stable
- **SQLite** — zero setup, single file, good enough for demo + small deployments
- **Polling** (3-5s) instead of WebSockets — simpler, more reliable for demo
- **Mock dataset** — procedurally generated, placeholder for real PlantVillage/field data

## License

Hackathon demo — all rights reserved.
