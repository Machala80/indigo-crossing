import { action, query, internalQuery, internalMutation, httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { plusStatus } from "./plus";

/** The signed-in member's Plus status. */
export const status = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await plusStatus(ctx, userId);
  },
});

export const me = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    const sub = await ctx.db.query("subscriptions").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    return { email: user?.email ?? null, customerId: sub?.stripeCustomerId ?? null };
  },
});

/* ---------- Stripe API (plain HTTPS, no SDK needed) ---------- */

function form(data: Record<string, string | number | boolean | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, val] of Object.entries(data)) if (val !== undefined) p.append(k, String(val));
  return p.toString();
}

async function stripe(path: string, body?: Record<string, string | number | boolean | undefined>) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new ConvexError("Payments aren't set up yet.");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/x-www-form-urlencoded" },
    body: body ? form(body) : undefined,
  });
  const json = (await res.json()) as Record<string, any>;
  if (!res.ok) {
    console.error(`Stripe ${path} failed: ${JSON.stringify(json?.error ?? json).slice(0, 400)}`);
    throw new ConvexError("We couldn't reach the payment page just now. Try again in a moment.");
  }
  return json;
}

/** Start a Stripe Checkout for Plus; returns the page to send the member to. */
export const checkout = action({
  args: { plan: v.union(v.literal("monthly"), v.literal("yearly")) },
  handler: async (ctx, { plan }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Please sign in again.");
    const price = plan === "monthly" ? process.env.STRIPE_PRICE_MONTHLY : process.env.STRIPE_PRICE_YEARLY;
    if (!price) throw new ConvexError("Payments aren't set up yet.");
    const me = await ctx.runQuery(internal.billing.me, { userId });
    const appUrl = process.env.APP_URL || "https://crossing.indigoestate.co.uk";
    const session = await stripe("checkout/sessions", {
      mode: "subscription",
      "line_items[0][price]": price,
      "line_items[0][quantity]": 1,
      client_reference_id: userId,
      "metadata[userId]": userId,
      "subscription_data[metadata][userId]": userId,
      allow_promotion_codes: true,
      ...(me.customerId ? { customer: me.customerId } : { customer_email: me.email ?? undefined }),
      success_url: `${appUrl}/#welcome-plus`,
      cancel_url: `${appUrl}/#plus`,
    });
    return session.url as string;
  },
});

/** Stripe's own page where members change or cancel their plan. */
export const portal = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Please sign in again.");
    const me = await ctx.runQuery(internal.billing.me, { userId });
    if (!me.customerId) throw new ConvexError("There's no Plus subscription on this account.");
    const appUrl = process.env.APP_URL || "https://crossing.indigoestate.co.uk";
    const session = await stripe("billing_portal/sessions", { customer: me.customerId, return_url: `${appUrl}/#plus` });
    return session.url as string;
  },
});

/* ---------- Webhook: Stripe tells us when a subscription starts, changes or ends ---------- */

const enc = new TextEncoder();
function hex(buf: ArrayBuffer) { return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join(""); }
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** Checks the Stripe-Signature header (HMAC-SHA256 of "timestamp.payload"), allowing 5 minutes of clock drift. */
export async function verifyStripeSignature(payload: string, header: string | null, secret: string, nowSec = Math.floor(Date.now() / 1000)): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => { const i = kv.indexOf("="); return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()]; }));
  const t = Number(parts.t);
  const sigs = header.split(",").filter((p) => p.trim().startsWith("v1=")).map((p) => p.trim().slice(3));
  if (!t || !sigs.length || Math.abs(nowSec - t) > 300) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${payload}`)));
  return sigs.some((s) => safeEqual(s, expected));
}

export const upsert = internalMutation({
  args: {
    userId: v.optional(v.string()),
    customerId: v.string(),
    subscriptionId: v.optional(v.string()),
    status: v.string(),
    priceId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, a) => {
    let row = await ctx.db.query("subscriptions").withIndex("by_customer", (q) => q.eq("stripeCustomerId", a.customerId)).first();
    let userId = row?.userId ?? null;
    if (!userId && a.userId) userId = ctx.db.normalizeId("users", a.userId);
    if (!userId) { console.warn(`Stripe customer ${a.customerId} not linked to a member yet`); return false; }
    if (!row) row = await ctx.db.query("subscriptions").withIndex("by_user", (q) => q.eq("userId", userId!)).first();
    const doc = {
      userId, stripeCustomerId: a.customerId,
      stripeSubscriptionId: a.subscriptionId ?? row?.stripeSubscriptionId,
      status: a.status, priceId: a.priceId ?? row?.priceId,
      currentPeriodEnd: a.currentPeriodEnd ?? row?.currentPeriodEnd,
      cancelAtPeriodEnd: a.cancelAtPeriodEnd ?? row?.cancelAtPeriodEnd,
      updatedAt: Date.now(),
    };
    if (row) await ctx.db.patch(row._id, doc); else await ctx.db.insert("subscriptions", doc);
    return true;
  },
});

export const webhook = httpAction(async (ctx, req) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Not configured", { status: 500 });
  const payload = await req.text();
  if (!(await verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret))) {
    return new Response("Bad signature", { status: 400 });
  }
  const event = JSON.parse(payload) as { type: string; data: { object: any } };
  const o = event.data.object;
  if (event.type === "checkout.session.completed" && o.mode === "subscription" && o.customer) {
    await ctx.runMutation(internal.billing.upsert, {
      userId: o.client_reference_id ?? o.metadata?.userId, customerId: String(o.customer),
      subscriptionId: o.subscription ? String(o.subscription) : undefined, status: "active",
    });
  } else if (event.type.startsWith("customer.subscription.")) {
    const item = o.items?.data?.[0];
    await ctx.runMutation(internal.billing.upsert, {
      userId: o.metadata?.userId, customerId: String(o.customer), subscriptionId: String(o.id),
      status: event.type === "customer.subscription.deleted" ? "canceled" : String(o.status),
      priceId: item?.price?.id, currentPeriodEnd: (o.current_period_end ?? item?.current_period_end) ? (o.current_period_end ?? item.current_period_end) * 1000 : undefined,
      cancelAtPeriodEnd: !!o.cancel_at_period_end,
    });
  }
  return new Response("ok", { status: 200 });
});
