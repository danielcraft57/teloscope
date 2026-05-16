import { Platform } from "react-native";
import TeloscopeScreening from "teloscope-screening";
import {
  addCommercialNumber,
  getCommercialNumbers,
  getSpamThreshold,
  isProtectionEnabled,
  mergeBlockLog,
  setProtectionEnabled,
} from "./storage";

function moduleReady(): boolean {
  return Platform.OS === "android" && TeloscopeScreening != null;
}

export function screeningAvailable(): boolean {
  if (!moduleReady()) return false;
  try {
    return TeloscopeScreening!.isAvailable();
  } catch {
    return false;
  }
}

export async function requestScreeningRole(): Promise<boolean> {
  if (!moduleReady()) return false;
  try {
    await TeloscopeScreening!.requestCallScreeningRole();
    return TeloscopeScreening!.hasCallScreeningRole();
  } catch {
    return false;
  }
}

export async function hasScreeningRole(): Promise<boolean> {
  if (!moduleReady()) return false;
  try {
    return TeloscopeScreening!.hasCallScreeningRole();
  } catch {
    return false;
  }
}

export async function syncScreeningRules(messagePath: string | null): Promise<void> {
  if (!moduleReady()) return;
  try {
    await TeloscopeScreening!.syncRules({
      enabled: await isProtectionEnabled(),
      commercialNumbers: await getCommercialNumbers(),
      spamThreshold: await getSpamThreshold(),
      messagePath,
    });
  } catch {
    /* Expo Go */
  }
}

export async function refreshBlockLogFromNative() {
  if (!moduleReady()) return [];
  try {
    const nativeLog = await TeloscopeScreening!.getBlockedCalls();
    return mergeBlockLog(nativeLog);
  } catch {
    return [];
  }
}

export async function enableProtection(on: boolean, messagePath: string | null) {
  await setProtectionEnabled(on);
  await syncScreeningRules(messagePath);
}

export async function markCommercial(phone: string, messagePath: string | null) {
  await addCommercialNumber(phone);
  await syncScreeningRules(messagePath);
}
