"""
FaceVerification Model - Stores results of face matching between selfie and ID document.

Uses DeepFace VGG-Face model for comparison.
Threshold for match: distance < 0.4 (tuned for VGG-Face model).

Attributes:
    id (UUID): Primary key.
    kyc_application_id (UUID): Foreign key to KYCApplication.
    selfie_path (str): Path to the live selfie image.
    id_document_path (str): Path to the face cropped from ID document.
    distance (float): Euclidean distance between embeddings (0.0 = identical, higher = more different).
    is_match (bool): True if distance < 0.4, False otherwise.
    model_used (str): DeepFace model used (vggface, facenet, etc.).
    verified_at (DateTime): Verification timestamp.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base


class FaceVerification(Base):
    __tablename__ = "face_verifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kyc_application_id = Column(UUID(as_uuid=True), ForeignKey("kyc_applications.id", ondelete="CASCADE"), nullable=False, index=True)
    selfie_path = Column(String(255), nullable=False)
    id_document_path = Column(String(255), nullable=False)
    distance = Column(Float, nullable=False)  # 0.0 = identical, higher = more different
    is_match = Column(Boolean, default=False, nullable=False)  # True if distance < 0.4
    model_used = Column(String(50), default="vggface", nullable=False)  # vggface, facenet, etc.
    verified_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    kyc_application = relationship("KYCApplication", back_populates="face_verifications")

    def __repr__(self):
        return f"<FaceVerification(id={self.id}, is_match={self.is_match}, distance={self.distance:.4f})>"
