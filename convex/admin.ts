import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { isAdmin } from "./plus";

/** Owner dashboard: counts only. Never returns anyone's journal or email. */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || !(await isAdmin(ctx, userId))) return null;
    const now = Date.now(), day = 86400000;
    const users = await ctx.db.query("users").collect();
    const journals = await ctx.db.query("journals").collect();
    const reminders = await ctx.db.query("reminders").collect();
    const subs = await ctx.db.query("subscriptions").collect();
    const mirror = await ctx.db.query("mirrorUsage").collect();
    const since = (ms: number) => new Date(now - ms).toISOString().slice(0, 10);
    const d7 = since(7 * day), d30 = since(30 * day);
    let checkins7 = 0, years = 0, patterns = 0, released = 0, activeCheckers = 0;
    for (const j of journals) {
      try {
        const s = JSON.parse(j.data);
        let mine = 0;
        for (const k in s.checks || {}) if (k >= d7) mine += Object.keys(s.checks[k]).length;
        checkins7 += mine; if (mine) activeCheckers++;
        if (s.year) years++;
        for (const p of s.patterns || []) { patterns++; if (p.released) released++; }
      } catch { /* skip unreadable */ }
    }
    return {
      members: users.length,
      joined7: users.filter((u) => u._creationTime >= now - 7 * day).length,
      joined30: users.filter((u) => u._creationTime >= now - 30 * day).length,
      active7: journals.filter((j) => j.updatedAt >= now - 7 * day).length,
      checkingIn7: activeCheckers,
      checkins7,
      patterns, released, years,
      remindersMorning: reminders.filter((r) => r.on && r.slot === "morning").length,
      remindersEvening: reminders.filter((r) => r.on && r.slot === "evening").length,
      plusActive: subs.filter((s) => ["active", "trialing", "past_due"].includes(s.status)).length,
      plusCancelling: subs.filter((s) => s.status === "active" && s.cancelAtPeriodEnd).length,
      mirror30: mirror.filter((m) => m.day >= d30).reduce((a, m) => a + m.count, 0),
    };
  },
});
