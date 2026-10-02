"""Route aggregator - exports all route modules for centralized access."""

from app.routes import kyc, financial_ocr

__all__ = ["kyc", "financial_ocr"]
