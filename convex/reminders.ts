import { query, mutation, internalQuery, internalMutation, internalAction, httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { sendBrevo, emailHtml } from "./brevo";
import { londonNow } from "./londonTime";
import { dayNumber, dareForDay } from "./content";

const slotV = v.union(v.literal("morning"), v.literal("evening"));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function token(): string {
  const a = new Uint8Array(18);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const r = await ctx.db.query("reminders").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    return r ? { email: r.email, slot: r.slot, on: r.on } : null;
  },
});

export const set = mutation({
  args: { email: v.string(), slot: slotV, consent: v.string() },
  handler: async (ctx, { email, slot, consent }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Please sign in again.");
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) throw new ConvexError("Enter a full email address, like name@example.com.");
    if (!consent.trim()) throw new ConvexError("Tick the box to agree to reminder emails.");
    const existing = await ctx.db.query("reminders").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    const doc = { userId, email: clean, slot, on: true, consentAt: Date.now(), consent: consent.slice(0, 500) };
    if (existing) await ctx.db.patch(existing._id, doc);
    else await ctx.db.insert("reminders", { ...doc, token: token() });
    return true;
  },
});

export const stop = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Please sign in again.");
    const r = await ctx.db.query("reminders").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (r) await ctx.db.delete(r._id);
    return true;
  },
});

/* ---------- Sending ---------- */

export const due = internalQuery({
  args: { slot: slotV, dateKey: v.string() },
  handler: async (ctx, { slot, dateKey }) => {
    const rows = await ctx.db.query("reminders").withIndex("by_slot_on", (q) => q.eq("slot", slot).eq("on", true)).collect();
    return rows.filter((r) => r.lastSentDay !== dateKey).map((r) => ({ id: r._id, email: r.email, token: r.token }));
  },
});

export const markSent = internalMutation({
  args: { id: v.id("reminders"), dateKey: v.string() },
  handler: async (ctx, { id, dateKey }) => {
    const r = await ctx.db.get(id);
    if (r) await ctx.db.patch(id, { lastSentDay: dateKey });
  },
});

/** Runs every 30 minutes; sends at 07:30 and 20:00 UK time. */
export const tick = internalAction({
  args: { force: v.optional(slotV) },
  handler: async (ctx, { force }) => {
    const t = londonNow();
    const slot = force ?? (t.hour === 7 && t.minute >= 30 ? "morning" : t.hour === 20 && t.minute < 30 ? "evening" : null);
    if (!slot) return { sent: 0, slot: null };
    const list = await ctx.runQuery(internal.reminders.due, { slot, dateKey: t.dateKey });
    const appUrl = process.env.APP_URL || "https://crossing.indigoestate.co.uk";
    const siteUrl = process.env.CONVEX_SITE_URL;
    const dare = dareForDay(dayNumber(t.year, t.month, t.day));
    let sent = 0;
    for (const r of list) {
      const unsub = `${siteUrl}/unsubscribe?t=${r.token}`;
      const morning = slot === "morning";
      const subject = morning ? "Today you walk out" : "Close the day with the examen";
      const lines = morning
        ? ["One day at a time. Open The Crossing, make your pledge, and check in on your pattern.", "If the pull comes today, tap “The pull is here”, and remember who you are becoming.", `Today’s dare: ${dare}`]
        : ["Before you sleep, check in on your pattern and answer the four examen questions.", "Where did you walk free today? Where did the old pattern pull?", `Today’s dare was: ${dare}`];
      try {
        await sendBrevo({
          to: r.email,
          subject,
          text: `${lines.join("\n\n")}\n\nOpen The Crossing: ${appUrl}\n\nStop these reminders: ${unsub}`,
          html: emailHtml(subject, lines, { label: "Open The Crossing", url: appUrl },
            `You asked Indigo Estate for a daily reminder from The Crossing. <a href="${unsub}" style="color:#8B6914">Stop these reminders</a>.`),
          headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        });
        await ctx.runMutation(internal.reminders.markSent, { id: r.id, dateKey: t.dateKey });
        sent++;
      } catch (e) {
        console.error(`Reminder to ${r.email} failed: ${(e as Error).message}`);
      }
    }
    return { sent, slot };
  },
});

export const unsubscribeByToken = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const r = await ctx.db.query("reminders").withIndex("by_token", (q) => q.eq("token", token)).unique();
    if (!r) return false;
    await ctx.db.delete(r._id);
    return true;
  },
});

