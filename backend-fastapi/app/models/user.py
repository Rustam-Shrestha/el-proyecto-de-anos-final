"""
User Model - Represents system users.

Attributes:
    id (UUID): Primary key - unique identifier for user.
    email (str): Email address - unique, indexed for fast lookup.
    phone (str): Phone number - optional, supports international formats.
    name (str): Full name - supports UTF-8 for Devanagari and English mixed text.
    created_at (DateTime): Account creation timestamp.
    updated_at (DateTime): Last update timestamp.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    kyc_applications = relationship("KYCApplication", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, name={self.name})>"
