import Constants from "expo-constants";
import { demoProfile } from "./demoProfile";
import {
  mapOsintApiResponse,
  osintPhoneUrl,
  type PhoneProfile,
  type OsintApiResponse,
} from "./osint-response";

export type { PhoneProfile };

function getConfig() {
  const extra = Constants.expoConfig?.extra as
    | { apiBase?: string; osintPath?: string }
    | undefined;
  return {
    apiBase: (extra?.apiBase || "").replace(/\/$/, ""),
    osintPath: extra?.osintPath || "/api/v1/osint/phone",
  };
}

export async function lookupPhone(
  raw: string,
  callerName?: string
): Promise<PhoneProfile> {
  const { apiBase, osintPath } = getConfig();
  if (!apiBase) {
    await new Promise((r) => setTimeout(r, 350));
    return demoProfile(raw);
  }
  const url = osintPhoneUrl(apiBase, osintPath, raw, callerName);
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
  }
  const data = (await res.json()) as OsintApiResponse;
  return mapOsintApiResponse(data, raw);
}

export async function fetchOsintTools(): Promise<{
  available_tools?: Record<string, boolean>;
}> {
  const { apiBase } = getConfig();
  if (!apiBase) return {};
  const res = await fetch(`${apiBase}/api/v1/osint/tools`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return {};
  return res.json();
}
