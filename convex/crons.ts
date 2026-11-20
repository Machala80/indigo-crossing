import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
// Every half hour; the action itself decides whether it is 07:30 or 20:00 in the UK.
crons.cron("daily reminders", "0,30 * * * *", internal.reminders.tick, {});
// Sundays 18:00 UK time: "close your week" for members with a Sovereign Year.
crons.cron("sunday review emails", "0,30 * * * *", internal.reminders.sunday, {});
// Phone notifications at the times each member chose (UK time).
crons.cron("phone notifications", "0,30 * * * *", internal.pushNode.tick, {});
export default crons;
