"""Staff model."""

from datetime import datetime, date

from sqlalchemy import (
    Integer,
    String,
    Boolean,
    Date,
    DateTime,
    Numeric,
    ForeignKey,
    ARRAY,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Staff(Base):
    __tablename__ = "staff"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    hospital_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False
    )
    staff_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)  # doctor|surgeon|specialist|nurse
    specialty: Mapped[str] = mapped_column(String(255), nullable=False)
    qualification: Mapped[str | None] = mapped_column(String(255), nullable=True)
    experience_years: Mapped[int] = mapped_column(Integer, default=0)
    contact: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    on_duty: Mapped[bool] = mapped_column(Boolean, default=True)
    shift: Mapped[str] = mapped_column(String(20), default="day")  # day|night|rotating
    max_patients: Mapped[int] = mapped_column(Integer, default=10)
    current_patient_count: Mapped[int] = mapped_column(Integer, default=0)
    joined_date: Mapped[date] = mapped_column(Date, default=date.today)
    bio: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    languages: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    consultation_fee: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # relationships
    hospital = relationship("Hospital", back_populates="staff")
    admissions = relationship("Admission", back_populates="doctor_rel", foreign_keys="Admission.doctor_id")
    clinical_notes = relationship("ClinicalNote", back_populates="doctor", cascade="all, delete-orphan")
    schedule_slots = relationship("ScheduleSlot", back_populates="doctor", cascade="all, delete-orphan")
