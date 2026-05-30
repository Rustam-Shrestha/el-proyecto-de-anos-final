"""
Document Model - Represents uploaded documents (citizenship, passport, etc.).

Attributes:
    id (UUID): Primary key.
    kyc_application_id (UUID): Foreign key to KYCApplication.
    document_type (str): Type of document (citizenship_front, citizenship_back, passport, selfie).
    file_path (str): Relative path to the stored file in uploads/kyc/.
    file_size (int): Size in bytes.
    mime_type (str): MIME type of the file (image/jpeg, image/png).
    uploaded_at (DateTime): Upload timestamp.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kyc_application_id = Column(UUID(as_uuid=True), ForeignKey("kyc_applications.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(50), nullable=False)  # citizenship_front, citizenship_back, passport, selfie
    file_path = Column(String(255), nullable=False)  # relative path: uploads/kyc/<app_id>/<filename>
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(50), nullable=False)  # image/jpeg, image/png
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    kyc_application = relationship("KYCApplication", back_populates="documents")

    def __repr__(self):
        return f"<Document(id={self.id}, document_type={self.document_type}, file_path={self.file_path})>"
