"""Clinical note model."""

from datetime import datetime

from sqlalchemy import Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ClinicalNote(Base):
    __tablename__ = "clinical_notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    admission_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("admissions.id", ondelete="CASCADE"), nullable=False
    )
    doctor_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("staff.id", ondelete="CASCADE"), nullable=False
    )
    patient_name: Mapped[str] = mapped_column(String(255), nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # observation|prescription|discharge-summary|progress
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    # relationships
    admission = relationship("Admission", back_populates="clinical_notes_rel")
    doctor = relationship("Staff", back_populates="clinical_notes")
