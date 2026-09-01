"""
AgriEdge — Irrigation Rule Engine

Pure Python threshold-based rules for irrigation recommendations.
No ML — this is a deterministic rule engine operating on the latest
sensor readings per zone.

Rules:
  - soil_moisture < 0.25  → "irrigate now — soil critically dry"
  - soil_moisture > 0.75  → "reduce irrigation — soil oversaturated"
  - temp_c > 38           → "heat stress warning — increase watering frequency"
  - temp_c < 5            → "frost risk — protect crops"
  - gas_voc > 400         → "high VOC — check for chemical contamination"
  - otherwise             → "conditions normal — maintain schedule"
"""


def evaluate(soil_moisture: float, temp_c: float,
             gas_voc: float = 100.0) -> str:
    """
    Evaluate irrigation / environmental rules for a single zone.

    Args:
        soil_moisture: 0.0–1.0 (fraction)
        temp_c: temperature in Celsius
        gas_voc: VOC reading (ppm equivalent)

    Returns:
        Human-readable recommendation string
    """
    recommendations = []

    try:
        # --- Soil moisture rules ---
        if soil_moisture < 0.15:
            recommendations.append("CRITICAL: irrigate immediately — soil extremely dry")
        elif soil_moisture < 0.25:
            recommendations.append("irrigate now — soil moisture below safe threshold")
        elif soil_moisture > 0.85:
            recommendations.append("CRITICAL: halt irrigation — risk of root waterlogging")
        elif soil_moisture > 0.75:
            recommendations.append("reduce irrigation — soil oversaturated")

        # --- Temperature rules ---
        if temp_c > 42:
            recommendations.append("CRITICAL: extreme heat — emergency cooling needed")
        elif temp_c > 38:
            recommendations.append("heat stress warning — increase watering frequency")
        elif temp_c < 2:
            recommendations.append("CRITICAL: frost imminent — activate crop protection")
        elif temp_c < 5:
            recommendations.append("frost risk — monitor closely")

        # --- Gas VOC rules ---
        if gas_voc > 600:
            recommendations.append("CRITICAL: very high VOC — possible contamination event")
        elif gas_voc > 400:
            recommendations.append("high VOC detected — investigate source")

        # --- Default ---
        if not recommendations:
            recommendations.append("conditions normal — maintain current schedule")

    except Exception as exc:
        recommendations.append(f"rule evaluation error: {exc}")

    return "; ".join(recommendations)
