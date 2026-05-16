import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  commercialNumbers: "teloscope:commercial_numbers",
  spamThreshold: "teloscope:spam_threshold",
  protectionEnabled: "teloscope:protection_enabled",
  blockLog: "teloscope:block_log",
} as const;

export type BlockLogEntry = {
  id: string;
  phone: string;
  at: string;
  reason: string;
};

export async function getCommercialNumbers(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEYS.commercialNumbers);
  return raw ? JSON.parse(raw) : [];
}

export async function addCommercialNumber(phone: string): Promise<void> {
  const list = await getCommercialNumbers();
  if (!list.includes(phone)) {
    list.push(phone);
    await AsyncStorage.setItem(KEYS.commercialNumbers, JSON.stringify(list));
  }
}

export async function removeCommercialNumber(phone: string): Promise<void> {
  const list = (await getCommercialNumbers()).filter((p) => p !== phone);
  await AsyncStorage.setItem(KEYS.commercialNumbers, JSON.stringify(list));
}

export async function getSpamThreshold(): Promise<number> {
  const v = await AsyncStorage.getItem(KEYS.spamThreshold);
  return v ? Number(v) : 70;
}

export async function setSpamThreshold(n: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.spamThreshold, String(n));
}

export async function isProtectionEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.protectionEnabled)) === "1";
}

export async function setProtectionEnabled(on: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.protectionEnabled, on ? "1" : "0");
}

export async function appendBlockLog(entry: Omit<BlockLogEntry, "id">): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.blockLog);
  const list: BlockLogEntry[] = raw ? JSON.parse(raw) : [];
  list.unshift({ ...entry, id: `${Date.now()}` });
  await AsyncStorage.setItem(KEYS.blockLog, JSON.stringify(list.slice(0, 200)));
}

export async function getBlockLog(): Promise<BlockLogEntry[]> {
  const raw = await AsyncStorage.getItem(KEYS.blockLog);
  return raw ? JSON.parse(raw) : [];
}

export async function mergeBlockLog(native: BlockLogEntry[]): Promise<BlockLogEntry[]> {
  const local = await getBlockLog();
  const phones = new Set(local.map((e) => e.id));
  const merged = [...local];
  for (const e of native) {
    if (!phones.has(e.id)) merged.push(e);
  }
  merged.sort((a, b) => (a.at < b.at ? 1 : -1));
  await AsyncStorage.setItem(KEYS.blockLog, JSON.stringify(merged.slice(0, 200)));
  return merged.slice(0, 200);
}
