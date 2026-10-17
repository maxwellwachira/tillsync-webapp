/** 2,500 */
export function formatAmount(n: number): string {
  return n.toLocaleString('en-KE');
}

/** 09:41 AM in the viewer's local time. */
export function formatClock(ms: number): string {
  const d = new Date(ms);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ap}`;
}

export function formatClockSeconds(ms: number): string {
  const d = new Date(ms);
  return `${formatClock(ms).slice(0, 5)}:${String(d.getSeconds()).padStart(2, '0')} ${formatClock(ms).slice(-2)}`;
}

const DAY = 24 * 3_600_000;

export function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function formatDay(ms: number, now = Date.now()): string {
  const diff = Math.round((startOfDay(now) - startOfDay(ms)) / DAY);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return new Date(ms).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** "just now", "3 min ago", "1 h 5 min ago", then a date once it is older than a day. */
export function formatAgo(ms: number, now = Date.now()): string {
  const mins = Math.floor((now - ms) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 24 * 60) return `${Math.floor(mins / 60)} h ${mins % 60} min ago`;
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || '?'
  );
}

export function greeting(now = Date.now()): string {
  const h = new Date(now).getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}
