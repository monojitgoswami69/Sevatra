"""Schedule slot model."""

from datetime import datetime, date

from sqlalchemy import Integer, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ScheduleSlot(Base):
    __tablename__ = "schedule_slots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    doctor_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("staff.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    time: Mapped[str] = mapped_column(String(20), nullable=False)  # "08:00 AM"
    patient_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("admissions.id", ondelete="SET NULL"), nullable=True
    )
    patient_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # consultation|follow-up|procedure|rounds|break
    status: Mapped[str] = mapped_column(
        String(20), default="scheduled"
    )  # scheduled|completed|in-progress|cancelled|no-show
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # relationships
    doctor = relationship("Staff", back_populates="schedule_slots")
    patient = relationship("Admission", foreign_keys=[patient_id])
