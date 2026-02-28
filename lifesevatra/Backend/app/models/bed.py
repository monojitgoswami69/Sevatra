"""Bed model."""

from datetime import datetime

from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Bed(Base):
    __tablename__ = "beds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    hospital_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False
    )
    bed_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)  # ICU-01, HDU-05, GEN-12
    bed_type: Mapped[str] = mapped_column(String(10), nullable=False)  # ICU|HDU|GENERAL
    bed_number: Mapped[int] = mapped_column(Integer, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    current_patient_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("admissions.id", ondelete="SET NULL"), nullable=True
    )
    last_occupied_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # relationships
    hospital = relationship("Hospital", back_populates="beds")
    current_patient = relationship("Admission", foreign_keys=[current_patient_id])
