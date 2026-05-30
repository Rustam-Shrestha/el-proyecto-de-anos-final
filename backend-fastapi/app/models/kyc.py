"""
KYCApplication Model - Represents a KYC (Know Your Customer) application.

This is the primary entity coordinating the entire KYC workflow.

Attributes:
    id (UUID): Primary key.
    user_id (UUID): Foreign key to User.
    status (str): One of PENDING, APPROVED, REJECTED.
    document_type (str): e.g., 'citizenship', 'passport'.
    feature_vector (JSONB): Extracted biometric features (64-D vector from DeepFace).
    confidence_score (float): Overall confidence in the KYC result (0.0-1.0).
    created_at (DateTime): Application start time.
    updated_at (DateTime): Last status change.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import Base


class KYCApplication(Base):
    __tablename__ = "kyc_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, APPROVED, REJECTED
    document_type = Column(String(50), nullable=False)  # citizenship, passport
    feature_vector = Column(JSONB, nullable=True)  # 64-D vector from DeepFace VGG-Face model
    confidence_score = Column(Float, default=0.0, nullable=False)  # 0.0-1.0
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="kyc_applications")
    documents = relationship("Document", back_populates="kyc_application", cascade="all, delete-orphan")
    ocr_results = relationship("OCRResult", back_populates="kyc_application", cascade="all, delete-orphan")
    face_verifications = relationship("FaceVerification", back_populates="kyc_application", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<KYCApplication(id={self.id}, user_id={self.user_id}, status={self.status})>"
