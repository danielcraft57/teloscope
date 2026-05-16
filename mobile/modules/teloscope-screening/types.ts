export type SyncRulesPayload = {
  enabled: boolean;
  commercialNumbers: string[];
  spamThreshold: number;
  messagePath: string | null;
};

export type BlockedCall = {
  id: string;
  phone: string;
  at: string;
  reason: string;
};
