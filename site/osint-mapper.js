/**
 * Adapte la réponse GET /api/v1/osint/phone/{numero} (API Teloscope) au format vitrine.
 */
(function (global) {
  function reputationToScore(reputation, isSpam, isScam) {
    if (isScam) return 95;
    if (isSpam) return 82;
    var r = (reputation || "").toLowerCase();
    if (r === "low" || r === "bad") return 78;
    if (r === "high" || r === "good") return 18;
    if (r === "neutral") return 45;
    return 50;
  }

  function buildSummary(data) {
    var parts = [];
    if (data.is_scam) parts.push("Signal arnaque.");
    else if (data.is_spam) parts.push("Signal spam.");
    if (data.is_commercial) parts.push("Numéro commercial détecté.");
    if (data.is_telemarketer) parts.push("Télémarketing probable.");
    if (data.name) parts.push(data.name + ".");
    if (parts.length) return parts.join(" ");
    if (data.reputation) return "Réputation OSINT : " + data.reputation + ".";
    return "Analyse OSINT Teloscope terminée.";
  }

  function buildRecommendation(data) {
    if (data.is_scam || data.is_spam) {
      return "Ne pas répondre. Bloquer et signaler si la protection est active.";
    }
    if (data.is_commercial || data.is_telemarketer) {
      return "Traiter comme sollicitation commerciale : blocage recommandé.";
    }
    if ((data.reputation || "").toLowerCase() === "low") {
      return "Prudence : vérifier avant de rappeler.";
    }
    return "Pas de signal bloquant fort ; rester vigilant.";
  }

  function mapOsintApiResponse(data, fallbackPhone) {
    var score = reputationToScore(data.reputation, data.is_spam, data.is_scam);
    var region =
      data.region ||
      data.city ||
      data.department ||
      data.country ||
      "—";
    return {
      phone: data.phone_number || fallbackPhone,
      mode: "live",
      summary: buildSummary(data),
      line: {
        type: data.line_type || data.operator_type || "—",
        carrier: data.carrier || data.operator || "—",
        region: region
      },
      reputation: {
        spam_score: score,
        reports_count: null,
        label: data.reputation || (data.is_spam ? "suspect" : "neutre")
      },
      osint: {
        sources_checked: data.sources || [],
        tools_used: data.sources || [],
        public_hits: (data.sources && data.sources.length) || 0,
        confidence: data.confidence,
        is_commercial: !!data.is_commercial,
        is_telemarketer: !!data.is_telemarketer,
        is_spam: !!data.is_spam,
        is_scam: !!data.is_scam,
        last_seen: null
      },
      recommendation: buildRecommendation(data),
      isCommercial: !!(data.is_commercial || data.is_telemarketer)
    };
  }

  function osintPhoneUrl(apiBase, osintPath, e164, callerName) {
    var base = (apiBase || "").replace(/\/$/, "");
    var path = (osintPath || "/api/v1/osint/phone").replace(/\/$/, "");
    var url =
      base +
      path +
      "/" +
      encodeURIComponent(e164);
    if (callerName) {
      url += "?caller_name=" + encodeURIComponent(callerName);
    }
    return url;
  }

  global.TELOSCOPE_OSINT = {
    mapVocalGuardOsint: mapOsintApiResponse,
    mapOsintApiResponse: mapOsintApiResponse,
    osintPhoneUrl: osintPhoneUrl
  };
})(typeof window !== "undefined" ? window : globalThis);
