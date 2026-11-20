// Who has Crossing Plus: an active Stripe subscription, an owner/admin email,
// or a confirmed email address that's on the Indigo Estate members list.
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const PLUS_STATUSES = new Set(["active", "trialing", "past_due"]);

export function adminEmails(): string[] {
  // Forgiving: commas, semicolons, spaces or new lines between addresses; stray quotes or <> ignored.
  return (process.env.ADMIN_EMAILS || "")
    .split(/[\s,;]+/)
    .map((s) => s.replace(/["'<>]/g, "").trim().toLowerCase())
    .filter((s) => s.includes("@"));
}

export async function isAdmin(ctx: QueryCtx | MutationCtx, userId: Id<"users">): Promise<boolean> {
  const user = await ctx.db.get(userId);
  return !!user?.email && adminEmails().includes(user.email.toLowerCase());
}

/** On the members list, and the account has confirmed it owns that email. */
export async function isMember(ctx: QueryCtx | MutationCtx, userId: Id<"users">): Promise<boolean> {
  const user = await ctx.db.get(userId);
  if (!user?.email || !user.emailVerificationTime) return false;
  const email = user.email.toLowerCase();
  return !!(await ctx.db.query("members").withIndex("by_email", (q) => q.eq("email", email)).first());
}

export async function plusStatus(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const admin = await isAdmin(ctx, userId);
  const member = await isMember(ctx, userId);
  const sub = await ctx.db.query("subscriptions").withIndex("by_user", (q) => q.eq("userId", userId)).first();
  const paid = !!sub && PLUS_STATUSES.has(sub.status);
  return {
    plus: admin || member || paid,
    admin,
    member,
    status: sub?.status ?? null,
    periodEnd: sub?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    hasCustomer: !!sub,
  };
}
