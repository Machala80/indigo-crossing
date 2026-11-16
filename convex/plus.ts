// Who has Crossing Plus: an active Stripe subscription, or an owner/admin email.
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const PLUS_STATUSES = new Set(["active", "trialing", "past_due"]);

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export async function isAdmin(ctx: QueryCtx | MutationCtx, userId: Id<"users">): Promise<boolean> {
  const user = await ctx.db.get(userId);
  return !!user?.email && adminEmails().includes(user.email.toLowerCase());
}

export async function plusStatus(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const admin = await isAdmin(ctx, userId);
  const sub = await ctx.db.query("subscriptions").withIndex("by_user", (q) => q.eq("userId", userId)).first();
  const paid = !!sub && PLUS_STATUSES.has(sub.status);
  return {
    plus: admin || paid,
    admin,
    status: sub?.status ?? null,
    periodEnd: sub?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    hasCustomer: !!sub,
  };
}
