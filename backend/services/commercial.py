"""Détection commerciale / télémarketing (patterns FR, inspiré callattendant)."""

import re
from typing import Any, Dict, Optional


class CommercialDetector:
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.number_patterns: Dict[str, str] = dict(
            self.config.get("number_patterns") or {}
        )
        self.name_patterns: Dict[str, str] = dict(self.config.get("name_patterns") or {})
        self._init_default_patterns()

    def _init_default_patterns(self) -> None:
        if not self.number_patterns:
            self.number_patterns = {
                r"^(\+33|0)8[0-9]{2}[0-9]{6}$": "Numéro surtaxé",
                r"^(\+33|0)9[0-9]{2}[0-9]{6}$": "Numéro à valeur ajoutée",
                r"^(\+33|0)80[0-5][0-9]{6}$": "Numéro vert",
                r"^(\+33|0)82[015][0-9]{6}$": "Numéro indigo",
                r"^(\+33|0)81[0-5][0-9]{6}$": "Numéro azur",
                r"^(\+33|0)89[0-9]{7}$": "Numéro kiosque",
            }
        if not self.name_patterns:
            self.name_patterns = {
                r"V[0-9]{15}": "Télémarketeur (Caller ID)",
                r"^(SERVICE|SERV|SRV|CALL|TEL|PHONE)": "Service commercial",
                r"^(TELEMARKET|TELESALES|TELESELL)": "Télémarketing",
                r"^(SPAM|SCAM|FRAUD)": "Spam/Scam",
            }

    def detect_commercial(
        self,
        phone_number: Optional[str] = None,
        caller_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        result: Dict[str, Any] = {
            "is_commercial": False,
            "is_telemarketer": False,
            "detection_type": None,
            "pattern_matched": None,
            "description": None,
            "confidence": 0.0,
        }
        if phone_number:
            for pattern, desc in self.number_patterns.items():
                if re.match(pattern, phone_number):
                    result.update(
                        {
                            "is_commercial": True,
                            "detection_type": "number_pattern",
                            "pattern_matched": pattern,
                            "description": desc,
                            "confidence": 0.85,
                        }
                    )
                    if "télémarketeur" in desc.lower():
                        result["is_telemarketer"] = True
                    return result
        if caller_name:
            for pattern, desc in self.name_patterns.items():
                if re.search(pattern, caller_name, re.IGNORECASE):
                    tele = "télémarketeur" in desc.lower() or pattern.startswith("V[")
                    result.update(
                        {
                            "is_commercial": True,
                            "is_telemarketer": tele,
                            "detection_type": "name_pattern",
                            "pattern_matched": pattern,
                            "description": desc,
                            "confidence": 0.9 if tele else 0.75,
                        }
                    )
                    return result
        return result
