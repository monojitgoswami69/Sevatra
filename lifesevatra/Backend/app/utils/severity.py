"""
Severity Score Calculator
=========================
Calculates patient severity scores based on vital signs.
Used for triage, ward allocation, and clinical decision support.

Score Range: 0-10 (sum of 5 sub-scores, each 0-3, capped at 10)
  0-2  Recovering  -> General ward
  3-4  Stable      -> General ward
  5-7  Serious     -> HDU
  8-10 Critical    -> ICU
"""

from __future__ import annotations

from typing import Optional


# ────────────────────── Normal Range Reference ──────────────────────

NORMAL_RANGES: dict[str, dict] = {
    "heartRate":   {"min": 60,   "max": 100,  "unit": "bpm",         "label": "Heart Rate"},
    "spo2":        {"min": 95,   "max": 100,  "unit": "%",           "label": "SpO2"},
    "respRate":    {"min": 12,   "max": 20,   "unit": "breaths/min", "label": "Respiratory Rate"},
    "temperature": {"min": 36.5, "max": 37.5, "unit": "°C",         "label": "Temperature"},
    "bpSystolic":  {"min": 90,   "max": 140,  "unit": "mmHg",       "label": "Systolic BP"},
    "bpDiastolic": {"min": 60,   "max": 90,   "unit": "mmHg",       "label": "Diastolic BP"},
}

VALIDATION_LIMITS: dict[str, tuple[float, float, str]] = {
    "heartRate":   (0,  300, "Heart rate must be between 0 and 300 bpm"),
    "spo2":        (0,  100, "SpO2 must be between 0 and 100%"),
    "respRate":    (0,  60,  "Respiratory rate must be between 0 and 60 breaths/min"),
    "temperature": (25, 45,  "Temperature must be between 25 and 45 C"),
    "bpSystolic":  (0,  300, "Systolic BP must be between 0 and 300 mmHg"),
    "bpDiastolic": (0,  200, "Diastolic BP must be between 0 and 200 mmHg"),
}


# ────────────────────── Sub-Score Calculators ──────────────────────

def _hr_score(hr: Optional[float]) -> dict:
    """Heart Rate - Normal: 60-100 bpm."""
    base = {"vital": "Heart Rate", "score": 0, "maxScore": 3}
    if not hr or hr <= 0:
        return base
    if hr < 40:
        return {**base, "score": 3, "factor": "Severe bradycardia (HR < 40)"}
    if hr < 50:
        return {**base, "score": 2, "factor": "Bradycardia (HR 40-50)"}
    if hr < 60:
        return {**base, "score": 1, "factor": "Mild bradycardia (HR 50-60)"}
    if hr <= 100:
        return base
    if hr <= 110:
        return {**base, "score": 1, "factor": "Mild tachycardia (HR 100-110)"}
    if hr <= 130:
        return {**base, "score": 2, "factor": "Tachycardia (HR 110-130)"}
    return {**base, "score": 3, "factor": "Severe tachycardia (HR > 130)"}


def _spo2_score(spo2: Optional[float]) -> dict:
    """Oxygen Saturation - Normal: 95-100%."""
    base = {"vital": "SpO2", "score": 0, "maxScore": 3}
    if not spo2 or spo2 <= 0:
        return base
    if spo2 < 85:
        return {**base, "score": 3, "factor": "Critical hypoxemia (SpO2 < 85%)"}
    if spo2 < 90:
        return {**base, "score": 2, "factor": "Severe hypoxemia (SpO2 85-90%)"}
    if spo2 < 94:
        return {**base, "score": 1, "factor": "Mild hypoxemia (SpO2 90-94%)"}
    return base


