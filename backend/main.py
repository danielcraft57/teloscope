"""API Teloscope — OSINT téléphone (dépôt autonome)."""

import os
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from services.osint_service import OsintService

app = FastAPI(title="Teloscope API", version="0.1.0")
_osint = OsintService()

_origins = os.getenv("TELOSCOPE_CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins] if _origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "service": "teloscope"}


@app.get("/api/v1/osint/tools")
def osint_tools() -> Dict[str, Any]:
    return {"available_tools": _osint.available_tools()}


@app.get("/api/v1/osint/phone/{phone_number:path}")
async def osint_phone(
    phone_number: str,
    caller_name: Optional[str] = Query(None),
) -> Dict[str, Any]:
    try:
        return await _osint.enrich_phone_number(phone_number, caller_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get("/api/v1/osint/commercial/{phone_number:path}")
def osint_commercial(
    phone_number: str,
    caller_name: Optional[str] = Query(None),
) -> Dict[str, Any]:
    clean = phone_number
    return _osint.commercial.detect_commercial(clean, caller_name)
