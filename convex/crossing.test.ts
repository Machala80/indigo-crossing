/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { api, internal } from "./_generated/api";
import { londonNow } from "./londonTime";

const modules = import.meta.glob("./**/*.ts");

async function member(t: ReturnType<typeof convexTest>, email: string) {
  const userId = await t.run(async (ctx) => ctx.db.insert("users", { email }));
  return { userId, as: t.withIdentity({ subject: `${userId}|session-${email}` }) };
}

describe("journals are private", () => {
  test("each member only ever sees their own journal", async () => {
    const t = convexTest(schema, modules);
    const a = await member(t, "a@example.com");
    const b = await member(t, "b@example.com");
    await a.as.mutation(api.journal.save, { data: JSON.stringify({ patterns: [{ name: "A's secret" }] }) });
    const mineA = await a.as.query(api.journal.get, {});
    expect(JSON.parse(mineA!.data!).patterns[0].name).toBe("A's secret");
    expect(mineA!.email).toBe("a@example.com");
    const mineB = await b.as.query(api.journal.get, {});
    expect(mineB!.data).toBeNull();
    await b.as.mutation(api.journal.save, { data: JSON.stringify({ patterns: [] }) });
    const againA = await a.as.query(api.journal.get, {});
    expect(JSON.parse(againA!.data!).patterns[0].name).toBe("A's secret");
  });

  test("signed-out visitors get nothing and cannot save", async () => {
    const t = convexTest(schema, modules);
    expect(await t.query(api.journal.get, {})).toBeNull();
    await expect(t.mutation(api.journal.save, { data: "{}" })).rejects.toThrow(/sign in/);
  });

  test("rejects data that is not valid JSON", async () => {
    const t = convexTest(schema, modules);
    const a = await member(t, "a@example.com");
    await expect(a.as.mutation(api.journal.save, { data: "{not json" })).rejects.toThrow(/not valid/);
  });

  test("saving twice updates one journal, not two", async () => {
    const t = convexTest(schema, modules);
    const a = await member(t, "a@example.com");
    await a.as.mutation(api.journal.save, { data: '{"v":1}' });
    await a.as.mutation(api.journal.save, { data: '{"v":2}' });
    const rows = await t.run((ctx) => ctx.db.query("journals").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0].data).toBe('{"v":2}');
  });
});

describe("reminders", () => {
  test("sign up, send once per day, unsubscribe by link", async () => {
    const t = convexTest(schema, modules);
    const a = await member(t, "a@example.com");
    await expect(a.as.mutation(api.reminders.set, { email: "nope", slot: "morning", consent: "yes" })).rejects.toThrow(/full email/);
    await a.as.mutation(api.reminders.set, { email: " A@Example.com ", slot: "morning", consent: "I agree" });
    expect(await a.as.query(api.reminders.mine, {})).toEqual({ email: "a@example.com", slot: "morning", on: true });

    const first = await t.action(internal.reminders.tick, { force: "morning" });
    expect(first).toEqual({ sent: 1, slot: "morning" });
    const second = await t.action(internal.reminders.tick, { force: "morning" });
    expect(second.sent).toBe(0);
    const evening = await t.action(internal.reminders.tick, { force: "evening" });
    expect(evening.sent).toBe(0);

    const row = await t.run(async (ctx) => (await ctx.db.query("reminders").collect())[0]);
    const bad = await t.fetch("/unsubscribe?t=xyz", { method: "GET" });
    expect(await bad.text()).toMatch(/isn’t valid/);
    const res = await t.fetch(`/unsubscribe?t=${row.token}`, { method: "GET" });
    expect(await res.text()).toMatch(/Reminders stopped/);
    expect(await a.as.query(api.reminders.mine, {})).toBeNull();
    const again = await t.fetch(`/unsubscribe?t=${row.token}`, { method: "POST" });
    expect(await again.text()).toMatch(/Already stopped/);
  });

  test("a member can stop their own reminders", async () => {
    const t = convexTest(schema, modules);
    const a = await member(t, "a@example.com");
    await a.as.mutation(api.reminders.set, { email: "a@example.com", slot: "evening", consent: "I agree" });
    await a.as.mutation(api.reminders.stop, {});
    expect(await a.as.query(api.reminders.mine, {})).toBeNull();
  });
});

describe("delete account", () => {
  test("removes journal, reminders and the user", async () => {
    const t = convexTest(schema, modules);
    const a = await member(t, "a@example.com");
    const b = await member(t, "b@example.com");
    await a.as.mutation(api.journal.save, { data: "{}" });
    await b.as.mutation(api.journal.save, { data: "{}" });
    await a.as.mutation(api.reminders.set, { email: "a@example.com", slot: "morning", consent: "I agree" });
    await a.as.mutation(api.journal.deleteAccount, { confirm: "DELETE" });
    const left = await t.run(async (ctx) => ({
      journals: await ctx.db.query("journals").collect(),
      reminders: await ctx.db.query("reminders").collect(),
      users: await ctx.db.query("users").collect(),
    }));
    expect(left.journals).toHaveLength(1);
    expect(left.reminders).toHaveLength(0);
    expect(left.users.map((u) => u.email)).toEqual(["b@example.com"]);
  });
});