def _rr_score(rr: Optional[float]) -> dict:
    """Respiratory Rate - Normal: 12-20 breaths/min."""
    base = {"vital": "Respiratory Rate", "score": 0, "maxScore": 3}
    if not rr or rr <= 0:
        return base
    if rr < 8:
        return {**base, "score": 3, "factor": "Severe bradypnea (RR < 8)"}
    if rr < 12:
        return {**base, "score": 1, "factor": "Bradypnea (RR 8-12)"}
    if rr <= 20:
        return base
    if rr <= 24:
        return {**base, "score": 1, "factor": "Mild tachypnea (RR 20-24)"}
    if rr <= 30:
        return {**base, "score": 2, "factor": "Tachypnea (RR 24-30)"}
    return {**base, "score": 3, "factor": "Severe tachypnea (RR > 30)"}


def _temp_score(temp: Optional[float]) -> dict:
    """Temperature - Normal: 36.5-37.5 C."""
    base = {"vital": "Temperature", "score": 0, "maxScore": 3}
    if not temp or temp <= 0:
        return base
    if temp < 35:
        return {**base, "score": 3, "factor": "Severe hypothermia (T < 35 C)"}
    if temp < 36:
        return {**base, "score": 2, "factor": "Hypothermia (T 35-36 C)"}
    if temp < 36.5:
        return {**base, "score": 1, "factor": "Mild hypothermia (T 36-36.5 C)"}
    if temp <= 37.5:
        return base
    if temp <= 38:
        return {**base, "score": 1, "factor": "Low-grade fever (T 37.5-38 C)"}
    if temp <= 39:
        return {**base, "score": 2, "factor": "Fever (T 38-39 C)"}
    if temp <= 40:
        return {**base, "score": 2, "factor": "High fever (T 39-40 C)"}
    return {**base, "score": 3, "factor": "Critical hyperthermia (T > 40 C)"}


def _bp_score(sbp: Optional[float], dbp: Optional[float]) -> dict:
    """Blood Pressure - Normal SBP: 90-140, DBP: 60-90 mmHg."""
    base = {"vital": "Blood Pressure", "score": 0, "maxScore": 3}
    if not sbp or sbp <= 0:
        return base

    score = 0
    factors: list[str] = []

    # Systolic
    if sbp < 70:
        score += 3; factors.append("Critical hypotension (SBP < 70)")
    elif sbp < 90:
        score += 2; factors.append("Hypotension (SBP 70-90)")
    elif sbp < 100:
        score += 1; factors.append("Mild hypotension (SBP 90-100)")
    elif sbp > 180:
        score += 3; factors.append("Hypertensive crisis (SBP > 180)")
    elif sbp > 160:
        score += 2; factors.append("Severe hypertension (SBP 160-180)")
    elif sbp > 140:
        score += 1; factors.append("Hypertension (SBP 140-160)")

    # Diastolic
    if dbp and dbp > 0:
        if dbp < 40:
            score += 2; factors.append("Critical low DBP (< 40)")
        elif dbp < 60:
            score += 1; factors.append("Low DBP (40-60)")
        elif dbp > 110:
            score += 2; factors.append("Critical high DBP (> 110)")
        elif dbp > 90:
            score += 1; factors.append("High DBP (90-110)")

    return {
        **base,
        "score": min(score, 3),
        "factor": ", ".join(factors) if factors else None,
    }


# ──────────────────── Classification Helpers ──────────────────────

def _classify(score: int) -> dict:
    """Map final score to condition, ward, summary, and urgency."""
    if score >= 8:
        return {
            "condition": "Critical",
            "wardRecommendation": "ICU",
            "summary": "Patient requires immediate intensive care with continuous monitoring",
            "urgency": "immediate",
        }
    if score >= 5:
        return {
            "condition": "Serious",
            "wardRecommendation": "HDU",
            "summary": "Patient needs high-dependency care with frequent monitoring",
            "urgency": "urgent",
        }
    if score >= 3:
        return {
            "condition": "Stable",
            "wardRecommendation": "General",
            "summary": "Patient is stable and can be admitted to general ward",
            "urgency": "routine",
        }
    return {
        "condition": "Recovering",
        "wardRecommendation": "General",
        "summary": "Patient shows good vital signs and is recovering well",
        "urgency": "low",
    }


