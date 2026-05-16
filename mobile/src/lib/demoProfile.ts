import type { PhoneProfile } from "./osint-response";

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

const CARRIERS = ["Orange", "SFR", "Bouygues", "Free", "MVNO (Lyca)", "MVNO (Syma)"];
const LINE_TYPES = ["mobile", "fixe", "VoIP"];
const ZONES = ["Île-de-France", "Auvergne-Rhône-Alpes", "Occitanie", "Grand Est", "inconnue"];

export function demoProfile(e164: string): PhoneProfile {
  const h = hashStr(e164);
  const spam = h % 101;
  const lineType = LINE_TYPES[h % LINE_TYPES.length];
  const risky = spam > 72 || lineType === "VoIP";
  return {
    phone: e164,
    mode: "demo",
    summary: risky
      ? "Signaux mitigés : prudence avant de répondre."
      : "Pas de signal fort de spam (simulation).",
    line: {
      type: lineType,
      carrier: CARRIERS[h % CARRIERS.length],
      region: ZONES[(h >> 3) % ZONES.length],
    },
    reputation: {
      spam_score: spam,
      reports_count: h % 47,
      label: spam > 72 ? "suspect" : spam > 40 ? "neutre" : "calme",
    },
    recommendation: risky
      ? "Considérer comme commercial : blocage automatique possible."
      : "Numéro a priori classique.",
    isCommercial: risky || spam > 55,
  };
}