describe("the Mirror", () => {
  test("is off without an API key, and caps use per day", async () => {
    const t = convexTest(schema, modules);
    expect(await t.query(api.mirror.enabled, {})).toBe(false);
    const a = await member(t, "a@example.com");
    await expect(a.as.action(api.mirror.pattern, { p: { name: "x" } })).rejects.toThrow(/switched on/);
    // A refused call (Mirror switched off) must not use up the daily allowance.
    const today = londonNow().dateKey;
    for (let i = 0; i < 12; i++) expect(await t.mutation(internal.mirror.useOne, { userId: a.userId, day: today })).toBe(true);
    expect(await t.mutation(internal.mirror.useOne, { userId: a.userId, day: today })).toBe(false);
    expect(await t.mutation(internal.mirror.useOne, { userId: a.userId, day: "2099-01-01" })).toBe(true);
    await expect(t.action(api.mirror.pattern, { p: { name: "x" } })).rejects.toThrow(/sign in/);
    const yearArgs = { goal: "Publish my book", identity: "finishes", why: "", season: "Seedtime", milestone: "", week: "2", recent: "" };
    await expect(t.action(api.mirror.year, yearArgs)).rejects.toThrow(/sign in/);
    const b = await member(t, "b@example.com");
    await expect(b.as.action(api.mirror.year, yearArgs)).rejects.toThrow(/switched on/);
  });
});

describe("UK clock", () => {
  test("handles GMT and British Summer Time", () => {
    expect(londonNow(Date.parse("2026-11-15T07:30:00Z"))).toMatchObject({ hour: 7, minute: 30, bst: false, dateKey: "2026-11-15" });
    expect(londonNow(Date.parse("2026-07-01T06:30:00Z"))).toMatchObject({ hour: 7, minute: 30, bst: true });
    expect(londonNow(Date.parse("2026-03-29T00:59:00Z")).bst).toBe(false);
    expect(londonNow(Date.parse("2026-03-29T01:00:00Z")).bst).toBe(true);
    expect(londonNow(Date.parse("2026-10-25T00:59:00Z")).bst).toBe(true);
    expect(londonNow(Date.parse("2026-10-25T01:00:00Z")).bst).toBe(false);
    expect(londonNow(Date.parse("2026-06-30T23:30:00Z")).dateKey).toBe("2026-07-01");
  });
});

import { verifyStripeSignature } from "./billing";