# ──────────────────── Main Calculator Function ────────────────────

def calculate_severity(
    heart_rate: Optional[float] = None,
    spo2: Optional[float] = None,
    resp_rate: Optional[float] = None,
    temperature: Optional[float] = None,
    bp_systolic: Optional[float] = None,
    bp_diastolic: Optional[float] = None,
) -> dict:
    """Calculate severity score and return a result dict.

    Returns the same shape as the frontend SeverityResult:
      score, condition, wardRecommendation, riskFactors, summary,
      breakdown (list of sub-scores), percentage, urgency
    """
    # Individual sub-scores
    breakdown = [
        _hr_score(heart_rate),
        _spo2_score(spo2),
        _rr_score(resp_rate),
        _temp_score(temperature),
        _bp_score(bp_systolic, bp_diastolic),
    ]

    # Collect risk factors
    risk_factors = [s["factor"] for s in breakdown if s.get("factor")]

    # Total capped at 10
    raw_total = sum(s["score"] for s in breakdown)
    final_score = min(raw_total, 10)

    # Classify
    classification = _classify(final_score)

    return {
        "score": final_score,
        "condition": classification["condition"],
        "wardRecommendation": classification["wardRecommendation"],
        "riskFactors": risk_factors,
        "summary": classification["summary"],
        "breakdown": breakdown,
        "percentage": final_score * 10,
        "urgency": classification["urgency"],
    }


# ────────────────────── Validation Helpers ────────────────────────

def validate_vitals(
    heart_rate: Optional[float] = None,
    spo2: Optional[float] = None,
    resp_rate: Optional[float] = None,
    temperature: Optional[float] = None,
    bp_systolic: Optional[float] = None,
    bp_diastolic: Optional[float] = None,
) -> dict:
    """Validate that vital values are within plausible ranges.

    Returns ``{"valid": True/False, "errors": [...]}``.
    """
    values = {
        "heartRate": heart_rate,
        "spo2": spo2,
        "respRate": resp_rate,
        "temperature": temperature,
        "bpSystolic": bp_systolic,
        "bpDiastolic": bp_diastolic,
    }
    errors: list[str] = []

    for key, (lo, hi, msg) in VALIDATION_LIMITS.items():
        val = values.get(key)
        if val is not None and (val < lo or val > hi):
            errors.append(msg)

    if bp_systolic is not None and bp_diastolic is not None:
        if bp_systolic < bp_diastolic:
            errors.append(
                "Systolic BP should be greater than or equal to diastolic BP"
            )

    return {"valid": len(errors) == 0, "errors": errors}


# ──────────────────────── Range Helpers ────────────────────────────

def get_normal_range(vital_type: str) -> str:
    """Return a human-readable normal range string, e.g. '60-100 bpm'."""
    r = NORMAL_RANGES.get(vital_type)
    if not r:
        return ""
    return f"{r['min']}-{r['max']} {r['unit']}"


def is_vital_normal(vital_type: str, value: float) -> bool:
    """Check if a single vital value falls within its normal range."""
    r = NORMAL_RANGES.get(vital_type)
    if not r:
        return True
    return r["min"] <= value <= r["max"]


def get_vital_deviation(vital_type: str, value: float) -> str:
    """Return 'low', 'normal', or 'high' for a vital value."""
    r = NORMAL_RANGES.get(vital_type)
    if not r:
        return "normal"
    if value < r["min"]:
        return "low"
    if value > r["max"]:
        return "high"
    return "normal"


# ──────────────────────── Trend Helpers ────────────────────────────

def get_severity_trend(
    previous: float, current: float, threshold: float = 0.5
) -> str:
    """Compare two severity scores; return 'improving', 'stable', or 'worsening'."""
    diff = current - previous
    if diff > threshold:
        return "worsening"
    if diff < -threshold:
        return "improving"
    return "stable"
