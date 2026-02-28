"""Hospital model."""

from datetime import datetime

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Hospital(Base):
    __tablename__ = "hospitals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    hospital_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    contact: Mapped[str] = mapped_column(String(50), nullable=False)
    hospital_address: Mapped[str] = mapped_column(String(500), nullable=False)
    icu_beds: Mapped[int] = mapped_column(Integer, default=0)
    hdu_beds: Mapped[int] = mapped_column(Integer, default=0)
    general_beds: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    # relationships
    staff = relationship("Staff", back_populates="hospital", cascade="all, delete-orphan")
    beds = relationship("Bed", back_populates="hospital", cascade="all, delete-orphan")
    admissions = relationship("Admission", back_populates="hospital", cascade="all, delete-orphan")