async function signed(payload: string, secret: string, t = Math.floor(Date.now() / 1000)) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${payload}`))), (b) => b.toString(16).padStart(2, "0")).join("");
  return `t=${t},v1=${sig}`;
}

describe("Crossing Plus and Stripe", () => {
  test("signature check accepts real, rejects forged and stale", async () => {
    const body = '{"a":1}';
    expect(await verifyStripeSignature(body, await signed(body, "whsec_test"), "whsec_test")).toBe(true);
    expect(await verifyStripeSignature(body, await signed(body, "wrong"), "whsec_test")).toBe(false);
    expect(await verifyStripeSignature(body, await signed(body, "whsec_test", 1000), "whsec_test")).toBe(false);
    expect(await verifyStripeSignature(body, null, "whsec_test")).toBe(false);
  });

  test("webhook turns Plus on and off", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const t = convexTest(schema, modules);
    const a = await member(t, "a@example.com");
    expect((await a.as.query(api.billing.status, {}))!.plus).toBe(false);

    const bad = await t.fetch("/stripe-webhook", { method: "POST", body: "{}", headers: { "stripe-signature": "t=1,v1=00" } });
    expect(bad.status).toBe(400);

    const done = JSON.stringify({ type: "checkout.session.completed", data: { object: { mode: "subscription", customer: "cus_1", subscription: "sub_1", client_reference_id: a.userId } } });
    expect((await t.fetch("/stripe-webhook", { method: "POST", body: done, headers: { "stripe-signature": await signed(done, "whsec_test") } })).status).toBe(200);
    expect((await a.as.query(api.billing.status, {}))!.plus).toBe(true);

    const upd = JSON.stringify({ type: "customer.subscription.updated", data: { object: { id: "sub_1", customer: "cus_1", status: "active", cancel_at_period_end: true, items: { data: [{ price: { id: "price_m" }, current_period_end: 1900000000 }] } } } });
    await t.fetch("/stripe-webhook", { method: "POST", body: upd, headers: { "stripe-signature": await signed(upd, "whsec_test") } });
    const st = (await a.as.query(api.billing.status, {}))!;
    expect(st).toMatchObject({ plus: true, cancelAtPeriodEnd: true, periodEnd: 1900000000000 });

    const del = JSON.stringify({ type: "customer.subscription.deleted", data: { object: { id: "sub_1", customer: "cus_1", status: "canceled", items: { data: [] } } } });
    await t.fetch("/stripe-webhook", { method: "POST", body: del, headers: { "stripe-signature": await signed(del, "whsec_test") } });
    expect((await a.as.query(api.billing.status, {}))!.plus).toBe(false);
  });

  test("can't delete an account while still paying", async () => {
    const t = convexTest(schema, modules);
    const a = await member(t, "a@example.com");
    await t.run(async (ctx) => ctx.db.insert("subscriptions", { userId: a.userId, stripeCustomerId: "cus_2", status: "active", updatedAt: 0 }));
    await expect(a.as.mutation(api.journal.deleteAccount, { confirm: "DELETE" })).rejects.toThrow(/Cancel it first/);
  });

  test("owner gets Plus and counts; members get nothing from the dashboard", async () => {
    process.env.ADMIN_EMAILS = "owner@example.com";
    const t = convexTest(schema, modules);
    const owner = await member(t, "owner@example.com");
    const a = await member(t, "a@example.com");
    await a.as.mutation(api.journal.save, { data: JSON.stringify({ patterns: [{ name: "secret", released: true }], checks: { "2099-01-01": { p: "held" } }, year: { goal: "x", start: "2026-11-16" } }) });
    expect(await a.as.query(api.admin.stats, {})).toBeNull();
    const s = (await owner.as.query(api.admin.stats, {}))!;
    expect(s).toMatchObject({ members: 2, patterns: 1, released: 1, years: 1, checkins7: 1 });
    expect(JSON.stringify(s)).not.toContain("secret");
    expect((await owner.as.query(api.billing.status, {}))!.plus).toBe(true);
    delete process.env.ADMIN_EMAILS;
  });

  test("the Mirror needs Plus once it's switched on", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    const t = convexTest(schema, modules);
    const a = await member(t, "a@example.com");
    expect(await t.query(api.mirror.enabled, {})).toBe(true);
    await expect(a.as.action(api.mirror.pattern, { p: { name: "x" } })).rejects.toThrow(/part of Crossing Plus/);
    delete process.env.ANTHROPIC_API_KEY;
  });
});

describe("Sunday review email", () => {
  test("goes once to members with a Sovereign Year and reminders on", async () => {
    const t = convexTest(schema, modules);
    const a = await member(t, "a@example.com");
    const b = await member(t, "b@example.com");
    await a.as.mutation(api.journal.save, { data: JSON.stringify({ year: { goal: "Publish my book", start: "2026-11-01" } }) });
    await b.as.mutation(api.journal.save, { data: JSON.stringify({ patterns: [] }) });
    await a.as.mutation(api.reminders.set, { email: "a@example.com", slot: "morning", consent: "I agree" });
    await b.as.mutation(api.reminders.set, { email: "b@example.com", slot: "evening", consent: "I agree" });
    expect(await t.action(internal.reminders.sunday, { force: true })).toEqual({ sent: 1 });
    expect(await t.action(internal.reminders.sunday, { force: true })).toEqual({ sent: 0 });
  });
});

import { vi } from "vitest";
describe("checkout safety net", () => {
  test("switches Plus on from a completed checkout, only for the member who paid", async () => {
    process.env.STRIPE_SECRET_KEY = "rk_test_x";
    const t = convexTest(schema, modules);
    const a = await member(t, "a@example.com");
    const b = await member(t, "b@example.com");
    const session = (owner: string) => ({ id: "cs_test_1", mode: "subscription", status: "complete", customer: "cus_9", client_reference_id: owner,
      subscription: { id: "sub_9", status: "active", cancel_at_period_end: false, items: { data: [{ price: { id: "price_m" }, current_period_end: 1900000000 }] } } });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(session(a.userId)), { status: 200 })));
    expect(await b.as.action(api.billing.confirm, { sessionId: "cs_test_1" })).toBe(false);
    expect((await b.as.query(api.billing.status, {}))!.plus).toBe(false);
    expect(await a.as.action(api.billing.confirm, { sessionId: "cs_test_1" })).toBe(true);
    expect((await a.as.query(api.billing.status, {}))!).toMatchObject({ plus: true, periodEnd: 1900000000000 });
    expect(await a.as.action(api.billing.confirm, { sessionId: "not-a-session" })).toBe(false);
    vi.unstubAllGlobals();
    delete process.env.STRIPE_SECRET_KEY;
  });
});
