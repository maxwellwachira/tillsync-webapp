import type { Claim, Payment } from './types';

const cell = (v: string | number) => {
  const s = String(v);
  // Quote anything with a comma, quote or newline; and neutralise values a spreadsheet would run as a formula.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** The payments as a CSV, newest first as shown, in the viewer's local time. */
export function paymentsCsv(payments: Payment[], claims?: ReadonlyMap<string, Claim>): string {
  const rows = [['Code', 'Amount (KSh)', 'Payer', 'Phone (as M-Pesa shows it)', 'Received', 'Sold by']];
  for (const p of payments) {
    const d = new Date(p.receivedAt);
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    rows.push([p.code, String(p.amount), p.payerDisplay, p.phoneMasked, stamp, claims?.get(p.code)?.displayName ?? '']);
  }
  return rows.map((r) => r.map(cell).join(',')).join('\r\n');
}

export function downloadCsv(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
