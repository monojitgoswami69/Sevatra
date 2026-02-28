"""Admission (patient) model."""

from datetime import datetime

from sqlalchemy import (
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Admission(Base):
    __tablename__ = "admissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    hospital_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False
    )
    patient_name: Mapped[str] = mapped_column(String(255), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)  # male|female|other
    blood_group: Mapped[str | None] = mapped_column(String(10), nullable=True)
    emergency_contact: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    gov_id_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    id_picture_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    patient_picture_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Guardian
    guardian_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    guardian_relation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    guardian_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    guardian_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    whatsapp_number: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Bed & doctor assignment
    bed_id: Mapped[str] = mapped_column(String(20), nullable=False)  # ICU-01 etc.
    doctor_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("staff.id", ondelete="SET NULL"), nullable=True
    )
    doctor_name: Mapped[str] = mapped_column(String(255), default="Unassigned")

    admission_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    # Vitals (latest snapshot)
    heart_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    spo2: Mapped[float | None] = mapped_column(Float, nullable=True)
    resp_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    bp_systolic: Mapped[float | None] = mapped_column(Float, nullable=True)
    bp_diastolic: Mapped[float | None] = mapped_column(Float, nullable=True)
    measured_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Clinical
    presenting_ailment: Mapped[str | None] = mapped_column(Text, nullable=True)
    medical_history: Mapped[str | None] = mapped_column(Text, nullable=True)
    clinical_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    lab_results: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Severity
    severity_score: Mapped[int] = mapped_column(Integer, default=0)
    condition: Mapped[str] = mapped_column(String(20), default="Stable")  # Critical|Serious|Stable|Recovering

    # Status
    status: Mapped[str] = mapped_column(String(20), default="admitted")  # admitted|discharged
    discharge_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    discharged_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # relationships
    hospital = relationship("Hospital", back_populates="admissions")
    doctor_rel = relationship("Staff", back_populates="admissions", foreign_keys=[doctor_id])
    clinical_notes_rel = relationship(
        "ClinicalNote", back_populates="admission", cascade="all, delete-orphan"
    )
