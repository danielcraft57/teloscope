(function () {
  const form = document.getElementById("verify-form");
  const input = document.getElementById("phone-input");
  const statusEl = document.getElementById("verify-status");
  const resultEl = document.getElementById("verify-result");
  const demoBanner = document.getElementById("demo-banner");

  if (!form || !input) return;

  const cfg = window.TELOSCOPE_CONFIG || {};
  const apiBase = (cfg.apiBase || "").replace(/\/$/, "");
  const osintPath = cfg.osintPath || cfg.lookupPath || "/api/v1/osint/phone";
  const isDemo = !apiBase;

  if (demoBanner) demoBanner.hidden = !isDemo;

  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = "status" + (type ? " status--" + type : "");
    statusEl.hidden = !msg;
  }

  function normalizePhone(raw) {
    let s = String(raw).trim().replace(/[\s.\-()]/g, "");
    if (s.startsWith("00")) s = "+" + s.slice(2);
    if (/^0[1-9]\d{8}$/.test(s)) s = "+33" + s.slice(1);
    if (/^[1-9]\d{8}$/.test(s)) s = "+33" + s;
    if (!s.startsWith("+")) s = "+" + s;
    if (!/^\+\d{8,15}$/.test(s)) return null;
    return s;
  }

  function hashStr(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }

  const CARRIERS = ["Orange", "SFR", "Bouygues", "Free", "MVNO (Lyca)", "MVNO (Syma)"];
  const LINE_TYPES = ["mobile", "fixe", "VoIP"];
  const ZONES = ["Île-de-France", "Auvergne-Rhône-Alpes", "Occitanie", "Grand Est", "inconnue"];

  function demoProfile(e164) {
    const h = hashStr(e164);
    const spam = (h % 101);
    const lineType = LINE_TYPES[h % LINE_TYPES.length];
    const risky = spam > 72 || lineType === "VoIP";
    return {
      phone: e164,
      mode: "demo",
      summary: risky
        ? "Signaux mitigés : prudence avant de rappeler ou de décrocher."
        : "Pas de signal fort de spam sur les sources simulées.",
      line: {
        type: lineType,
        carrier: CARRIERS[h % CARRIERS.length],
        region: ZONES[(h >> 3) % ZONES.length],
        valid_format: true
      },
      reputation: {
        spam_score: spam,
        reports_count: h % 47,
        label: spam > 72 ? "suspect" : spam > 40 ? "neutre" : "calme"
      },
      osint: {
        sources_checked: [
          "format & indicatif",
          "type ligne (simulé)",
          "réputation agrégée (simulé)",
          "annuaire inversé (simulé)"
        ],
        public_hits: h % 5,
        last_seen: null
      },
      recommendation: risky
        ? "Ne pas rappeler sans vérification. Envisager le filtrage matériel si les appels se répètent."
        : "Numéro a priori classique ; rester vigilant sur le contenu de l'appel."
    };
  }

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function renderProfile(data) {
    const line = data.line || {};
    const rep = data.reputation || {};
    const osint = data.osint || {};
    const sources = osint.sources_checked || osint.tools_used || [];

    resultEl.hidden = false;
    resultEl.innerHTML =
      '<div class="result-head">' +
      '<p class="result-phone">' + esc(data.phone || "—") + "</p>" +
      (data.mode === "demo" ? '<span class="pill pill--demo">Mode démo</span>' : '<span class="pill pill--live">API</span>') +
      "</div>" +
      '<p class="result-summary">' + esc(data.summary || "") + "</p>" +
      '<dl class="result-grid">' +
      row("Type de ligne", line.type) +
      row("Opérateur", line.carrier) +
      row("Zone", line.region) +
      row("Score spam", rep.spam_score != null ? rep.spam_score + " / 100 (" + (rep.label || "") + ")" : "—") +
      row("Signalements", rep.reports_count != null ? String(rep.reports_count) : "—") +
      row("Hits publics", osint.public_hits != null ? String(osint.public_hits) : "—") +
      (osint.is_commercial != null
        ? row("Commercial", osint.is_commercial ? "oui" : "non")
        : "") +
      (osint.confidence != null
        ? row("Confiance", String(Math.round(osint.confidence * 100)) + " %")
        : "") +
      "</dl>" +
      (sources.length
        ? '<p class="result-sources"><strong>Sources :</strong> ' + sources.map(esc).join(" · ") + "</p>"
        : "") +
      '<p class="result-reco"><strong>Recommandation :</strong> ' + esc(data.recommendation || "") + "</p>" +
      (isDemo
        ? '<p class="result-cta"><a href="hardware.html">Appels commerciaux récurrents ?</a> Découvrir le filtre matériel.</p>'
        : "");

    function row(label, val) {
      return "<dt>" + esc(label) + "</dt><dd>" + esc(val != null ? String(val) : "—") + "</dd>";
    }
  }

  async function fetchProfile(e164) {
    var mapper = window.TELOSCOPE_OSINT;
    if (!mapper || !mapper.osintPhoneUrl || !mapper.mapOsintApiResponse) {
      throw new Error("osint-mapper.js manquant");
    }
    var url = mapper.osintPhoneUrl(apiBase, osintPath, e164);
    var res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" }
    });
    if (!res.ok) {
      var t = await res.text();
      throw new Error(t || "Erreur " + res.status);
    }
    var raw = await res.json();
    return mapper.mapOsintApiResponse(raw, e164);
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const normalized = normalizePhone(input.value);
    if (!normalized) {
      setStatus("Numéro invalide. Exemple : 06 12 34 56 78 ou +33612345678", "error");
      resultEl.hidden = true;
      return;
    }

    input.value = normalized;
    setStatus(isDemo ? "Analyse en mode démo…" : "Interrogation API Teloscope…", "loading");
    resultEl.hidden = true;

    try {
      const data = isDemo ? await new Promise(function (r) {
        setTimeout(function () { r(demoProfile(normalized)); }, 400);
      }) : await fetchProfile(normalized);
      setStatus("", "");
      renderProfile(data);
    } catch (err) {
      setStatus("Échec : " + (err.message || "réseau"), "error");
      resultEl.hidden = true;
    }
  });
})();
