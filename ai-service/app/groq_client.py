"""
Groq vision client — enriches DNN predictions with a natural language
description of the civic issue using Llama 4 Scout (vision-capable).

The DNN result is passed as context so Groq's response is grounded.
Falls back gracefully if the API key is missing or the call times out.
"""

from __future__ import annotations
import base64
import os
import asyncio
from typing import Optional


_GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

_SYSTEM_PROMPT = (
    "You are an expert civic infrastructure analyst helping a municipal reporting system. "
    "You receive photos of civic issues submitted by citizens. "
    "Be concise, factual, and practical. Never include greetings or closing remarks."
)

_USER_PROMPT_TEMPLATE = (
    "The AI classifier identified this image as a '{category}' issue "
    "with {confidence:.0%} confidence (severity score: {severity:.2f}/1.00).\n\n"
    "Provide a structured analysis in exactly this format:\n"
    "DESCRIPTION: [1-2 sentences describing exactly what you see in the image]\n"
    "SEVERITY_REASON: [1 sentence explaining the severity rating]\n"
    "RECOMMENDATION: [1 sentence on immediate action needed]"
)


def _encode_image(img_bytes: bytes) -> str:
    return base64.standard_b64encode(img_bytes).decode("utf-8")


async def analyze_image(
    img_bytes: bytes,
    category: str,
    confidence: float,
    severity: float,
    timeout: float = 15.0,
) -> Optional[dict[str, str]]:
    """
    Call Groq vision API asynchronously.

    Returns parsed dict with keys: description, severity_reason, recommendation
    Returns None if GROQ_API_KEY is unset, quota exceeded, or timeout fires.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None

    try:
        from groq import AsyncGroq  # lazy import
    except ImportError:
        return None

    client = AsyncGroq(api_key=api_key)
    b64    = _encode_image(img_bytes)
    prompt = _USER_PROMPT_TEMPLATE.format(
        category=category,
        confidence=confidence,
        severity=severity,
    )

    try:
        response = await asyncio.wait_for(
            client.chat.completions.create(
                model=_GROQ_MODEL,
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{b64}",
                                },
                            },
                            {"type": "text", "text": prompt},
                        ],
                    },
                ],
                max_tokens=256,
                temperature=0.3,
            ),
            timeout=timeout,
        )
    except (asyncio.TimeoutError, Exception):
        return None

    raw = response.choices[0].message.content or ""
    return _parse_response(raw)


def _parse_response(text: str) -> dict[str, str]:
    """Parse the structured response into a dict."""
    result = {
        "description":      "",
        "severity_reason":  "",
        "recommendation":   "",
        "raw":              text.strip(),
    }

    for line in text.strip().splitlines():
        line = line.strip()
        if line.startswith("DESCRIPTION:"):
            result["description"] = line[len("DESCRIPTION:"):].strip()
        elif line.startswith("SEVERITY_REASON:"):
            result["severity_reason"] = line[len("SEVERITY_REASON:"):].strip()
        elif line.startswith("RECOMMENDATION:"):
            result["recommendation"] = line[len("RECOMMENDATION:"):].strip()

    # Fallback: if parsing failed (model ignored format), use the full text
    if not result["description"]:
        result["description"] = text.strip()

    return result
