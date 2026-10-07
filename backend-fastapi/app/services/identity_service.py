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
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FaceVerification, KYCApplication

logger = logging.getLogger(__name__)


class FaceEngineUnavailableError(RuntimeError):
    """Raised when the DeepFace engine could not be imported."""


try:
    import sys as _sys
    import tensorflow.keras.layers  # noqa: F401
    _keras_layers = _sys.modules["tensorflow.keras.layers"]
    if not hasattr(_keras_layers, "LocallyConnected2D"):
        class _LocallyConnected2DPlaceholder:
            def __init__(self, *args, **kwargs):
                raise ImportError(
                    "LocallyConnected2D is unavailable under Keras 3; "
                    "the FbDeepFace model is not supported in this environment"
                )
        _keras_layers.LocallyConnected2D = _LocallyConnected2DPlaceholder  # type: ignore[attr-defined]
    from deepface import DeepFace
    DEEPFACE_IMPORT_ERROR: Optional[str] = None
except Exception as _deepface_import_error:  # pragma: no cover - environment dependent
    DeepFace = None  # type: ignore[assignment]
    DEEPFACE_IMPORT_ERROR = str(_deepface_import_error)
    logger.warning("DeepFace engine unavailable: %s", DEEPFACE_IMPORT_ERROR)


import threading

_face_lock = threading.Lock()
_haar_cascade = None


def _get_haar_cascade():
    global _haar_cascade
    if _haar_cascade is None:
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        _haar_cascade = cv2.CascadeClassifier(cascade_path)
    return _haar_cascade


