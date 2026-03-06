"""
Civic Sense Portal — AI Microservice
FastAPI app exposing:
  POST /predict   — DNN classification + Groq vision description
  GET  /health    — liveness check
  GET  /classes   — list supported classes + severity config
"""

from __future__ import annotations
import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .predictor import predictor
from .groq_client import analyze_image

# ── Max image upload size: 10 MB ──────────────────────────────────────────────
MAX_IMAGE_BYTES = 10 * 1024 * 1024


# ── Response schemas ──────────────────────────────────────────────────────────

class GroqAnalysis(BaseModel):
    description:     str
    severity_reason: str
    recommendation:  str


class PredictResponse(BaseModel):
    category:      str
    confidence:    float
    severity_score: float
    all_probs:     dict[str, float]
    image_hash:    str
    groq_analysis: Optional[GroqAnalysis] = None
    model_version: str = "mobilenetv2-phase2"


class HealthResponse(BaseModel):
    status:       str
    model_loaded: bool
    groq_enabled: bool


# ── App lifecycle ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load the Keras model once into memory
    print("Loading MobileNetV2 classifier…")
    predictor.load()
    print("Model ready.")
    yield
    # Shutdown (nothing to clean up for a stateless model)


app = FastAPI(
    title="Civic Sense Portal — AI Service",
    description=(
        "Image classification (MobileNetV2 DNN) + "
        "vision analysis (Groq LLaMA-4) for civic issue reports."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["Meta"])
async def health():
    return HealthResponse(
        status       = "ok",
        model_loaded = predictor._model is not None,
        groq_enabled = bool(os.getenv("GROQ_API_KEY")),
    )


@app.get("/classes", tags=["Meta"])
async def get_classes():
    from .predictor import CLASS_NAMES, CLASS_BASE_SEVERITY, CONFIDENCE_BOOST
    return {
        "classes": CLASS_NAMES,
        "severity_config": {
            "base": CLASS_BASE_SEVERITY,
            "confidence_boost": CONFIDENCE_BOOST,
            "formula": "severity = base[class] + confidence_boost * confidence",
        },
    }


@app.post("/predict", response_model=PredictResponse, tags=["Inference"])
async def predict(
    file:         UploadFile = File(...,  description="Civic issue image (JPEG/PNG)"),
    use_groq:     bool       = Form(True, description="Also run Groq vision analysis"),
):
    """
    Classify a civic issue image using the MobileNetV2 DNN and optionally
    enrich the result with a natural language description from Groq's
    LLaMA-4 Scout vision model.

    Returns category, confidence, severity score (0-1), perceptual image hash
    for duplicate detection, and (if Groq is enabled) a structured description.
    """
    # Validate content type
    if file.content_type not in ("image/jpeg", "image/png", "image/webp", "image/jpg"):
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported media type '{file.content_type}'. Use JPEG or PNG.",
        )

    img_bytes = await file.read()
    if len(img_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Image exceeds 10 MB limit ({len(img_bytes) / 1e6:.1f} MB received).",
        )
    if len(img_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file received.")

    # ── DNN inference ──────────────────────────────────────────────────────────
    try:
        dnn_result = predictor.predict(img_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    # ── Groq vision analysis (optional, non-blocking) ─────────────────────────
    groq_analysis = None
    if use_groq and os.getenv("GROQ_API_KEY"):
        raw = await analyze_image(
            img_bytes  = img_bytes,
            category   = dnn_result["category"],
            confidence = dnn_result["confidence"],
            severity   = dnn_result["severity_score"],
        )
        if raw:
            groq_analysis = GroqAnalysis(
                description     = raw.get("description",     ""),
                severity_reason = raw.get("severity_reason", ""),
                recommendation  = raw.get("recommendation",  ""),
            )

    return PredictResponse(
        category       = dnn_result["category"],
        confidence     = dnn_result["confidence"],
        severity_score = dnn_result["severity_score"],
        all_probs      = dnn_result["all_probs"],
        image_hash     = dnn_result["image_hash"],
        groq_analysis  = groq_analysis,
    )
