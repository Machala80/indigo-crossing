// UK clock time without relying on time-zone data in the server runtime.
// British Summer Time runs from 01:00 UTC on the last Sunday of March
// to 01:00 UTC on the last Sunday of October.

function lastSundayUTC(year: number, monthIndex: number): number {
  const d = new Date(Date.UTC(year, monthIndex + 1, 0, 1, 0, 0)); // last day of month, 01:00 UTC
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.getTime();
}

export function londonNow(nowMs: number = Date.now()) {
  const y = new Date(nowMs).getUTCFullYear();
  const bst = nowMs >= lastSundayUTC(y, 2) && nowMs < lastSundayUTC(y, 9);
  const local = new Date(nowMs + (bst ? 3600000 : 0));
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
    dateKey: `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}-${String(local.getUTCDate()).padStart(2, "0")}`,
    bst,
  };
}
