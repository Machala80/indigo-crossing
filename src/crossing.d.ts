export interface CrossingApi {
  journal: string | null;
  email: string;
  reminder: { email: string; slot: "morning" | "evening"; on: boolean } | null;
  mirrorEnabled: boolean;
  save(data: string): Promise<unknown>;
  setReminder(email: string, slot: "morning" | "evening", consent: string): Promise<unknown>;
  stopReminder(): Promise<unknown>;
  mirrorPattern(p: Record<string, string>): Promise<unknown>;
  mirrorWeek(patterns: string, days: string): Promise<unknown>;
  deleteAccount(): Promise<void>;
  signOut(): Promise<void>;
}
export function startCrossing(api: CrossingApi): { flush(): Promise<void> };
