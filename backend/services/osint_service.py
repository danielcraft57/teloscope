"""Service OSINT Teloscope — outils intégrés dans ce dépôt."""

import asyncio
import json
import os
import shutil
import subprocess
from typing import Any, Dict, List, Optional

import httpx

from .commercial import CommercialDetector
from .french_phone import clean_phone, detect_french


class OsintService:
    def __init__(self) -> None:
        self.commercial = CommercialDetector()
        self.numlookup_key = os.getenv("NUMLOOKUP_API_KEY", "").strip()
        self.numverify_key = os.getenv("NUMVERIFY_API_KEY", "").strip()
        self.opencnam_key = os.getenv("OPENCNAM_API_KEY", "").strip()

    def available_tools(self) -> Dict[str, bool]:
        return {
            "commercial_detector": True,
            "french_phone": True,
            "phoneinfoga": shutil.which("phoneinfoga") is not None,
            "numlookup": bool(self.numlookup_key),
            "numverify": bool(self.numverify_key),
            "opencnam": bool(self.opencnam_key),
        }

    async def enrich_phone_number(
        self, phone_number: str, caller_name: Optional[str] = None
    ) -> Dict[str, Any]:
        clean = clean_phone(phone_number)
        result: Dict[str, Any] = {
            "phone_number": clean,
            "sources": [],
            "carrier": None,
            "operator": None,
            "country": None,
            "region": None,
            "city": None,
            "line_type": None,
            "name": None,
            "reputation": None,
            "is_spam": False,
            "is_scam": False,
            "is_commercial": False,
            "is_telemarketer": False,
            "confidence": 0.0,
        }

        fr = detect_french(clean)
        if fr.get("region"):
            result["region"] = fr["region"]
        if fr.get("line_type"):
            result["line_type"] = fr["line_type"]
        if fr.get("operator"):
            result["operator"] = fr["operator"]
            result["carrier"] = fr["operator"]
        if fr.get("country"):
            result["country"] = fr["country"]
        if fr.get("confidence"):
            result["confidence"] = max(result["confidence"], fr["confidence"])
            result["sources"].append("french_phone")

        commercial = self.commercial.detect_commercial(clean, caller_name)
        if commercial.get("is_commercial"):
            result["is_commercial"] = True
            result["is_telemarketer"] = commercial.get("is_telemarketer", False)
            result["name"] = commercial.get("description")
            result["confidence"] = max(
                result["confidence"], commercial.get("confidence", 0.0)
            )
            result["sources"].append("commercial_detector")
            if result["is_telemarketer"]:
                result["is_spam"] = True
                result["reputation"] = "low"

        tasks: List[Any] = []
        if self.available_tools()["phoneinfoga"]:
            tasks.append(self._phoneinfoga(clean))
        if self.numlookup_key:
            tasks.append(self._numlookup(clean))
        if self.numverify_key:
            tasks.append(self._numverify(clean))

        if tasks:
            for partial in await asyncio.gather(*tasks, return_exceptions=True):
                if isinstance(partial, dict):
                    self._merge(result, partial)

        if result["is_commercial"] and not result["reputation"]:
            result["reputation"] = "low"
        elif not result["reputation"]:
            result["reputation"] = "neutral"

        return result

    def _merge(self, base: Dict[str, Any], extra: Dict[str, Any]) -> None:
        for key in ("carrier", "operator", "country", "region", "line_type", "name"):
            if extra.get(key) and not base.get(key):
                base[key] = extra[key]
        for src in extra.get("sources", []):
            if src not in base["sources"]:
                base["sources"].append(src)
        if extra.get("is_spam"):
            base["is_spam"] = True
        if extra.get("reputation"):
            base["reputation"] = extra["reputation"]
        base["confidence"] = max(base["confidence"], extra.get("confidence", 0))

    async def _phoneinfoga(self, phone: str) -> Dict[str, Any]:
        try:
            proc = await asyncio.create_subprocess_exec(
                "phoneinfoga",
                "scan",
                "-n",
                phone,
                "--output",
                "json",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=45)
            if proc.returncode != 0:
                return {}
            data = json.loads(stdout.decode() or "{}")
            out: Dict[str, Any] = {"sources": ["phoneinfoga"], "confidence": 0.4}
            if isinstance(data, dict):
                carrier = data.get("carrier") or data.get("Carrier")
                if carrier:
                    out["carrier"] = str(carrier)
            return out
        except Exception:
            return {}

    async def _numlookup(self, phone: str) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.get(
                    "https://api.numlookupapi.com/v1/validate/" + phone.lstrip("+"),
                    headers={"apikey": self.numlookup_key},
                )
                if r.status_code != 200:
                    return {}
                data = r.json()
            out: Dict[str, Any] = {"sources": ["numlookup"], "confidence": 0.55}
            if data.get("carrier"):
                out["carrier"] = data["carrier"]
            if data.get("line_type"):
                out["line_type"] = data["line_type"]
            if data.get("country_name"):
                out["country"] = data["country_name"]
            valid = data.get("valid")
            if valid is False:
                out["reputation"] = "low"
            return out
        except Exception:
            return {}

    async def _numverify(self, phone: str) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.get(
                    "http://apilayer.net/api/validate",
                    params={
                        "access_key": self.numverify_key,
                        "number": phone,
                        "format": 1,
                    },
                )
                if r.status_code != 200:
                    return {}
                data = r.json()
            if not data.get("valid"):
                return {"sources": ["numverify"], "reputation": "low", "confidence": 0.5}
            out: Dict[str, Any] = {"sources": ["numverify"], "confidence": 0.5}
            if data.get("carrier"):
                out["carrier"] = data["carrier"]
            if data.get("line_type"):
                out["line_type"] = data["line_type"]
            if data.get("country_name"):
                out["country"] = data["country_name"]
            return out
        except Exception:
            return {}
