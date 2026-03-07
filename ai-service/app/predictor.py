"""
DNN predictor — loads MobileNetV2 classifier at startup and runs inference.
Severity is computed analytically (no second model needed):
    severity = base_severity[class] + 0.15 * confidence
"""

from __future__ import annotations
import pathlib
import numpy as np
import cv2
import imagehash
from PIL import Image
import io

# ── Constants (must match training config) ────────────────────────────────────
CLASS_NAMES = ["garbage", "pothole", "road_damage"]
IMG_SIZE    = 224
IMG_SHAPE   = (IMG_SIZE, IMG_SIZE, 3)

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)

CLASS_BASE_SEVERITY: dict[str, float] = {
    "garbage":      0.40,
    "pothole":      0.85,
    "road_damage":  0.65,
}
CONFIDENCE_BOOST = 0.15   # max bonus when model is very confident

MODELS_DIR = pathlib.Path(__file__).parent.parent / "models"
MODEL_PATH  = MODELS_DIR / "mobilenetv2_best.keras"


def _preprocess(img_bgr: np.ndarray) -> np.ndarray:
    """Resize → RGB → normalise (ImageNet mean/std) → float32 batch."""
    img = cv2.resize(img_bgr, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_LINEAR)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    img = (img - IMAGENET_MEAN) / IMAGENET_STD
    return img[np.newaxis]   # (1, 224, 224, 3)


def compute_phash(img_bytes: bytes) -> str:
    """Return a perceptual hash string (pHash, 64-bit hex) of the image."""
    pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    return str(imagehash.phash(pil_img))


class Predictor:
    """Singleton wrapper around the loaded Keras model."""

    def __init__(self) -> None:
        self._model = None

    def load(self) -> None:
        import tensorflow as tf  # deferred import — keeps startup logs out of module scope
        tf.get_logger().setLevel("ERROR")
        if not MODEL_PATH.exists():
            print(
                f"⚠  Model not found at {MODEL_PATH}. "
                "Starting in Groq-only mode — DNN classification disabled. "
                "Commit ai-service/models/mobilenetv2_best.keras to enable the DNN pipeline."
            )
            return  # _model stays None; service continues in Groq-only mode
        try:
            self._model = tf.keras.models.load_model(str(MODEL_PATH))
            print("✓  MobileNetV2 classifier loaded — running in DNN+Groq mode.")
        except Exception as exc:
            print(
                f"⚠  Model failed to load ({type(exc).__name__}: {exc}). "
                "Falling back to Groq-only mode — DNN classification disabled."
            )
            self._model = None

    def predict(self, img_bytes: bytes) -> dict:
        """
        Run classification + severity scoring on raw image bytes.

        Returns
        -------
        dict with keys:
            category, confidence, severity_score, all_probs, image_hash
        """
        if self._model is None:
            raise RuntimeError("Model not loaded — call Predictor.load() first.")

        # Decode image
        nparr   = np.frombuffer(img_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Could not decode image. Ensure it is a valid JPEG/PNG.")

        batch  = _preprocess(img_bgr)
        probs  = self._model.predict(batch, verbose=0)[0]

        pred_idx   = int(np.argmax(probs))
        category   = CLASS_NAMES[pred_idx]
        confidence = float(probs[pred_idx])

        # Analytic severity — DNN confidence modulates the base class severity
        severity = float(
            np.clip(
                CLASS_BASE_SEVERITY[category] + CONFIDENCE_BOOST * confidence,
                0.0,
                1.0,
            )
        )

        return {
            "category":      category,
            "confidence":    round(confidence, 4),
            "severity_score": round(severity, 4),
            "all_probs": {
                c: round(float(p), 4)
                for c, p in zip(CLASS_NAMES, probs)
            },
            "image_hash": compute_phash(img_bytes),
        }


# Module-level singleton — shared across FastAPI requests
predictor = Predictor()
