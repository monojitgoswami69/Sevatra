"""Severity calculation schemas."""

from typing import Optional
from pydantic import BaseModel


class VitalSigns(BaseModel):
    heartRate: Optional[float] = None
    spo2: Optional[float] = None
    respRate: Optional[float] = None
    temperature: Optional[float] = None
    bpSystolic: Optional[float] = None
    bpDiastolic: Optional[float] = None


class SubScore(BaseModel):
    vital: str
    score: int
    maxScore: int = 3
    factor: Optional[str] = None


class SeverityResult(BaseModel):
    score: int
    condition: str  # Critical|Serious|Stable|Recovering
    wardRecommendation: str  # ICU|HDU|General
    riskFactors: list[str]
    summary: str
    breakdown: list[SubScore]
    percentage: int
    urgency: str  # immediate|urgent|routine|low
