/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
import { generateKeyPair, exportPKCS8, exportJWK } from "jose";

const modules = import.meta.glob("./**/*.ts");

test("sign-up needs the emailed code before it lets you in", async () => {
  const { privateKey, publicKey } = await generateKeyPair("RS256", { extractable: true });
  process.env.JWT_PRIVATE_KEY = (await exportPKCS8(privateKey)).trimEnd().replace(/\n/g, " ");
  process.env.JWKS = JSON.stringify({ keys: [{ use: "sig", ...(await exportJWK(publicKey)) }] });
  process.env.CONVEX_SITE_URL = "https://example.convex.site";
  process.env.SITE_URL = "https://crossing.example";
  process.env.BREVO_API_KEY = "test"; process.env.BREVO_SENDER_EMAIL = "hello@example.com";
  const sent: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (_u: string, init: any) => { sent.push(JSON.parse(init.body).textContent); return new Response("{}", { status: 201 }); }));

  const t = convexTest(schema, modules);
  const r1: any = await t.action(api.auth.signIn, { provider: "password", params: { email: "New@Example.com", password: "longenough", flow: "signUp" } });
  expect(r1.tokens ?? null).toBeNull();                         // not signed in yet
  expect(sent.length).toBe(1);
  expect(sent[0]).toMatch(/confirm your email/);
  const code = sent[0].match(/\d{8}/)![0];

  // Wrong password can't be used to dodge it; signing in again just sends a fresh code.
  const r2: any = await t.action(api.auth.signIn, { provider: "password", params: { email: "new@example.com", password: "longenough", flow: "signIn" } });
  expect(r2.tokens ?? null).toBeNull();
  const code2 = sent[1].match(/\d{8}/)![0];

  const bad: any = await t.action(api.auth.signIn, { provider: "password", params: { email: "new@example.com", code: "00000000", flow: "email-verification" } }).catch((e) => ({ err: String(e) }));
  expect(bad.tokens ?? null).toBeNull();

  const ok: any = await t.action(api.auth.signIn, { provider: "password", params: { email: "new@example.com", code: code2, flow: "email-verification" } });
  expect(ok.tokens?.token).toBeTruthy();
  const user = await t.run(async (ctx) => ctx.db.query("users").first());
  expect(user!.email).toBe("new@example.com");
  expect(user!.emailVerificationTime).toBeTruthy();
  void code;
  vi.unstubAllGlobals();
});
