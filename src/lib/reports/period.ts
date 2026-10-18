/** Report periods in local time. Weeks run Monday to Sunday, as they do in Kenya. */
export type PeriodKind = 'day' | 'week' | 'month' | 'custom';

export type Period = {
  kind: PeriodKind;
  /** Inclusive start (local midnight), epoch ms. */
  from: number;
  /** Exclusive end (local midnight of the next period), epoch ms. */
  to: number;
};

const midnight = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** The period of `kind` that contains `ms`. */
export function periodAt(kind: PeriodKind, ms: number): Period {
  const d = midnight(ms);
  if (kind === 'day') {
    const to = new Date(d);
    to.setDate(to.getDate() + 1);
    return { kind, from: d.getTime(), to: to.getTime() };
  }
  if (kind === 'week') {
    const back = (d.getDay() + 6) % 7; // Monday = 0
    d.setDate(d.getDate() - back);
    const to = new Date(d);
    to.setDate(to.getDate() + 7);
    return { kind, from: d.getTime(), to: to.getTime() };
  }
  const from = new Date(d.getFullYear(), d.getMonth(), 1);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { kind, from: from.getTime(), to: to.getTime() };
}

/** The period just before or after `p` (`step` -1 or 1). */
export function shiftPeriod(p: Period, step: -1 | 1): Period {
  if (p.kind === 'custom') {
    const days = dayCount(p);
    const from = new Date(p.from);
    from.setDate(from.getDate() + step * days);
    return customPeriod(from.getTime(), new Date(from.getFullYear(), from.getMonth(), from.getDate() + days - 1).getTime());
  }
  return periodAt(p.kind, step === 1 ? p.to : p.from - 1);
}

/** A report over any run of whole days, `startDay` to `endDay` inclusive (any time within each day). */
export function customPeriod(startDay: number, endDay: number): Period {
  const a = midnight(Math.min(startDay, endDay));
  const b = midnight(Math.max(startDay, endDay));
  const to = new Date(b);
  to.setDate(to.getDate() + 1);
  return { kind: 'custom', from: a.getTime(), to: to.getTime() };
}

/** Calendar days in a period (23 and 25 hour days around a clock change still count as one). */
export function dayCount(p: Period): number {
  return Math.round((p.to - p.from) / 86_400_000);
}

/** The longest range a custom report can cover. */
export const MAX_CUSTOM_DAYS = 366;

/** The latest period a report can show: the one that contains `now`. */
export function isCurrent(p: Period, now: number): boolean {
  return now >= p.from && now < p.to;
}

const DAY = (ms: number, opts: Intl.DateTimeFormatOptions) => new Date(ms).toLocaleDateString('en-GB', opts);

/** “Sat 17 Oct 2026”, “12 – 18 Oct 2026”, “October 2026”. */
export function periodLabel(p: Period): string {
  if (p.kind === 'day') return DAY(p.from, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  if (p.kind === 'month') return DAY(p.from, { month: 'long', year: 'numeric' });
  if (p.kind === 'custom' && dayCount(p) === 1) return DAY(p.from, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const last = p.to - 1;
  const sameMonth = new Date(p.from).getMonth() === new Date(last).getMonth();
  return sameMonth ? `${new Date(p.from).getDate()} – ${DAY(last, { day: 'numeric', month: 'short', year: 'numeric' })}` : `${DAY(p.from, { day: 'numeric', month: 'short' })} – ${DAY(last, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

/** “day”, “week”, “month” for sentences and file names. */
export const KIND_WORD: Record<PeriodKind, string> = { day: 'day', week: 'week', month: 'month', custom: 'range' };

/** A safe file name stem such as “2026-10-17”, “2026-10-12-to-2026-10-18” or “2026-10”. */
export function fileStem(p: Period): string {
  const iso = (ms: number) => {
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  if (p.kind === 'day') return iso(p.from);
  if (p.kind === 'month') return iso(p.from).slice(0, 7);
  if (p.kind === 'custom' && dayCount(p) === 1) return iso(p.from);
  return `${iso(p.from)}-to-${iso(p.to - 1)}`;
}


const NAMES: Record<Exclude<PeriodKind, 'custom'>, { current: string; last: string }> = {
  day: { current: 'Today', last: 'Yesterday' },
  week: { current: 'This week', last: 'Last week' },
  month: { current: 'This month', last: 'Last month' },
};

/** What a person calls this period: “Today”, “Yesterday”, “Last week”, or the plain date when it is older. */
export function relativeName(p: Period, now: number): string {
  if (p.kind === 'custom') {
    const n = dayCount(p);
    return n === 1 ? 'One day' : `${n} days`;
  }
  if (isCurrent(p, now)) return NAMES[p.kind].current;
  if (isCurrent(shiftPeriod(p, 1), now)) return NAMES[p.kind].last;
  return p.kind === 'day' ? DAY(p.from, { weekday: 'long' }) : p.kind === 'week' ? 'Week' : DAY(p.from, { month: 'long' });
}

/**
 * The window to compare against: the period before this one. A period still in progress is compared with the same
 * stretch of the one before it (today so far against yesterday at the same time), so a half-finished day is never
 * set against a whole one.
 */
export function comparison(p: Period, now: number): { from: number; to: number; label: string } {
  const prev = shiftPeriod(p, -1);
  if (p.kind === 'custom') {
    const n = dayCount(p);
    const live = isCurrent(p, now);
    return { from: prev.from, to: live ? Math.min(prev.to, prev.from + (now - p.from)) : prev.to, label: live ? `vs the same stretch ${n} days earlier` : `vs the ${n} days before` };
  }
  const current = isCurrent(p, now);
  const to = current ? Math.min(prev.to, prev.from + (now - p.from)) : prev.to;
  const word = p.kind === 'day' ? 'yesterday' : p.kind === 'week' ? 'last week' : 'last month';
  const before = p.kind === 'day' ? 'the day before' : p.kind === 'week' ? 'the week before' : 'the month before';
  return { from: prev.from, to, label: current ? (p.kind === 'day' ? 'vs yesterday at this time' : `vs the same point ${word}`) : `vs ${before}` };
}
