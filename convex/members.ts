import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { isAdmin } from "./plus";
import type { QueryCtx, MutationCtx } from "./_generated/server";

const EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$/;

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId || !(await isAdmin(ctx, userId))) throw new ConvexError("This is for the owner only.");
}

/** Pull email addresses out of pasted text: one per line, or separated by commas, semicolons or spaces. */
export function parseEmails(text: string): { valid: string[]; invalid: string[] } {
  const valid = new Set<string>(), invalid: string[] = [];
  for (const raw of text.split(/[\s,;]+/)) {
    const t = raw.trim().replace(/^<|>$/g, "").toLowerCase();
    if (!t) continue;
    if (EMAIL.test(t)) valid.add(t); else invalid.push(raw.trim());
  }
  return { valid: [...valid], invalid };
}

/** The members list, for the owner dashboard. Shows whether each person has a confirmed account yet. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("members").collect();
    const out = [];
    for (const r of rows) {
      const u = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", r.email)).first();
      out.push({ email: r.email, addedAt: r.addedAt, joined: !!u?.emailVerificationTime });
    }
    return out.sort((a, b) => a.email.localeCompare(b.email));
  },
});

export const add = mutation({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    await requireAdmin(ctx);
    if (text.length > 200_000) throw new ConvexError("That's too much at once. Add up to about 2,000 emails at a time.");
    const { valid, invalid } = parseEmails(text);
    let added = 0;
    for (const email of valid.slice(0, 2000)) {
      if (await ctx.db.query("members").withIndex("by_email", (q) => q.eq("email", email)).first()) continue;
      await ctx.db.insert("members", { email, addedAt: Date.now() });
      added++;
    }
    return { added, already: Math.min(valid.length, 2000) - added, invalid: invalid.slice(0, 20) };
  },
});

export const remove = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    await requireAdmin(ctx);
    const e = email.trim().toLowerCase();
    for (const r of await ctx.db.query("members").withIndex("by_email", (q) => q.eq("email", e)).collect()) await ctx.db.delete(r._id);
    return null;
  },
});
