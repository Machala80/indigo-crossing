import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // One private journal per member, stored as a JSON string.
  journals: defineTable({
    userId: v.id("users"),
    data: v.string(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Members who asked for a daily reminder email.
  reminders: defineTable({
    userId: v.id("users"),
    email: v.string(),
    slot: v.union(v.literal("morning"), v.literal("evening")),
    on: v.boolean(),
    consentAt: v.number(),
    consent: v.string(),
    token: v.string(),
    lastSentDay: v.optional(v.string()),
    lastSundaySent: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_slot_on", ["slot", "on"])
    .index("by_token", ["token"]),

  // Crossing Plus subscriptions, kept in step with Stripe by its webhook.
  subscriptions: defineTable({
    userId: v.id("users"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.optional(v.string()),
    status: v.string(),
    priceId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_customer", ["stripeCustomerId"]),

  // Phone notifications: one row per device that has switched them on.
  pushSubs: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    morning: v.optional(v.string()), // "07:30" etc, or absent for off
    evening: v.optional(v.string()),
    sunday: v.boolean(),
    sent: v.optional(v.record(v.string(), v.string())), // kind -> last date sent
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),

  // Indigo Estate members (emails added by an owner). A confirmed account with one of these emails gets Plus.
  members: defineTable({
    email: v.string(),
    addedAt: v.number(),
  }).index("by_email", ["email"]),

  // How many Mirror reflections each member used per day (cost control).
  mirrorUsage: defineTable({
    userId: v.id("users"),
    day: v.string(),
    count: v.number(),
  }).index("by_user_day", ["userId", "day"]),
});
