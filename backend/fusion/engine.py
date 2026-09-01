"""
AgriEdge — Fusion Engine

Combines outputs from all inference modules into a single composite
confidence score and determines the alert tier.

Inputs:
  - Disease classifier: (label, confidence)
  - Gas classifier: (label, confidence)
  - Pest detector: (count, confidence)
  - Raw sensor readings: dict with soil_moisture, gas_voc, temp_c

Output:
  - Composite score (0.0–1.0)
  - Alert type string
  - Recommended action string
  - Alert tier: "auto_alert" | "flag_review" | "log_only"

Weight tuning:
  Hand-tuned weights are used — this is the "before we have enough logged
  data" approach described in the full implementation plan. Once farmer
  confirmations accumulate, these weights can be auto-tuned via logistic
  regression on confirmed vs. denied alerts.
"""


# ---------------------------------------------------------------------------
# Weights (hand-tuned for demo — see docstring above)
# ---------------------------------------------------------------------------
W_DISEASE = 0.45
W_GAS = 0.30
W_PEST = 0.25


def fuse(
    disease_result: tuple,
    gas_result: tuple,
    pest_result: tuple,
    sensor_data: dict | None = None,
) -> dict:
    """
    Fuse inference outputs into a composite alert decision.

    Args:
        disease_result: (label: str, confidence: float) from disease classifier
        gas_result: (label: str, confidence: float) from gas classifier
        pest_result: (pest_count: int, confidence: float) from pest detector
        sensor_data: optional dict with soil_moisture, gas_voc, temp_c

    Returns:
        dict with keys:
          score: float (0.0–1.0)
          alert_type: str
          recommended_action: str
          tier: str ("auto_alert" | "flag_review" | "log_only")
          details: dict of sub-scores
    """
    try:
        disease_label, disease_conf = disease_result
        gas_label, gas_conf = gas_result
        pest_count, pest_conf = pest_result

        # --- Disease contribution ---
        # If classified as diseased, the confidence is the threat signal
        # If classified as healthy, invert the signal (low threat)
        disease_score = disease_conf if disease_label == "diseased" else (1.0 - disease_conf)

        # --- Gas contribution ---
        gas_score = gas_conf if gas_label == "anomalous" else (1.0 - gas_conf)

        # --- Pest contribution ---
        # Scale pest count contribution (0 pests → 0.0, 10+ pests → 1.0)
        pest_count_factor = min(1.0, pest_count / 10.0)
        pest_score = (pest_count_factor * 0.6 + pest_conf * 0.4)

        # --- Sensor anomaly bonus ---
        # Add a small bonus if sensor readings are in worrying ranges
        sensor_bonus = 0.0
        if sensor_data:
            sm = sensor_data.get("soil_moisture", 0.5)
            voc = sensor_data.get("gas_voc", 100)
            temp = sensor_data.get("temp_c", 28)

            if sm < 0.15 or sm > 0.85:
                sensor_bonus += 0.05
            if voc > 400:
                sensor_bonus += 0.05
            if temp > 40:
                sensor_bonus += 0.03

        # --- Weighted composite ---
        composite = (
            W_DISEASE * disease_score +
            W_GAS * gas_score +
            W_PEST * pest_score +
            sensor_bonus
        )
        composite = max(0.0, min(1.0, composite))  # clamp

        # --- Determine alert type ---
        # Pick the dominant threat
        scores = {
            "fungal_disease": disease_score * W_DISEASE,
            "gas_anomaly": gas_score * W_GAS,
            "pest_detected": pest_score * W_PEST,
        }
        alert_type = max(scores, key=scores.get)

        # --- Tier ---
        if composite > 0.80:
            tier = "auto_alert"
            action = "immediate attention required"
        elif composite > 0.50:
            tier = "flag_review"
            action = "flag for verification"
        else:
            tier = "log_only"
            action = "logged — no action needed"

        return {
            "score": round(composite, 4),
            "alert_type": alert_type,
            "recommended_action": action,
            "tier": tier,
            "details": {
                "disease_score": round(disease_score, 4),
                "gas_score": round(gas_score, 4),
                "pest_score": round(pest_score, 4),
                "sensor_bonus": round(sensor_bonus, 4),
                "disease_label": disease_label,
                "gas_label": gas_label,
                "pest_count": pest_count,
            },
        }

    except Exception as exc:
        print(f"[fusion] Error: {exc}")
        return {
            "score": 0.5,
            "alert_type": "unknown",
            "recommended_action": "flag for verification",
            "tier": "flag_review",
            "details": {"error": str(exc)},
        }
