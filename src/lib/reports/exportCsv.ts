import type { Report } from './report.ts';

const cell = (v: string | number) => {
  const s = String(v);
  // Quote anything with a comma, quote or newline; and neutralise values a spreadsheet would run as a formula.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

const stamp = (ms: number) => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

/** The report's payments as CSV, newest first, in local time. One row per payment, with who made the sale. */
export function reportCsv(r: Report): string {
  const rows: (string | number)[][] = [['Code', 'Amount (KSh)', 'Payer', 'Phone (as M-Pesa shows it)', 'Received', 'Sold by']];
  for (const { payment: p, soldBy } of r.rows) rows.push([p.code, p.amount, p.payerDisplay, p.phoneMasked, stamp(p.receivedAt), soldBy]);
  return rows.map((x) => x.map(cell).join(',')).join('\r\n');
}
