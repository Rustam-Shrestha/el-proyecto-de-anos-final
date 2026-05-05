"""
OCRResult Model - Stores OCR extraction results from documents.

Designed for mixed-script (Devanagari + English) document processing.

Attributes:
    id (UUID): Primary key.
    kyc_application_id (UUID): Foreign key to KYCApplication.
    document_type (str): Type of document (citizenship_front, citizenship_back).
    raw_text (str): Complete unstructured text extracted by PaddleOCR.
    structured_data (JSONB): Mapped key-value pairs from fuzzy matching.
        Example: {
            "name": "राज कुमार",
            "surname": "शर्मा",
            "dob": "2000-01-15",
            "citizenship_number": "12345678"
        }
    confidence_score (float): Overall OCR confidence (0.0-1.0).
    language_detected (str): Detected language (hi for Devanagari, en for English, mixed).
    processed_at (DateTime): When OCR was performed.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import Base


class OCRResult(Base):
    __tablename__ = "ocr_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kyc_application_id = Column(UUID(as_uuid=True), ForeignKey("kyc_applications.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(50), nullable=False)  # citizenship_front, citizenship_back
    raw_text = Column(Text, nullable=False)  # Complete unstructured OCR output
    structured_data = Column(JSONB, nullable=False)  # Mapped {key: value} pairs
    confidence_score = Column(Float, default=0.0, nullable=False)  # 0.0-1.0
    language_detected = Column(String(20), nullable=False)  # hi, en, mixed
    processed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    kyc_application = relationship("KYCApplication", back_populates="ocr_results")

    def __repr__(self):
        return f"<OCRResult(id={self.id}, document_type={self.document_type}, language={self.language_detected})>"
