import Constants from "expo-constants";
import { demoProfile } from "./demoProfile";

export type PhoneProfile = {
  phone: string;
  mode?: "demo" | "live";
  summary?: string;
  line?: { type?: string; carrier?: string; region?: string };
  reputation?: { spam_score?: number; reports_count?: number; label?: string };
  recommendation?: string;
  isCommercial?: boolean;
};

function getConfig() {
  const extra = Constants.expoConfig?.extra as
    | { apiBase?: string; lookupPath?: string }
    | undefined;
  return {
    apiBase: (extra?.apiBase || "").replace(/\/$/, ""),
    lookupPath: extra?.lookupPath || "/api/v1/phone/lookup",
  };
}

export async function lookupPhone(raw: string): Promise<PhoneProfile> {
  const { apiBase, lookupPath } = getConfig();
  if (!apiBase) {
    await new Promise((r) => setTimeout(r, 350));
    return demoProfile(raw);
  }
  const res = await fetch(apiBase + lookupPath, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ phone: raw }),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
  const data = (await res.json()) as PhoneProfile;
  if (!data.phone) data.phone = raw;
  data.mode = "live";
  if (data.isCommercial == null) {
    const score = data.reputation?.spam_score ?? 0;
    data.isCommercial = score > 55 || data.line?.type === "VoIP";
  }
  return data;
}
