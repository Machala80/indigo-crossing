import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { MORNING_TIMES, EVENING_TIMES } from "./pushPlan";

const MAX_DEVICES = 5;
const prefsV = { morning: v.optional(v.string()), evening: v.optional(v.string()), sunday: v.boolean() };

function checkPrefs(p: { morning?: string; evening?: string }) {
  if (p.morning && !MORNING_TIMES.includes(p.morning)) throw new ConvexError("Choose a morning time from the list.");
  if (p.evening && !EVENING_TIMES.includes(p.evening)) throw new ConvexError("Choose an evening time from the list.");
}

/** The public half of the notification key; browsers need it to subscribe. */
export const publicKey = query({ args: {}, handler: async () => process.env.VAPID_PUBLIC_KEY || null });

/** This device's notification settings, if it has switched them on. */
export const mine = query({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const row = await ctx.db.query("pushSubs").withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint)).first();
    if (!row || row.userId !== userId) return null;
    return { morning: row.morning ?? null, evening: row.evening ?? null, sunday: row.sunday };
  },
});

export const subscribe = mutation({
  args: { endpoint: v.string(), p256dh: v.string(), auth: v.string(), ...prefsV },
  handler: async (ctx, a) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Please sign in again.");
    if (!/^https:\/\//.test(a.endpoint) || a.endpoint.length > 1000) throw new ConvexError("This device gave an address we can't use.");
    checkPrefs(a);
    const existing = await ctx.db.query("pushSubs").withIndex("by_endpoint", (q) => q.eq("endpoint", a.endpoint)).first();
    const doc = { userId, endpoint: a.endpoint, p256dh: a.p256dh, auth: a.auth, morning: a.morning, evening: a.evening, sunday: a.sunday };
    if (existing) { await ctx.db.patch(existing._id, doc); return true; }
    const mineAll = await ctx.db.query("pushSubs").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    if (mineAll.length >= MAX_DEVICES) {
      const oldest = mineAll.sort((x, y) => x.createdAt - y.createdAt)[0];
      await ctx.db.delete(oldest._id);
    }
    await ctx.db.insert("pushSubs", { ...doc, createdAt: Date.now() });
    return true;
  },
});

export const updatePrefs = mutation({
  args: { endpoint: v.string(), ...prefsV },
  handler: async (ctx, a) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Please sign in again.");
    checkPrefs(a);
    const row = await ctx.db.query("pushSubs").withIndex("by_endpoint", (q) => q.eq("endpoint", a.endpoint)).first();
    if (!row || row.userId !== userId) throw new ConvexError("Notifications aren't on for this device.");
    await ctx.db.patch(row._id, { morning: a.morning, evening: a.evening, sunday: a.sunday });
    return true;
  },
});

export const unsubscribe = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const row = await ctx.db.query("pushSubs").withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint)).first();
    if (row && row.userId === userId) await ctx.db.delete(row._id);
    return true;
  },
});

/* ---------- Used by the sender (convex/pushNode.ts) ---------- */

export const all = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("pushSubs").collect();
    const out = [];
    for (const r of rows) {
      let hasGoal = false;
      if (r.sunday) {
        const j = await ctx.db.query("journals").withIndex("by_user", (q) => q.eq("userId", r.userId)).unique();
        try { const js = j ? JSON.parse(j.data) : null; hasGoal = !!js && ((Array.isArray(js.goals) && js.goals.length > 0) || !!js.year); } catch { /* ignore */ }
      }
      out.push({ id: r._id, userId: r.userId, endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth, morning: r.morning, evening: r.evening, sunday: r.sunday && hasGoal, sent: r.sent ?? {} });
    }
    return out;
  },
});

export const forUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) =>
    (await ctx.db.query("pushSubs").withIndex("by_user", (q) => q.eq("userId", userId)).collect())
      .map((r) => ({ id: r._id, endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth })),
});

export const markSent = internalMutation({
  args: { id: v.id("pushSubs"), kind: v.string(), dateKey: v.string() },
  handler: async (ctx, { id, kind, dateKey }) => {
    const r = await ctx.db.get(id);
    if (r) await ctx.db.patch(id, { sent: { ...(r.sent ?? {}), [kind]: dateKey } });
  },
});

export const remove = internalMutation({
  args: { id: v.id("pushSubs") },
  handler: async (ctx, { id }) => { if (await ctx.db.get(id)) await ctx.db.delete(id); },
});
