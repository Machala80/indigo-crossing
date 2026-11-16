// Test harness: runs the real app against an in-memory stand-in for Convex.
import { startCrossing } from "../src/crossing.js";
import "../src/styles.css";
declare global { interface Window { __saves: number; __lastSave: string | null; __reminder: unknown; __signedOut: boolean; __deleted: boolean; } }
const KEY = "harness-journal";
window.__saves = 0; window.__lastSave = null; window.__reminder = null; window.__signedOut = false; window.__deleted = false;
document.getElementById("appShell")!.hidden = false;
startCrossing({
  journal: localStorage.getItem(KEY),
  email: "test@example.com",
  reminder: JSON.parse(localStorage.getItem("harness-rem") || "null"),
  mirrorEnabled: true,
  plusInfo: JSON.parse(localStorage.getItem("harness-plus") || '{"plus":false,"admin":false,"status":null,"periodEnd":null,"cancelAtPeriodEnd":false,"hasCustomer":false}'),
  getPlus: async () => JSON.parse(localStorage.getItem("harness-plus") || '{"plus":false}'),
  checkout: async (plan) => { (window as any).__checkout = plan; return "#welcome-plus"; },
  portal: async () => "#plus",
  adminStats: async () => ({ members: 12, joined7: 3, joined30: 9, active7: 7, checkingIn7: 5, checkins7: 31, patterns: 14, released: 2, years: 4, remindersMorning: 6, remindersEvening: 2, plusActive: 3, plusCancelling: 1, mirror30: 40 }),
  save: async (data) => { window.__saves++; window.__lastSave = data; localStorage.setItem(KEY, data); },
  setReminder: async (email, slot) => { const r = { email, slot, on: true }; window.__reminder = r; localStorage.setItem("harness-rem", JSON.stringify(r)); },
  stopReminder: async () => { window.__reminder = null; localStorage.removeItem("harness-rem"); },
  mirrorPattern: async () => ({ seen: "You go quiet when being seen feels risky.", questions: ["Q1?", "Q2?", "Q3?"], truth: "Finished is braver than perfect.", practice: "Send one piece daily." }),
  mirrorYear: async () => ({ step: "Write 500 words of chapter one", why: "Small enough to finish on a tired week." }),
  mirrorWeek: async () => ({ theme: "Saying no", held: "Mornings", watch: "Evenings", question: "What helps?" }),
  deleteAccount: async () => { window.__deleted = true; },
  signOut: async () => { window.__signedOut = true; },
});
