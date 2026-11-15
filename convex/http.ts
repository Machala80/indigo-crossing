import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { unsubscribe } from "./reminders";

const http = httpRouter();
auth.addHttpRoutes(http);
http.route({ path: "/unsubscribe", method: "GET", handler: unsubscribe });
export default http;
// One-click unsubscribe from mail apps (RFC 8058) posts to the same address.
http.route({ path: "/unsubscribe", method: "POST", handler: unsubscribe });
