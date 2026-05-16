import { requireOptionalNativeModule } from "expo-modules-core";

import type { BlockedCall, SyncRulesPayload } from "./types";

export type { BlockedCall, SyncRulesPayload };

type TeloscopeScreeningModule = {
  isAvailable: () => boolean;
  requestCallScreeningRole: () => Promise<boolean>;
  hasCallScreeningRole: () => Promise<boolean>;
  syncRules: (rules: SyncRulesPayload) => Promise<void>;
  getBlockedCalls: () => Promise<BlockedCall[]>;
};

export default requireOptionalNativeModule<TeloscopeScreeningModule>("TeloscopeScreening");
