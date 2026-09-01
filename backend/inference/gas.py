"""
AgriEdge — Gas-Anomaly Classifier (inference module)

Loads the trained RandomForestClassifier from backend/models/gas_clf.pkl
and exposes a predict(voc, temp_c, humidity) function.

Features: VOC reading, temperature (°C), humidity (%)

NOTE: Trained on synthetic sensor data. Production version will train
on logged readings from deployed ESP32 sensor nodes.
"""

import os
import pickle
import numpy as np

# ---------------------------------------------------------------------------
# Model loading
# ---------------------------------------------------------------------------
_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "models", "gas_clf.pkl"
)
_model = None


def _load_model():
    """Load the gas classifier model."""
    global _model
    if _model is not None:
        return _model

    abs_path = os.path.abspath(_MODEL_PATH)
    if not os.path.isfile(abs_path):
        print(f"[gas] WARNING: Model file not found at {abs_path}")
        print("      Run  python ml_training/train_models.py  first.")
        return None

    try:
        with open(abs_path, "rb") as f:
            _model = pickle.load(f)
        print(f"[gas] Model loaded from {abs_path}")
        return _model
    except Exception as exc:
        print(f"[gas] ERROR loading model: {exc}")
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def predict(voc: float, temp_c: float, humidity: float = 55.0) -> tuple:
    """
    Classify gas sensor readings as healthy or anomalous.

    Args:
        voc: Volatile organic compound reading
        temp_c: Temperature in Celsius
        humidity: Humidity percentage (default 55.0 if not available)

    Returns:
        (label: str, confidence: float)
        label is "healthy", "anomalous", or "unknown"
    """
    try:
        model = _load_model()
        if model is None:
            return ("unknown", 0.5)

        features = np.array([[voc, temp_c, humidity]], dtype=np.float64)
        proba = model.predict_proba(features)[0]
        pred_idx = int(np.argmax(proba))
        confidence = float(proba[pred_idx])

        labels = ["healthy", "anomalous"]
        label = labels[pred_idx] if pred_idx < len(labels) else "unknown"

        return (label, confidence)

    except Exception as exc:
        print(f"[gas] Prediction error: {exc}")
        return ("unknown", 0.5)
