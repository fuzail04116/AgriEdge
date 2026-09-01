"""
AgriEdge — Disease Classifier (inference module)

Loads the trained RandomForestClassifier from backend/models/disease_clf.pkl
and exposes a predict(image_path) function for the ingest pipeline.

Feature extraction matches the training pipeline exactly:
  - 24-bin RGB color histogram (8 bins × 3 channels)
  - 3 GLCM texture statistics (contrast, homogeneity, energy)

NOTE: The model is trained on procedurally generated mock images.
Production version will train on PlantVillage + real field photographs.
"""

import os
import pickle
import numpy as np
from PIL import Image

# ---------------------------------------------------------------------------
# Model loading
# ---------------------------------------------------------------------------
_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "models", "disease_clf.pkl"
)
_model = None


def _load_model():
    """Load the disease classifier model, with clear error on failure."""
    global _model
    if _model is not None:
        return _model

    abs_path = os.path.abspath(_MODEL_PATH)
    if not os.path.isfile(abs_path):
        print(f"[disease] WARNING: Model file not found at {abs_path}")
        print("          Run  python ml_training/train_models.py  first.")
        return None

    try:
        with open(abs_path, "rb") as f:
            _model = pickle.load(f)
        print(f"[disease] Model loaded from {abs_path}")
        return _model
    except Exception as exc:
        print(f"[disease] ERROR loading model: {exc}")
        return None


# ---------------------------------------------------------------------------
# Feature extraction (must match training pipeline exactly)
# ---------------------------------------------------------------------------
def _extract_features(image_path: str) -> np.ndarray:
    """Extract 27-dim feature vector from a leaf image."""
    img = Image.open(image_path).convert("RGB").resize((64, 64))
    arr = np.array(img)

    # Color histogram: 8 bins × 3 channels = 24 features
    hist_features = []
    for ch in range(3):
        hist, _ = np.histogram(arr[:, :, ch], bins=8, range=(0, 256))
        hist = hist.astype(float) / (hist.sum() + 1e-8)
        hist_features.extend(hist)

    # GLCM texture: contrast, homogeneity, energy = 3 features
    try:
        from skimage.feature import graycomatrix, graycoprops
    except ImportError:
        from skimage.feature import greycomatrix as graycomatrix
        from skimage.feature import greycoprops as graycoprops

    gray = np.mean(arr, axis=2).astype(np.uint8)
    glcm = graycomatrix(gray, distances=[1], angles=[0],
                        levels=256, symmetric=True, normed=True)
    contrast = graycoprops(glcm, "contrast")[0, 0]
    homogeneity = graycoprops(glcm, "homogeneity")[0, 0]
    energy = graycoprops(glcm, "energy")[0, 0]

    return np.array(hist_features + [contrast, homogeneity, energy],
                    dtype=np.float64)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def predict(image_path: str) -> tuple:
    """
    Run disease classification on a leaf image.

    Returns:
        (label: str, confidence: float)
        label is "healthy", "diseased", or "unknown"
        confidence is 0.0–1.0
    """
    try:
        model = _load_model()
        if model is None:
            return ("unknown", 0.5)

        features = _extract_features(image_path).reshape(1, -1)
        proba = model.predict_proba(features)[0]
        pred_idx = int(np.argmax(proba))
        confidence = float(proba[pred_idx])

        labels = ["healthy", "diseased"]
        label = labels[pred_idx] if pred_idx < len(labels) else "unknown"

        return (label, confidence)

    except Exception as exc:
        print(f"[disease] Prediction error: {exc}")
        return ("unknown", 0.5)
