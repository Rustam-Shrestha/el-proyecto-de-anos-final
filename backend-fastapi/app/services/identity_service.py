"""
Identity Service - Face Verification and Matching.
"""
import asyncio
import logging
import os
import uuid
from pathlib import Path
from typing import Dict, Optional, Tuple

os.environ['TF_USE_LEGACY_KERAS'] = '1'

import cv2
import numpy as np
from deepface import DeepFace
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FaceVerification, KYCApplication

logger = logging.getLogger(__name__)


class FaceVerificationService:
    """
    Manages face detection, cropping, and matching for identity verification.
    """

    MATCH_THRESHOLD = 0.4  # Facenet model threshold (typical range: 0.3-0.5)
    MODEL = "Facenet"  # Faster than VGG-Face (~5-10s vs ~34s on CPU)
    DETECTOR = "opencv"  # Face detector backend

    def __init__(self, match_threshold: float = 0.4):
        """
        Initialize the face verification service.

        Args:
            match_threshold (float): Distance threshold for face match.
                For VGG-Face: < 0.4 is typically a match.
        """
        logger.info("Initializing FaceVerificationService with threshold=%.2f", match_threshold)
        self.match_threshold = match_threshold

    async def verify_face_match_async(
        self,
        selfie_path: str,
        id_document_path: str,
        kyc_application_id: str,
        session: Optional[AsyncSession] = None,
    ) -> FaceVerification:
        """
        Asynchronously verify face match between selfie and ID document.

        Workflow:
        1. Detect face in ID document and crop it.
        2. Compare cropped face with selfie using DeepFace.verify().
        3. Determine match/no-match based on distance threshold.
        4. Save result to database.

        Args:
            selfie_path (str): Path to the live selfie image.
            id_document_path (str): Path to the ID document image.
            kyc_application_id (str): ID of the KYC application.
            session (AsyncSession): SQLAlchemy async session.

        Returns:
            FaceVerification: Database record of the verification.

        Raises:
            FileNotFoundError: If either image file does not exist.
            ValueError: If faces cannot be detected or comparison fails.
        """
        if not Path(selfie_path).exists():
            raise FileNotFoundError(f"Selfie not found: {selfie_path}")
        if not Path(id_document_path).exists():
            raise FileNotFoundError(f"ID document not found: {id_document_path}")

        logger.info("Verifying face match: selfie=%s, id_doc=%s", selfie_path, id_document_path)

        loop = asyncio.get_event_loop()
        distance, is_match = await loop.run_in_executor(
            None,
            self._verify_face_match_sync,
            selfie_path,
            id_document_path,
        )

        # Save result to database (only if session is provided)
        verification = FaceVerification(
            id=uuid.uuid4(),
            kyc_application_id=kyc_application_id,
            selfie_path=selfie_path,
            id_document_path=id_document_path,
            distance=distance,
            is_match=is_match,
            model_used=self.MODEL,
        )

        if session is not None:
            session.add(verification)
            await session.flush()

        logger.info("Face verification complete: is_match=%s, distance=%.4f", is_match, distance)

        return verification

    def _verify_face_match_sync(self, selfie_path: str, id_document_path: str) -> Tuple[float, bool]:
        try:
            id_face_crop = self._detect_and_crop_face(id_document_path, label="ID document")
            logger.debug("Face detected and cropped from ID document")

            self._detect_and_crop_face(selfie_path, label="Selfie")
            logger.debug("Face detected in selfie")

            result = DeepFace.verify(
                img1_path=selfie_path,
                img2_path=id_face_crop,
                model_name=self.MODEL,
                detector_backend=self.DETECTOR,
                enforce_detection=True,
            )

            distance = result["distance"]
            is_match = distance < self.match_threshold

            logger.info("Face comparison complete. Distance: %.4f, is_match: %s", distance, is_match)
            return distance, is_match

        except Exception as e:
            logger.error("Face verification failed: %s", str(e), exc_info=True)
            raise ValueError(f"Face verification error: {str(e)}")

    def _detect_and_crop_face(self, image_path: str, label: str = "Image") -> np.ndarray:
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Cannot load image: {image_path}")

        try:
            face_crop = DeepFace.detectFace(
                img_path=image_path,
                enforce_detection=True,
                detector_backend=self.DETECTOR,
            )
            if face_crop is None:
                raise ValueError(f"No face detected in {label}: {image_path}")

            face_crop = (face_crop * 255).astype(np.uint8)

            logger.debug("Face detected from %s. Shape: %s", label, face_crop.shape)
            return face_crop

        except Exception as e:
            logger.error("Face detection failed for %s: %s", label, str(e))
            raise ValueError(f"Face detection failed: {str(e)}")


# Global face verification service instance
face_service = FaceVerificationService(match_threshold=0.4)
