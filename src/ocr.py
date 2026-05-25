"""
RxLens OCR Layer — Split Pipeline
==================================
Priority order:
1. OCR.Space free API (25 000 calls/month, no install needed)
2. pytesseract (if installed locally)
3. Return None → caller falls back to full Gemini Vision (current behaviour)

This means the existing behaviour is NEVER broken — we just add a fast
cheaper path in front of the expensive VLM call.
"""

import io
import os
import logging
import requests
from PIL import Image

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────

def extract_text_from_image(image: Image.Image) -> str | None:
    """
    Try to extract raw text from a prescription image using cheap OCR.
    Returns the extracted string, or None if all OCR methods fail
    (caller should then fall back to full Gemini Vision).
    """
    # 1. OCR.Space (free, HTTP, no install)
    text = _ocr_space(image)
    if text and len(text.strip()) > 20:
        logger.info("OCR: OCR.Space succeeded (%d chars)", len(text))
        return text.strip()

    # 2. Local Tesseract via pytesseract
    text = _pytesseract(image)
    if text and len(text.strip()) > 20:
        logger.info("OCR: pytesseract succeeded (%d chars)", len(text))
        return text.strip()

    logger.warning("OCR: All lightweight methods failed — falling back to Gemini Vision")
    return None


# ─────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────

def _image_to_bytes(image: Image.Image, fmt: str = "PNG") -> bytes:
    buf = io.BytesIO()
    img = image.convert("RGB")
    img.save(buf, format=fmt)
    return buf.getvalue()


def _ocr_space(image: Image.Image) -> str | None:
    """
    OCR.Space free tier — https://ocr.space/OCRAPI
    Free API key: 'helloworld' works for demos (25k/month).
    Set OCR_SPACE_API_KEY env var for production.
    """
    try:
        api_key = os.getenv("OCR_SPACE_API_KEY", "helloworld")
        img_bytes = _image_to_bytes(image, "PNG")

        response = requests.post(
            "https://api.ocr.space/parse/image",
            files={"filename": ("prescription.png", img_bytes, "image/png")},
            data={
                "apikey": api_key,
                "language": "eng",
                "isOverlayRequired": "false",
                "detectOrientation": "true",
                "scale": "true",
                "OCREngine": "2",        # Engine 2 = better handwriting
            },
            timeout=15,
        )
        response.raise_for_status()
        result = response.json()

        if result.get("IsErroredOnProcessing"):
            logger.warning("OCR.Space error: %s", result.get("ErrorMessage"))
            return None

        parsed_results = result.get("ParsedResults", [])
        if parsed_results:
            return parsed_results[0].get("ParsedText", "")
        return None

    except Exception as exc:
        logger.warning("OCR.Space failed: %s", exc)
        return None


def _pytesseract(image: Image.Image) -> str | None:
    """Local Tesseract — only used if pytesseract is installed."""
    try:
        import pytesseract  # optional dependency
        # Pre-process: greyscale + slight upscale improves accuracy
        grey = image.convert("L")
        w, h = grey.size
        if w < 1000:
            grey = grey.resize((w * 2, h * 2), Image.LANCZOS)
        text = pytesseract.image_to_string(grey, config="--psm 6")
        return text
    except ImportError:
        return None
    except Exception as exc:
        logger.warning("pytesseract failed: %s", exc)
        return None
