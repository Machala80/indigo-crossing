"use node";
// Sends phone notifications. Runs in Convex's Node environment because the
// web-push library needs Node's encryption tools.
import webpush from "web-push";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { londonNow } from "./londonTime";
import { dueKinds, halfHour, message } from "./pushPlan";

function setup(): boolean {
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:enquiries@indigoestate.co.uk", pub, priv);
  return true;
}

type Target = { id: any; endpoint: string; p256dh: string; auth: string };

/** Sends one notification. Returns "gone" when the device has switched off or moved on. */
async function sendOne(t: Target, payload: object): Promise<"ok" | "gone" | "failed"> {
  try {
    await webpush.sendNotification({ endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } }, JSON.stringify(payload), { TTL: 6 * 3600, urgency: "normal" });
    return "ok";
  } catch (e: any) {
    if (e && (e.statusCode === 404 || e.statusCode === 410)) return "gone";
    console.error(`Push failed (${e?.statusCode ?? "?"}): ${String(e?.body ?? e?.message ?? e).slice(0, 200)}`);
    return "failed";
  }
}

/** Runs every 30 minutes: sends whatever each device asked for at this UK time. */
export const tick = internalAction({
  args: {},
  handler: async (ctx) => {
    if (!setup()) return { sent: 0, skipped: "not configured" };
    const t = londonNow();
    const hhmm = halfHour(t.hour, t.minute);
    const appUrl = process.env.APP_URL || "https://crossing.indigoestate.co.uk";
    const subs = await ctx.runQuery(internal.push.all, {});
    let sent = 0;
    for (const s of subs) {
      for (const kind of dueKinds(s, hhmm, t.weekday, t.dateKey)) {
        const r = await sendOne(s, message(kind, appUrl, t));
        if (r === "gone") { await ctx.runMutation(internal.push.remove, { id: s.id }); break; }
        if (r === "ok") { await ctx.runMutation(internal.push.markSent, { id: s.id, kind, dateKey: t.dateKey }); sent++; }
      }
    }
    return { sent };
  },
});

/** "Send me a test notification" from the app. */
export const test = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Please sign in again.");
    if (!setup()) throw new ConvexError("Phone notifications aren't switched on yet.");
    const appUrl = process.env.APP_URL || "https://crossing.indigoestate.co.uk";
    const devices = await ctx.runQuery(internal.push.forUser, { userId });
    let ok = 0;
    for (const d of devices) {
      const r = await sendOne(d, { title: "The Crossing", body: "Notifications are working. You’ll hear from us at the times you chose.", url: `${appUrl}/#today`, tag: "test" });
      if (r === "gone") await ctx.runMutation(internal.push.remove, { id: d.id });
      if (r === "ok") ok++;
    }
    return ok;
  },
});