const page = (title: string, body: string) => new Response(
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<body style="margin:0;font-family:Georgia,serif;background:#EFF8F8;color:#33204F;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px">
<div style="max-width:420px;text-align:center"><p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;color:#8B6914;text-transform:uppercase">Indigo Estate · The Crossing</p>
<h1 style="font-weight:normal;color:#46286D">${title}</h1><p>${body}</p></div></body>`,
  { headers: { "content-type": "text/html; charset=utf-8" } });

export const unsubscribe = httpAction(async (ctx, req) => {
  const t = new URL(req.url).searchParams.get("t") || "";
  if (!/^[0-9a-f]{36}$/.test(t)) return page("Link not recognised", "This unsubscribe link isn’t valid. You can stop reminders inside the app, on the Witness page.");
  const ok = await ctx.runMutation(internal.reminders.unsubscribeByToken, { token: t });
  return page(ok ? "Reminders stopped" : "Already stopped", ok ? "You won’t get any more reminder emails. Your journal is untouched." : "There are no reminders set up for this link.");
});

/* ---------- Sunday "close your week" email for members with a Sovereign Year ---------- */

export const sundayDue = internalQuery({
  args: { dateKey: v.string() },
  handler: async (ctx, { dateKey }) => {
    const out: { id: any; email: string; token: string; week: number; goal: string; more: number }[] = [];
    for (const slot of ["morning", "evening"] as const) {
      const rows = await ctx.db.query("reminders").withIndex("by_slot_on", (q) => q.eq("slot", slot).eq("on", true)).collect();
      for (const r of rows) {
        if (r.lastSundaySent === dateKey) continue;
        const j = await ctx.db.query("journals").withIndex("by_user", (q) => q.eq("userId", r.userId)).unique();
        if (!j) continue;
        try {
          const js = JSON.parse(j.data);
          // Newer journals keep a list of goals; older ones a single "year".
          const goals = (Array.isArray(js.goals) && js.goals.length ? js.goals : js.year ? [js.year] : []).filter((g: any) => g && g.start && g.goal);
          const y = goals[0];
          if (!y) continue;
          const [yy, mm, dd] = String(y.start).split("-").map(Number);
          const [ty, tm, td] = dateKey.split("-").map(Number);
          const days = Math.floor((Date.UTC(ty, tm - 1, td) - Date.UTC(yy, mm - 1, dd)) / 86400000);
          const week = Math.min(52, Math.max(1, Math.floor(days / 7) + 1));
          out.push({ id: r._id, email: r.email, token: r.token, week, goal: String(y.goal).slice(0, 120), more: goals.length - 1 });
        } catch { /* skip */ }
      }
    }
    return out;
  },
});

export const markSunday = internalMutation({
  args: { id: v.id("reminders"), dateKey: v.string() },
  handler: async (ctx, { id, dateKey }) => {
    if (await ctx.db.get(id)) await ctx.db.patch(id, { lastSundaySent: dateKey });
  },
});

/** Runs every 30 minutes; sends at 18:00 UK time on Sundays. */
export const sunday = internalAction({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, { force }) => {
    const t = londonNow();
    if (!force && !(t.weekday === 0 && t.hour === 18 && t.minute < 30)) return { sent: 0 };
    const list = await ctx.runQuery(internal.reminders.sundayDue, { dateKey: t.dateKey });
    const appUrl = process.env.APP_URL || "https://crossing.indigoestate.co.uk";
    const siteUrl = process.env.CONVEX_SITE_URL;
    let sent = 0;
    for (const r of list) {
      const unsub = `${siteUrl}/unsubscribe?t=${r.token}`;
      const subject = `Close week ${r.week} of your Sovereign Year`;
      const lines = [
        `It’s Sunday evening. Week ${r.week} of 52 is closing.`,
        r.more
          ? `Take five minutes for each of your ${r.more + 1} goals: how did this week’s step go, what helped, what got in the way? Then set next week’s steps, starting with “${r.goal}”.`
          : `Take five minutes: how did this week’s step go, what helped, what got in the way? Then set next week’s step towards “${r.goal}”.`,
        "One honest review a week is how a year gets built.",
      ];
      try {
        await sendBrevo({
          to: r.email, subject,
          text: `${lines.join("\n\n")}\n\nClose your week: ${appUrl}/#future\n\nStop these emails: ${unsub}`,
          html: emailHtml(subject, lines, { label: "Close my week", url: `${appUrl}/#future` },
            `You asked Indigo Estate for reminders from The Crossing. <a href="${unsub}" style="color:#8B6914">Stop these emails</a>.`),
          headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        });
        await ctx.runMutation(internal.reminders.markSunday, { id: r.id, dateKey: t.dateKey });
        sent++;
      } catch (e) { console.error(`Sunday email to ${r.email} failed: ${(e as Error).message}`); }
    }
    return { sent };
  },
});
