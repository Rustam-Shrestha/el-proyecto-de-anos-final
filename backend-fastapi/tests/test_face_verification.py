"""
Face Verification Unit Test Suite

Tests:
1. Non-face image / screenshot rejection (is_match = False, distance = 1.0).
2. Quality estimation.
3. Strict face detection error raising.
"""

import unittest
import numpy as np
import cv2
import tempfile
from pathlib import Path

from app.services.identity_service import FaceVerificationService


class TestFaceVerification(unittest.TestCase):
    def setUp(self):
        self.service = FaceVerificationService(match_threshold=0.40)
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_path = Path(self.temp_dir.name)

    def tearDown(self):
        self.temp_dir.cleanup()

    def _create_synthetic_screenshot(self, filename: str) -> str:
        """Create a synthetic image representing a file explorer screenshot (grid of rectangles, no face)."""
        img = np.ones((600, 800, 3), dtype=np.uint8) * 240
        # Draw some mock windows explorer rectangles
        cv2.rectangle(img, (50, 50), (200, 150), (200, 200, 200), -1)
        cv2.rectangle(img, (250, 50), (400, 150), (200, 200, 200), -1)
        cv2.putText(img, "Folder Items", (60, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (50, 50, 50), 1)
        filepath = str(self.temp_path / filename)
        cv2.imwrite(filepath, img)
        return filepath

    def test_non_face_screenshot_rejection(self):
        """Screenshots of windows explorer or files must fail face detection and return is_match=False."""
        screenshot1 = self._create_synthetic_screenshot("screenshot1.png")
        screenshot2 = self._create_synthetic_screenshot("screenshot2.png")

        distance, is_match = self.service._verify_face_match_sync(screenshot1, screenshot2)
        self.assertFalse(is_match, "Non-face screenshots must never match as a human face")
        self.assertEqual(distance, 1.0)

    def test_detect_and_crop_face_raises_on_no_face(self):
        """_detect_and_crop_face should raise ValueError when no face is present."""
        screenshot = self._create_synthetic_screenshot("no_face.png")
        with self.assertRaises(ValueError):
            self.service._detect_and_crop_face(screenshot, label="Test Document")


if __name__ == "__main__":
    unittest.main()
