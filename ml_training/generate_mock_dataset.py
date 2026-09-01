"""
AgriEdge — Mock Dataset Generator

Generates two synthetic datasets for training the demo ML models:

1. Leaf images (64×64 PNG):
   - 100 "healthy" leaves: green tones with vein-like patterns
   - 100 "diseased" leaves: green base + brown/yellow spots and discoloration
   Saved to  ml_training/data/leaf_images/{healthy,diseased}/

2. Gas sensor readings (CSV):
   - 500 rows: VOC, temp_c, humidity features
   - ~250 "healthy" baseline + ~250 "anomalous" spike patterns
   Saved to  ml_training/data/gas_data.csv

NOTE: This is explicitly a placeholder for the real PlantVillage / IP102
field-data pipeline described in the full implementation plan. The synthetic
images are simple geometric approximations — not photographs — and exist
solely to prove the end-to-end inference pipeline works.

All random generation is seeded for reproducibility.
"""

import os
import sys
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# ---------------------------------------------------------------------------
# Reproducibility
# ---------------------------------------------------------------------------
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

# ---------------------------------------------------------------------------
# Paths (relative to project root)
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "data")
LEAF_DIR = os.path.join(DATA_DIR, "leaf_images")
HEALTHY_DIR = os.path.join(LEAF_DIR, "healthy")
DISEASED_DIR = os.path.join(LEAF_DIR, "diseased")
GAS_CSV = os.path.join(DATA_DIR, "gas_data.csv")

IMG_SIZE = 64
N_HEALTHY = 100
N_DISEASED = 100
N_GAS_SAMPLES = 500


# ===========================  LEAF IMAGE GEN  ==============================

def _random_green():
    """Return a random green-ish RGB tuple."""
    return (
        random.randint(30, 80),
        random.randint(120, 200),
        random.randint(20, 70),
    )


def _draw_veins(draw, size):
    """Draw vein-like lines on the leaf."""
    cx, cy = size // 2, size // 2
    for _ in range(random.randint(4, 8)):
        ex = random.randint(5, size - 5)
        ey = random.randint(5, size - 5)
        vein_color = (
            random.randint(20, 60),
            random.randint(80, 140),
            random.randint(15, 50),
        )
        draw.line([(cx, cy), (ex, ey)], fill=vein_color, width=1)


def _generate_healthy_leaf() -> Image.Image:
    """Create a synthetic healthy leaf image."""
    img = Image.new("RGB", (IMG_SIZE, IMG_SIZE), _random_green())
    draw = ImageDraw.Draw(img)

    # Slight gradient / texture via random rectangles
    for _ in range(random.randint(8, 15)):
        x0 = random.randint(0, IMG_SIZE - 10)
        y0 = random.randint(0, IMG_SIZE - 10)
        x1 = x0 + random.randint(5, 20)
        y1 = y0 + random.randint(5, 20)
        draw.rectangle([x0, y0, x1, y1], fill=_random_green())

    _draw_veins(draw, IMG_SIZE)
    img = img.filter(ImageFilter.GaussianBlur(radius=1))
    return img


def _generate_diseased_leaf() -> Image.Image:
    """Create a synthetic diseased leaf image with spots and discoloration."""
    img = _generate_healthy_leaf()
    draw = ImageDraw.Draw(img)

    # Brown / yellow disease spots
    n_spots = random.randint(5, 15)
    for _ in range(n_spots):
        cx = random.randint(5, IMG_SIZE - 5)
        cy = random.randint(5, IMG_SIZE - 5)
        r = random.randint(2, 7)
        # Brownish or yellowish spot
        if random.random() < 0.6:
            spot_color = (
                random.randint(120, 180),
                random.randint(80, 130),
                random.randint(10, 50),
            )
        else:
            spot_color = (
                random.randint(180, 230),
                random.randint(180, 220),
                random.randint(20, 60),
            )
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=spot_color)

    # Optionally add a larger discolored patch
    if random.random() < 0.5:
        px = random.randint(10, IMG_SIZE - 20)
        py = random.randint(10, IMG_SIZE - 20)
        pw = random.randint(10, 25)
        ph = random.randint(10, 25)
        patch_color = (
            random.randint(140, 200),
            random.randint(120, 170),
            random.randint(20, 60),
        )
        draw.rectangle([px, py, px + pw, py + ph], fill=patch_color)

    img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
    return img


def generate_leaf_images():
    """Generate and save synthetic leaf images."""
    os.makedirs(HEALTHY_DIR, exist_ok=True)
    os.makedirs(DISEASED_DIR, exist_ok=True)

    for i in range(N_HEALTHY):
        img = _generate_healthy_leaf()
        img.save(os.path.join(HEALTHY_DIR, f"healthy_{i:03d}.png"))

    for i in range(N_DISEASED):
        img = _generate_diseased_leaf()
        img.save(os.path.join(DISEASED_DIR, f"diseased_{i:03d}.png"))

    print(f"[dataset] Generated {N_HEALTHY} healthy + {N_DISEASED} diseased leaf images")
    print(f"          -> {LEAF_DIR}")


# ===========================  GAS SENSOR GEN  ==============================

def generate_gas_data():
    """Generate synthetic gas sensor readings and save as CSV."""
    os.makedirs(DATA_DIR, exist_ok=True)

    rows = []
    n_healthy = N_GAS_SAMPLES // 2
    n_anomalous = N_GAS_SAMPLES - n_healthy

    # Healthy baseline: VOC 50-200, temp 22-35, humidity 40-70
    for _ in range(n_healthy):
        voc = np.random.normal(120, 30)
        temp = np.random.normal(28, 3)
        humidity = np.random.normal(55, 8)
        rows.append((max(voc, 10), max(temp, 15), max(humidity, 20), 0))

    # Anomalous: VOC 300-800, temp may be higher, humidity erratic
    for _ in range(n_anomalous):
        voc = np.random.normal(500, 100)
        temp = np.random.normal(34, 5)
        humidity = np.random.normal(45, 15)
        rows.append((max(voc, 100), max(temp, 15), max(humidity, 10), 1))

    # Shuffle
    np.random.shuffle(rows)

    # Write CSV
    import csv
    with open(GAS_CSV, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["voc", "temp_c", "humidity", "label"])
        for row in rows:
            writer.writerow(row)

    print(f"[dataset] Generated {N_GAS_SAMPLES} gas sensor samples")
    print(f"          -> {GAS_CSV}")


# ===========================  MAIN  ========================================

def main():
    print("=" * 60)
    print("AgriEdge — Mock Dataset Generator")
    print("=" * 60)

    try:
        generate_leaf_images()
        generate_gas_data()
        print()
        print("[dataset] OK: All datasets generated successfully.")
    except Exception as exc:
        print(f"\n[dataset] FAIL: ERROR: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
