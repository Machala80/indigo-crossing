import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { unsubscribe } from "./reminders";
import { webhook } from "./billing";

const http = httpRouter();
auth.addHttpRoutes(http);
http.route({ path: "/unsubscribe", method: "GET", handler: unsubscribe });
export default http;
// One-click unsubscribe from mail apps (RFC 8058) posts to the same address.
http.route({ path: "/unsubscribe", method: "POST", handler: unsubscribe });
// Stripe tells us when a Plus subscription starts, changes or ends.
http.route({ path: "/stripe-webhook", method: "POST", handler: webhook });