class FaceVerificationService:
    """
    Manages strict face detection, cropping, and matching for identity verification.
    """

    MATCH_THRESHOLD = 0.40  # Facenet model distance threshold (<0.40 = match)
    MODEL = "Facenet"
    FALLBACK_MODEL = "VGG-Face"
    DETECTOR = "opencv"
    QUALITY_THRESHOLD = 0.25

    def __init__(self, match_threshold: float = 0.40):
        logger.info("Initializing FaceVerificationService with threshold=%.2f", match_threshold)
        self.match_threshold = match_threshold

    async def verify_face_match_async(
        self,
        selfie_path: str,
        id_document_path: str,
        kyc_application_id: str,
        session: Optional[AsyncSession] = None,
    ) -> FaceVerification:
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
        with _face_lock:
            selfie_quality = self._estimate_image_quality(selfie_path)
            id_quality = self._estimate_image_quality(id_document_path)
            logger.info("Image quality - selfie: %.2f, id: %.2f", selfie_quality, id_quality)

            if selfie_quality < self.QUALITY_THRESHOLD or id_quality < self.QUALITY_THRESHOLD:
                logger.warning("Image quality below minimum threshold (0.25), cannot verify face match")
                return (1.0, False)

            try:
                # 1. Strict face detection: must detect an actual face in BOTH images
                id_face_crop = self._detect_and_crop_face(id_document_path, label="ID document")
                selfie_face_crop = self._detect_and_crop_face(selfie_path, label="Selfie")

                # 2. Attempt DeepFace verification with face detection enforced
                if DeepFace is not None:
                    try:
                        result = DeepFace.verify(
                            img1_path=selfie_face_crop,
                            img2_path=id_face_crop,
                            model_name=self.MODEL,
                            detector_backend="skip",  # Already strictly detected & cropped by Haar
                            enforce_detection=False,
                        )
                        distance = float(result.get("distance", 0.65))
                        is_match = distance < self.match_threshold
                        logger.info("DeepFace comparison complete. Distance: %.4f, is_match: %s", distance, is_match)
                        return distance, is_match
                    except Exception as df_err:
                        logger.warning("DeepFace failed (%s), using structural feature comparison", df_err)

                # 3. Structural feature matcher fallback (ORB / edge gradients)
                distance, is_match = self._local_feature_compare(selfie_face_crop, id_face_crop)
                logger.info("Structural face comparison complete. Distance: %.4f, is_match: %s", distance, is_match)
                return distance, is_match

            except ValueError as ve:
                logger.warning("Face detection failed: %s", ve)
                return (1.0, False)
            except Exception as e:
                logger.error("Face verification error: %s", str(e), exc_info=True)
                return (1.0, False)

    def _local_feature_compare(self, img1: np.ndarray, img2: np.ndarray) -> Tuple[float, bool]:
        """
        Structural feature matching using ORB keypoint descriptors and grayscale edge correlation.
        Rejects non-faces, screenshots, and dissimilar individuals.
        """
        try:
            gray1 = cv2.cvtColor(cv2.resize(img1, (160, 160)), cv2.COLOR_BGR2GRAY)
            gray2 = cv2.cvtColor(cv2.resize(img2, (160, 160)), cv2.COLOR_BGR2GRAY)

            # Standardize lighting
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            gray1 = clahe.apply(gray1)
            gray2 = clahe.apply(gray2)

            # ORB Feature detector
            orb = cv2.ORB_create(nfeatures=500)
            kp1, des1 = orb.detectAndCompute(gray1, None)
            kp2, des2 = orb.detectAndCompute(gray2, None)

            if des1 is None or des2 is None or len(kp1) < 8 or len(kp2) < 8:
                logger.warning("Insufficient facial feature keypoints detected (kp1=%d, kp2=%d)", len(kp1) if kp1 else 0, len(kp2) if kp2 else 0)
                return 0.95, False

            bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
            matches = bf.match(des1, des2)
            matches = sorted(matches, key=lambda x: x.distance)

            # Good matches with tight Hamming distance
            good_matches = [m for m in matches if m.distance < 45.0]
            match_ratio = len(good_matches) / max(len(kp1), len(kp2), 1)

            # Edge structural correlation
            edges1 = cv2.Canny(gray1, 50, 150)
            edges2 = cv2.Canny(gray2, 50, 150)
            edge_sim = cv2.matchTemplate(edges1, edges2, cv2.TM_CCOEFF_NORMED)[0][0]
            edge_sim = max(0.0, float(edge_sim))

            combined_sim = (match_ratio * 0.6) + (edge_sim * 0.4)
            distance = round(max(0.0, min(1.0, 1.0 - combined_sim)), 4)
            is_match = distance < self.match_threshold and len(good_matches) >= 15

            return distance, is_match
        except Exception as e:
            logger.warning("Structural feature compare error: %s", e)
            return 0.95, False

    def _estimate_image_quality(self, image_path: str) -> float:
        image = cv2.imread(image_path)
        if image is None:
            return 0.0
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        blur_score = min(laplacian_var / 300.0, 1.0)
        brightness = gray.mean() / 255.0
        brightness_score = 1.0 - abs(brightness - 0.5) * 2
        h, w = gray.shape
        size_score = min((w * h) / (200 * 200), 1.0)
        quality = blur_score * 0.5 + brightness_score * 0.3 + size_score * 0.2
        return max(0.0, min(quality, 1.0))

    def _detect_and_crop_face(self, image_path: str, label: str = "Image") -> np.ndarray:
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Cannot load image: {image_path}")

        cascade = _get_haar_cascade()
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))

        if len(faces) == 0:
            # Stricter: never accept screenshots or non-face documents
            raise ValueError(f"No human face detected in {label}. Please provide a clear portrait photo.")

        # Pick largest detected face
        faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
        x, y, w, h = faces[0]

        # Add 15% margin
        pad_x, pad_y = int(w * 0.15), int(h * 0.15)
        y1 = max(0, y - pad_y)
        y2 = min(image.shape[0], y + h + pad_y)
        x1 = max(0, x - pad_x)
        x2 = min(image.shape[1], x + w + pad_x)
        face_crop = image[y1:y2, x1:x2]

        return face_crop


# Global face verification service instance
face_service = FaceVerificationService(match_threshold=0.40)
