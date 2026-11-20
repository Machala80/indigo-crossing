import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/** The signed-in member's own journal. Nobody else's is ever returned. */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    const j = await ctx.db.query("journals").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    return {
      data: j?.data ?? null,
      updatedAt: j?.updatedAt ?? 0,
      email: user?.email ?? null,
      name: user?.name ?? null,
    };
  },
});

export const save = mutation({
  args: { data: v.string() },
  handler: async (ctx, { data }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Please sign in again.");
    if (data.length > 900_000) throw new ConvexError("Your journal is too large to save. Download it, then delete old entries.");
    try { JSON.parse(data); } catch { throw new ConvexError("That journal data was not valid."); }
    const now = Date.now();
    const j = await ctx.db.query("journals").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (j) await ctx.db.patch(j._id, { data, updatedAt: now });
    else await ctx.db.insert("journals", { userId, data, updatedAt: now });
    return now;
  },
});

/** Deletes the member's journal, reminders and account for good. */
export const deleteAccount = mutation({
  args: { confirm: v.literal("DELETE") },
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Please sign in again.");
    const sub = await ctx.db.query("subscriptions").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (sub && ["active", "trialing", "past_due"].includes(sub.status) && !sub.cancelAtPeriodEnd) {
      throw new ConvexError("You still have Crossing Plus. Cancel it first (Plus → Manage subscription), then delete your account, so you aren't charged again.");
    }
    if (sub) await ctx.db.delete(sub._id);
    for (const j of await ctx.db.query("journals").withIndex("by_user", (q) => q.eq("userId", userId)).collect()) await ctx.db.delete(j._id);
    for (const r of await ctx.db.query("reminders").withIndex("by_user", (q) => q.eq("userId", userId)).collect()) await ctx.db.delete(r._id);
    for (const d of await ctx.db.query("pushSubs").withIndex("by_user", (q) => q.eq("userId", userId)).collect()) await ctx.db.delete(d._id);
    for (const m of await ctx.db.query("mirrorUsage").withIndex("by_user_day", (q) => q.eq("userId", userId)).collect()) await ctx.db.delete(m._id);
    for (const s of await ctx.db.query("authSessions").withIndex("userId", (q) => q.eq("userId", userId)).collect()) {
      for (const t of await ctx.db.query("authRefreshTokens").withIndex("sessionId", (q) => q.eq("sessionId", s._id)).collect()) await ctx.db.delete(t._id);
      await ctx.db.delete(s._id);
    }
    for (const a of await ctx.db.query("authAccounts").withIndex("userIdAndProvider", (q) => q.eq("userId", userId)).collect()) {
      for (const c of await ctx.db.query("authVerificationCodes").withIndex("accountId", (q) => q.eq("accountId", a._id)).collect()) await ctx.db.delete(c._id);
      await ctx.db.delete(a._id);
    }
    await ctx.db.delete(userId);
    return true;
  },
});
