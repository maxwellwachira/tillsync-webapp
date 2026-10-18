import { periodLabel, type PeriodKind } from './period.ts';
import type { Report } from './report.ts';

/** 2,500. Local so this file has no dependency on the app, and can be tested on its own. */
const formatAmount = (n: number) => n.toLocaleString('en-KE');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ksh = (n: number) => `KSh ${formatAmount(n)}`;
const clock = (ms: number) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
const dayName = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

const TITLE: Record<PeriodKind, string> = { day: 'Daily report', week: 'Weekly report', month: 'Monthly report', custom: 'Report' };

/** The printable report. Plain, black on white, readable when photocopied. Escapes every name and message field. */
export function reportHtml(r: Report, business: string, generatedAt: number): string {
  const rows = r.rows
    .map(
      ({ payment: p, soldBy }) =>
        `<tr><td class="num">${formatAmount(p.amount)}</td><td class="mono">${esc(p.code)}</td><td>${esc(p.payerDisplay || '')}</td><td class="mono">${esc(p.phoneMasked || '')}</td><td>${r.period.kind === 'day' ? clock(p.receivedAt) : `${dayName(p.receivedAt)}, ${clock(p.receivedAt)}`}</td><td>${esc(soldBy)}</td></tr>`,
    )
    .join('');
  const people = r.people.map((p) => `<tr><td>${esc(p.name)}</td><td class="num">${p.count}</td><td class="num">${formatAmount(p.total)}</td></tr>`).join('');
  const days = r.days.map((d) => `<tr><td>${dayName(d.day)}</td><td class="num">${d.count}</td><td class="num">${formatAmount(d.total)}</td></tr>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
@page { margin: 18mm 14mm; }
body { font-family: Helvetica, Arial, sans-serif; color: #111; font-size: 11px; line-height: 1.45; }
h1 { font-size: 20px; margin: 0; }
h2 { font-size: 13px; margin: 22px 0 6px; }
.sub { color: #555; margin: 2px 0 0; }
.sum { display: flex; gap: 28px; margin-top: 16px; }
.sum div { min-width: 90px; }
.sum b { display: block; font-size: 18px; }
.sum span { color: #555; font-size: 10px; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; font-size: 10px; color: #555; border-bottom: 1.5px solid #111; padding: 4px 6px 4px 0; }
td { padding: 4px 6px 4px 0; border-bottom: 1px solid #ddd; vertical-align: top; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
th.num { text-align: right; }
.mono { font-family: Menlo, Courier, monospace; font-size: 10px; }
.foot { margin-top: 18px; color: #555; font-size: 9.5px; }
tr { page-break-inside: avoid; }
</style></head><body>
<h1>${esc(business)}</h1>
<p class="sub">${TITLE[r.period.kind]} · ${esc(periodLabel(r.period))}</p>
<div class="sum">
  <div><b>${ksh(r.total)}</b><span>Received</span></div>
  <div><b>${r.count}</b><span>Payments</span></div>
  <div><b>${r.count ? ksh(r.average) : '—'}</b><span>Average</span></div>
  ${r.period.kind === 'day' ? `<div><b>${r.busiestHour === null ? '—' : `${String(r.busiestHour).padStart(2, '0')}:00`}</b><span>Busiest hour</span></div>` : `<div><b>${r.bestDay ? dayName(r.bestDay.day) : '—'}</b><span>Best day</span></div>`}
</div>
${r.period.kind === 'day' ? '' : `<h2>By day</h2><table><thead><tr><th>Day</th><th class="num">Payments</th><th class="num">KSh</th></tr></thead><tbody>${days}</tbody></table>`}
<h2>Sales by person</h2>
${people || r.unclaimed.count ? `<table><thead><tr><th>Name</th><th class="num">Sales</th><th class="num">KSh</th></tr></thead><tbody>${people}${r.unclaimed.count ? `<tr><td>Unclaimed</td><td class="num">${r.unclaimed.count}</td><td class="num">${formatAmount(r.unclaimed.total)}</td></tr>` : ''}</tbody></table>` : '<p class="sub">No payments in this period.</p>'}
<h2>Payments</h2>
${r.count ? `<table><thead><tr><th class="num">KSh</th><th>Code</th><th>Payer</th><th>Phone</th><th>Received</th><th>Sold by</th></tr></thead><tbody>${rows}</tbody></table>` : '<p class="sub">No payments in this period.</p>'}
<p class="foot">Generated ${esc(new Date(generatedAt).toLocaleString('en-GB'))}. Totals count the M-Pesa confirmation messages received on the Till phone. They are not verified settlement: check your M-Pesa statement for large payments.</p>
</body></html>`;
}
