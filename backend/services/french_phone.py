"""Indicatifs français simplifiés (zone fixe, type mobile)."""

import re
from typing import Any, Dict

REGIONS = {
    "1": "Île-de-France",
    "2": "Nord-Ouest",
    "3": "Nord-Est",
    "4": "Sud-Est",
    "5": "Sud-Ouest",
}


def clean_phone(phone: str) -> str:
    s = re.sub(r"[\s.\-()]", "", phone.strip())
    if s.startswith("00"):
        s = "+" + s[2:]
    if re.match(r"^0[1-9]\d{8}$", s):
        s = "+33" + s[1:]
    if not s.startswith("+"):
        s = "+" + s
    return s


def detect_french(phone: str) -> Dict[str, Any]:
    e164 = clean_phone(phone)
    national = "0" + e164[3:] if e164.startswith("+33") else phone
    out: Dict[str, Any] = {"confidence": 0.0, "country": "France"}
    if not national.startswith("0"):
        return out
    zone = national[1]
    if zone in REGIONS and national[1] in "12345":
        out["region"] = REGIONS[zone]
        out["line_type"] = "fixe"
        out["confidence"] = 0.5
    if national.startswith("06") or national.startswith("07"):
        out["line_type"] = "mobile"
        out["operator"] = "mobile FR (indicatif — portabilité possible)"
        out["confidence"] = max(out.get("confidence", 0), 0.35)
    return out
