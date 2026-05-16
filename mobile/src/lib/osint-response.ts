/** Réponse GET /api/v1/osint/phone/{numero} (API Teloscope) */
export type OsintApiResponse = {
  phone_number?: string;
  sources?: string[];
  carrier?: string | null;
  operator?: string | null;
  line_type?: string | null;
  operator_type?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  department?: string | null;
  name?: string | null;
  reputation?: string | null;
  is_spam?: boolean;
  is_scam?: boolean;
  is_commercial?: boolean;
  is_telemarketer?: boolean;
  confidence?: number;
};

export type PhoneProfile = {
  phone: string;
  mode?: "demo" | "live";
  summary?: string;
  line?: { type?: string; carrier?: string; region?: string };
  reputation?: { spam_score?: number; reports_count?: number | null; label?: string };
  osint?: {
    sources_checked?: string[];
    tools_used?: string[];
    public_hits?: number;
    confidence?: number;
    is_commercial?: boolean;
    is_telemarketer?: boolean;
    is_spam?: boolean;
    is_scam?: boolean;
  };
  recommendation?: string;
  isCommercial?: boolean;
};

function reputationToScore(
  reputation?: string | null,
  isSpam?: boolean,
  isScam?: boolean
): number {
  if (isScam) return 95;
  if (isSpam) return 82;
  const r = (reputation || "").toLowerCase();
  if (r === "low" || r === "bad") return 78;
  if (r === "high" || r === "good") return 18;
  if (r === "neutral") return 45;
  return 50;
}

function buildSummary(data: OsintApiResponse): string {
  const parts: string[] = [];
  if (data.is_scam) parts.push("Signal arnaque.");
  else if (data.is_spam) parts.push("Signal spam.");
  if (data.is_commercial) parts.push("Numéro commercial détecté.");
  if (data.is_telemarketer) parts.push("Télémarketing probable.");
  if (data.name) parts.push(`${data.name}.`);
  if (parts.length) return parts.join(" ");
  if (data.reputation) return `Réputation OSINT : ${data.reputation}.`;
  return "Analyse OSINT Teloscope terminée.";
}

function buildRecommendation(data: OsintApiResponse): string {
  if (data.is_scam || data.is_spam) {
    return "Ne pas répondre. Bloquer si la protection est active.";
  }
  if (data.is_commercial || data.is_telemarketer) {
    return "Sollicitation commerciale : blocage recommandé.";
  }
  if ((data.reputation || "").toLowerCase() === "low") {
    return "Prudence avant de rappeler.";
  }
  return "Pas de signal bloquant fort.";
}

export function mapOsintApiResponse(data: OsintApiResponse, fallbackPhone: string): PhoneProfile {
  const score = reputationToScore(data.reputation, data.is_spam, data.is_scam);
  const region = data.region || data.city || data.department || data.country || "—";
  return {
    phone: data.phone_number || fallbackPhone,
    mode: "live",
    summary: buildSummary(data),
    line: {
      type: data.line_type || data.operator_type || "—",
      carrier: data.carrier || data.operator || "—",
      region,
    },
    reputation: {
      spam_score: score,
      reports_count: null,
      label: data.reputation || (data.is_spam ? "suspect" : "neutre"),
    },
    osint: {
      sources_checked: data.sources || [],
      tools_used: data.sources || [],
      public_hits: data.sources?.length ?? 0,
      confidence: data.confidence,
      is_commercial: !!data.is_commercial,
      is_telemarketer: !!data.is_telemarketer,
      is_spam: !!data.is_spam,
      is_scam: !!data.is_scam,
    },
    recommendation: buildRecommendation(data),
    isCommercial: !!(data.is_commercial || data.is_telemarketer),
  };
}

export function osintPhoneUrl(
  apiBase: string,
  osintPath: string,
  e164: string,
  callerName?: string
): string {
  const base = apiBase.replace(/\/$/, "");
  const path = (osintPath || "/api/v1/osint/phone").replace(/\/$/, "");
  const url = `${base}${path}/${encodeURIComponent(e164)}`;
  if (!callerName) return url;
  return `${url}?caller_name=${encodeURIComponent(callerName)}`;
}
