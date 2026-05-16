import * as FileSystem from "expo-file-system/legacy";

const MESSAGE_FILE = "commercial-message.m4a";
const MESSAGE_META = "commercial-message.json";

export type MessageMeta = {
  uri: string;
  updatedAt: string;
  durationMs?: number;
};

export function messageDirectory(): string {
  return FileSystem.documentDirectory ?? "";
}

export function messageFileUri(): string {
  return `${messageDirectory()}${MESSAGE_FILE}`;
}

export async function getMessageMeta(): Promise<MessageMeta | null> {
  const path = `${messageDirectory()}${MESSAGE_META}`;
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return null;
  const raw = await FileSystem.readAsStringAsync(path);
  return JSON.parse(raw) as MessageMeta;
}

export async function saveMessageMeta(meta: MessageMeta): Promise<void> {
  const path = `${messageDirectory()}${MESSAGE_META}`;
  await FileSystem.writeAsStringAsync(path, JSON.stringify(meta));
}

export async function deleteMessage(): Promise<void> {
  const uri = messageFileUri();
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  const metaPath = `${messageDirectory()}${MESSAGE_META}`;
  const metaInfo = await FileSystem.getInfoAsync(metaPath);
  if (metaInfo.exists) await FileSystem.deleteAsync(metaPath, { idempotent: true });
}

export async function copyRecordingToMessage(sourceUri: string): Promise<string> {
  const dest = messageFileUri();
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}
