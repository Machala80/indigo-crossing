export interface CrossingApi {
  journal: string | null;
  email: string;
  reminder: { email: string; slot: "morning" | "evening"; on: boolean } | null;
  mirrorEnabled: boolean;
  plusInfo: { plus: boolean; admin: boolean; status: string | null; periodEnd: number | null; cancelAtPeriodEnd: boolean; hasCustomer: boolean } | null;
  getPlus(): Promise<CrossingApi["plusInfo"]>;
  checkout(plan: "monthly" | "yearly"): Promise<string>;
  portal(): Promise<string>;
  confirmCheckout(sessionId: string): Promise<boolean>;
  adminStats(): Promise<unknown>;
  save(data: string): Promise<unknown>;
  setReminder(email: string, slot: "morning" | "evening", consent: string): Promise<unknown>;
  stopReminder(): Promise<unknown>;
  mirrorPattern(p: Record<string, string>): Promise<unknown>;
  mirrorWeek(patterns: string, days: string): Promise<unknown>;
  mirrorYear(a: { goal: string; identity: string; why: string; season: string; milestone: string; week: string; recent: string }): Promise<unknown>;
  deleteAccount(): Promise<void>;
  signOut(): Promise<void>;
}
export function startCrossing(api: CrossingApi): { flush(): Promise<void> };
