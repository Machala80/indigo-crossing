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
    for (let i = 0; i < 11; i++) expect(await t.mutation(internal.mirror.useOne, { userId: a.userId, day: "2026-11-15" })).toBe(true);
    expect(await t.mutation(internal.mirror.useOne, { userId: a.userId, day: "2026-11-15" })).toBe(false);
    expect(await t.mutation(internal.mirror.useOne, { userId: a.userId, day: "2026-11-16" })).toBe(true);
    await expect(t.action(api.mirror.pattern, { p: { name: "x" } })).rejects.toThrow(/sign in/);
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
