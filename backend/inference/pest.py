"""
AgriEdge — Pest Detector (mock / placeholder)

IMPORTANT: This is NOT a trained object detector. It is a deterministic
placeholder scoring function that returns a plausible pest-count and
confidence from basic image statistics (dark blob counting via thresholding).

The production version will use a YOLO-based object detector trained on
the IP102 insect pest dataset. This placeholder exists solely to prove
the fusion pipeline works end-to-end for the hackathon demo.

Do NOT present this to the jury as a trained detector — see docs/jury_notes.md
for the exact honest phrasing.
"""

import os
import numpy as np
from PIL import Image


def detect(image_path: str) -> tuple:
    """
    Mock pest detection via simple dark-blob counting.

    Opens the image, converts to grayscale, applies a threshold to find
    dark regions, counts connected blobs, and returns a heuristic
    pest count + confidence score.

    Args:
        image_path: Path to the leaf/field image

    Returns:
        (pest_count: int, confidence: float)
        pest_count: estimated number of pest-like blobs
        confidence: heuristic score 0.0–1.0
    """
    try:
        if not os.path.isfile(image_path):
            return (0, 0.1)

        img = Image.open(image_path).convert("L").resize((64, 64))
        arr = np.array(img, dtype=np.float64)

        # Threshold: pixels darker than mean - 1.5*std are "dark blobs"
        mean_val = arr.mean()
        std_val = arr.std() + 1e-8
        threshold = mean_val - 1.5 * std_val
        dark_mask = (arr < threshold).astype(np.uint8)

        # Count dark pixels as a proxy for "pest-like" features
        dark_pixel_count = int(dark_mask.sum())
        total_pixels = arr.size

        # Heuristic: fraction of dark pixels → pest count estimate
        dark_fraction = dark_pixel_count / total_pixels
        pest_count = max(0, int(dark_fraction * 20))  # scale to 0–20 range

        # Confidence is low-ish because this is just a heuristic
        # Maps dark_fraction to ~0.2–0.7 range
        confidence = min(0.7, 0.2 + dark_fraction * 2.0)

        return (pest_count, round(confidence, 3))

    except Exception as exc:
        print(f"[pest] Detection error: {exc}")
        return (0, 0.1)
