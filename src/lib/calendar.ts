const MONTH_PARAM_RE = /^(\d{4})-(\d{2})$/;

/** Parses a "YYYY-MM" search param into a first-of-month Date (UTC), falling back to the current month. */
export function parseMonthParam(month: string | undefined): Date {
  const match = month ? MONTH_PARAM_RE.exec(month) : null;
  if (match) {
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  }
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function monthParam(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));
}

function toDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

/** Full 6-week grid (42 days, Sun-start) covering the given month plus lead/trail days. */
export function buildMonthGrid(monthStart: Date): { date: Date; inMonth: boolean; key: string }[][] {
  const firstWeekday = monthStart.getUTCDay(); // 0=Sun
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(gridStart.getUTCDate() - firstWeekday);

  const weeks: { date: Date; inMonth: boolean; key: string }[][] = [];
  const cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week: { date: Date; inMonth: boolean; key: string }[] = [];
    for (let d = 0; d < 7; d++) {
      week.push({
        date: new Date(cursor),
        inMonth: cursor.getUTCMonth() === monthStart.getUTCMonth(),
        key: toDateKey(cursor),
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export { toDateKey };
