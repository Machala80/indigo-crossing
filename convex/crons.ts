import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
// Every half hour; the action itself decides whether it is 07:30 or 20:00 in the UK.
crons.cron("daily reminders", "0,30 * * * *", internal.reminders.tick, {});
export default crons;
