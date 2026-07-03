"""
KYC API Endpoints - FastAPI routes for KYC workflow.

Endpoints:
- POST /upload: Upload documents (citizenship, selfie).
- POST /verify: Verify face match between selfie and ID.
- GET /status: Retrieve KYC application status.
- GET /results: Get OCR and verification results.

All endpoints are async and use the SQLAlchemy async session.
"""

import logging
import os
import uuid
from typing import Optional

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models import KYCApplication, Document, OCRResult, FaceVerification, User
from app.db import get_async_session

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/kyc", tags=["kyc"])

# Lazy-load ML services to avoid startup dependency conflicts
ocr_service = None
face_service = None

def get_ocr_service():
    global ocr_service
    if ocr_service is None:
        from app.services.ocr_service import ocr_service as _ocr
        ocr_service = _ocr
    return ocr_service

def get_face_service():
    global face_service
    if face_service is None:
        from app.services.identity_service import face_service as _face
        face_service = _face
    return face_service


@router.post("/upload")
async def upload_documents(
    user_id: str,
    document_type: str,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_async_session),
) -> dict:
    """
    Upload a document (citizenship_front, citizenship_back, selfie) for KYC.

    Args:
        user_id (str): User ID (UUID).
        document_type (str): One of 'citizenship_front', 'citizenship_back', 'selfie', 'passport'.
        file (UploadFile): Image file to upload.

    Returns:
        dict: {
            "document_id": UUID,
            "kyc_application_id": UUID,
            "status": "PENDING",
            "message": "Document uploaded successfully"
        }

    Raises:
        HTTPException 400: Invalid document type or file.
        HTTPException 404: User not found.
        HTTPException 500: File storage or database error.
    """
    if document_type not in ["citizenship_front", "citizenship_back", "selfie", "passport"]:
        raise HTTPException(status_code=400, detail="Invalid document_type")

    if not file.filename or not file.filename.lower().endswith((".jpg", ".jpeg", ".png", ".gif")):
        raise HTTPException(status_code=400, detail="Only image files are supported")

    try:
        # Verify user exists
        user_result = await session.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get or create KYC application
        kyc_result = await session.execute(
            select(KYCApplication).where(
                (KYCApplication.user_id == user_id) & (KYCApplication.status == "PENDING")
            )
        )
        kyc_app = kyc_result.scalar_one_or_none()

        if not kyc_app:
            kyc_app = KYCApplication(
                id=uuid.uuid4(),
                user_id=user_id,
                status="PENDING",
                document_type=document_type,
            )
            session.add(kyc_app)
            await session.flush()
            logger.info("New KYC application created: %s for user %s", kyc_app.id, user_id)

        # Save file to uploads/kyc/<app_id>/<filename>
        upload_dir = os.path.join(settings.UPLOAD_DIR, str(kyc_app.id))
        os.makedirs(upload_dir, exist_ok=True)

        file_path = os.path.join(upload_dir, f"{uuid.uuid4()}_{file.filename}")
        contents = await file.read()

        with open(file_path, "wb") as f:
            f.write(contents)
        logger.info("File saved: %s", file_path)

        # Create document record
        document = Document(
            id=uuid.uuid4(),
            kyc_application_id=kyc_app.id,
            document_type=document_type,
            file_path=file_path,
            file_size=len(contents),
            mime_type=file.content_type or "image/jpeg",
        )
        session.add(document)
        await session.flush()

        # If citizenship document, trigger OCR asynchronously
        if document_type in ["citizenship_front", "citizenship_back"]:
            try:
                ocr_result = await get_ocr_service().process_document(
                    image_path=file_path,
                    kyc_application_id=str(kyc_app.id),
                    document_type=document_type,
                    session=session,
                )
                logger.info("OCR processing triggered for document: %s", document.id)
            except Exception as e:
                logger.error("OCR processing failed: %s", str(e))
                # Continue anyway - OCR failure doesn't block upload

        await session.commit()

        return {
            "document_id": str(document.id),
            "kyc_application_id": str(kyc_app.id),
            "status": kyc_app.status,
            "message": "Document uploaded successfully. Processing started.",
        }

    except Exception as e:
        await session.rollback()
        logger.error("Upload failed: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="File upload failed")


@router.post("/verify")
async def verify_face(
    kyc_application_id: str,
    selfie_path: str,
    id_document_path: str,
    session: AsyncSession = Depends(get_async_session),
) -> dict:
    """
    Verify face match between selfie and ID document.

    Args:
        kyc_application_id (str): KYC application ID.
        selfie_path (str): Path to the selfie image.
        id_document_path (str): Path to the ID document image.

    Returns:
        dict: {
            "verification_id": UUID,
            "is_match": bool,
            "distance": float,
            "status": "APPROVED" or "REJECTED",
            "message": "..."
        }

    Raises:
        HTTPException 404: KYC application not found.
        HTTPException 500: Face verification failed.
    """
    try:
        # Verify KYC application exists
        kyc_result = await session.execute(
            select(KYCApplication).where(KYCApplication.id == kyc_application_id)
        )
        kyc_app = kyc_result.scalar_one_or_none()
        if not kyc_app:
            raise HTTPException(status_code=404, detail="KYC application not found")

        # Perform face verification
        verification = await get_face_service().verify_face_match_async(
            selfie_path=selfie_path,
            id_document_path=id_document_path,
            kyc_application_id=kyc_application_id,
            session=session,
        )

        # Update KYC application status based on match
        if verification.is_match:
            kyc_app.status = "APPROVED"
            kyc_app.confidence_score = 1.0 - verification.distance
            message = "Face verified successfully. KYC approved."
        else:
            kyc_app.status = "REJECTED"
            kyc_app.confidence_score = 0.0
            message = "Face verification failed. KYC rejected."

        session.add(kyc_app)
        await session.commit()

        return {
            "verification_id": str(verification.id),
            "is_match": verification.is_match,
            "distance": verification.distance,
            "status": kyc_app.status,
            "message": message,
        }

    except Exception as e:
        await session.rollback()
        logger.error("Face verification failed: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Face verification failed")


@router.post("/ocr/citizenship")
async def ocr_citizenship(
    image_path: str = Body(...),
    document_type: str = Body(...),
) -> dict:
    """
    Extract OCR data from a citizenship document image (stateless).
    Accepts a file path to an image already on disk and returns extracted data.
    The caller (Express backend) is responsible for saving results to its own DB.

    Args:
        image_path (str): Absolute path to the image file on disk.
        document_type (str): Type of document ('citizenship_front', 'citizenship_back', etc.).

    Returns:
        dict: {
            "extracted_data": {...},
            "overall_confidence": float,
            "raw_text": str,
            "language_detected": str
        }

    Raises:
        HTTPException 400: Document type not supported or image not found.
        HTTPException 500: OCR processing failed.
    """
    try:
        result = await get_ocr_service().processor.process_image_async(image_path)
        return {
            "extracted_data": result["structured_data"],
            "overall_confidence": result["confidence_score"],
            "raw_text": result["raw_text"],
            "language_detected": result["language_detected"],
        }
    except FileNotFoundError:
        raise HTTPException(status_code=400, detail="Image file not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("OCR processing failed: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="OCR processing failed")


@router.post("/face/verify")
async def verify_face_stateless(
    citizenship_photo: str = Body(...),
    selfie_photo: str = Body(...),
) -> dict:
    """
    Verify face match between selfie and ID document photo (stateless).
    Accepts file paths to images already on disk and returns match results.
    The caller (Express backend) is responsible for saving results to its own DB.

    Args:
        citizenship_photo (str): Absolute path to the citizenship/ID document photo.
        selfie_photo (str): Absolute path to the selfie photo.

    Returns:
        dict: {
            "similarity_score": float,
            "status": "MATCH" | "POSSIBLE_MATCH" | "LOW_CONFIDENCE" | "MISMATCH",
            "recommendation": "APPROVE" | "REVIEW" | "REJECT"
        }

    Raises:
        HTTPException 400: Image file not found or face detection failed.
        HTTPException 500: Face verification failed.
    """
    try:
        face_svc = get_face_service()
        verification = await face_svc.verify_face_match_async(
            selfie_path=selfie_photo,
            id_document_path=citizenship_photo,
            kyc_application_id="stateless",
            session=None,
        )

        if verification.is_match:
            status = "MATCH"
            recommendation = "APPROVE"
        elif verification.distance < 0.5:
            status = "POSSIBLE_MATCH"
            recommendation = "REVIEW"
        elif verification.distance < 0.6:
            status = "LOW_CONFIDENCE"
            recommendation = "REVIEW"
        else:
            status = "MISMATCH"
            recommendation = "REJECT"

        similarity_score = max(0.0, 1.0 - verification.distance)

        return {
            "similarity_score": similarity_score,
            "status": status,
            "recommendation": recommendation,
        }
    except FileNotFoundError:
        raise HTTPException(status_code=400, detail="Image file not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Face verification failed: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Face verification failed")


@router.get("/status/{kyc_application_id}")
async def get_kyc_status(
    kyc_application_id: str,
    session: AsyncSession = Depends(get_async_session),
) -> dict:
    """
    Retrieve the current KYC application status.

    Args:
        kyc_application_id (str): KYC application ID.

    Returns:
        dict: {
            "kyc_application_id": UUID,
            "status": "PENDING" | "APPROVED" | "REJECTED",
            "confidence_score": float,
            "document_count": int,
            "ocr_results": [...],
            "face_verifications": [...],
            "created_at": ISO datetime,
            "updated_at": ISO datetime
        }

    Raises:
        HTTPException 404: KYC application not found.
    """
    try:
        result = await session.execute(
            select(KYCApplication).where(KYCApplication.id == kyc_application_id)
        )
        kyc_app = result.scalar_one_or_none()

        if not kyc_app:
            raise HTTPException(status_code=404, detail="KYC application not found")

        # Fetch related documents and results
        docs_result = await session.execute(
            select(Document).where(Document.kyc_application_id == kyc_application_id)
        )
        documents = docs_result.scalars().all()

        ocr_result = await session.execute(
            select(OCRResult).where(OCRResult.kyc_application_id == kyc_application_id)
        )
        ocr_results = ocr_result.scalars().all()

        face_result = await session.execute(
            select(FaceVerification).where(FaceVerification.kyc_application_id == kyc_application_id)
        )
        face_verifications = face_result.scalars().all()

        return {
            "kyc_application_id": str(kyc_app.id),
            "status": kyc_app.status,
            "confidence_score": kyc_app.confidence_score,
            "document_count": len(documents),
            "documents": [
                {
                    "id": str(doc.id),
                    "type": doc.document_type,
                    "uploaded_at": doc.uploaded_at.isoformat(),
                }
                for doc in documents
            ],
            "ocr_results": [
                {
                    "id": str(ocr.id),
                    "document_type": ocr.document_type,
                    "language_detected": ocr.language_detected,
                    "confidence_score": ocr.confidence_score,
                    "structured_data": ocr.structured_data,
                }
                for ocr in ocr_results
            ],
            "face_verifications": [
                {
                    "id": str(fv.id),
                    "is_match": fv.is_match,
                    "distance": fv.distance,
                    "verified_at": fv.verified_at.isoformat(),
                }
                for fv in face_verifications
            ],
            "created_at": kyc_app.created_at.isoformat(),
            "updated_at": kyc_app.updated_at.isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Status retrieval failed: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Status retrieval failed")
