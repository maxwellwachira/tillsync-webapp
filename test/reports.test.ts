import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { reportCsv } from '../src/lib/reports/exportCsv.ts';
import { reportHtml } from '../src/lib/reports/exportHtml.ts';
import { comparison, fileStem, isCurrent, periodAt, periodLabel, relativeName, shiftPeriod } from '../src/lib/reports/period.ts';
import { buildReport } from '../src/lib/reports/report.ts';

const at = (m: number, d: number, h = 12, mi = 0) => new Date(2026, m - 1, d, h, mi).getTime(); // month is 1-based here
const pay = (code: string, amount: number, receivedAt: number, payerDisplay = 'Alex Brown') => ({ code, amount, payerDisplay, phoneMasked: '0712 ••• 481', receivedAt, syncedAt: receivedAt, tillId: 't' });
const claim = (code: string, uid: string, displayName: string) => ({ code, uid, displayName, claimedAt: 0 });

describe('periods', () => {
  it('a day runs midnight to midnight', () => {
    const p = periodAt('day', at(10, 17));
    assert.equal(p.from, at(10, 17, 0));
    assert.equal(p.to, at(10, 18, 0));
  });
  it('a week runs Monday to Sunday (17 Oct 2026 is a Saturday)', () => {
    const p = periodAt('week', at(10, 17));
    assert.equal(new Date(p.from).getDay(), 1);
    assert.equal(p.from, at(10, 12, 0));
    assert.equal(p.to, at(10, 19, 0));
    // A Sunday belongs to the week that started the Monday before.
    assert.equal(periodAt('week', at(10, 18)).from, at(10, 12, 0));
    assert.equal(periodAt('week', at(10, 19)).from, at(10, 19, 0));
  });
  it('a month is the calendar month, including a short February', () => {
    const p = periodAt('month', at(10, 17));
    assert.equal(p.from, at(10, 1, 0));
    assert.equal(p.to, at(11, 1, 0));
    const f = periodAt('month', at(2, 10));
    assert.equal((f.to - f.from) / 86_400_000, 28);
  });
  it('steps back and forward across month and year boundaries', () => {
    const jan = periodAt('month', at(1, 15));
    assert.equal(shiftPeriod(jan, -1).from, at(12, 1, 0) - 365 * 86_400_000 > 0 ? new Date(2025, 11, 1).getTime() : 0);
    assert.equal(shiftPeriod(periodAt('day', at(10, 31)), 1).from, at(11, 1, 0));
    assert.equal(shiftPeriod(periodAt('week', at(10, 17)), -1).from, at(10, 5, 0));
  });
  it('knows the current period', () => {
    const now = at(10, 17);
    assert.equal(isCurrent(periodAt('week', now), now), true);
    assert.equal(isCurrent(shiftPeriod(periodAt('week', now), -1), now), false);
  });
  it('labels and file names', () => {
    assert.equal(periodLabel(periodAt('month', at(10, 17))), 'October 2026');
    assert.equal(fileStem(periodAt('day', at(10, 17))), '2026-10-17');
    assert.equal(fileStem(periodAt('week', at(10, 17))), '2026-10-12-to-2026-10-18');
    assert.equal(fileStem(periodAt('month', at(10, 17))), '2026-10');
    assert.match(periodLabel(periodAt('week', at(10, 17))), /^12 – 18 Oct 2026$/);
    assert.match(periodLabel(periodAt('week', at(9, 30))), /Sept? – 4 Oct 2026$/);
  });
});

describe('buildReport', () => {
  const period = periodAt('week', at(10, 17));
  const payments = [pay('A', 2500, at(10, 17, 11)), pay('B', 1200, at(10, 17, 10)), pay('C', 800, at(10, 14, 9)), pay('D', 5000, at(10, 12, 8)), pay('OUT', 9999, at(10, 20, 8)), pay('PRE', 7777, at(10, 11, 23))];
  const claims = new Map([claim('A', 'jane', 'Jane Doe'), claim('C', 'jane', 'Jane Doe'), claim('D', 'sam', 'Sam Taylor')].map((c) => [c.code, c]));
  const r = buildReport(period, payments, claims);

  it('counts only payments inside the period', () => {
    assert.equal(r.count, 4);
    assert.equal(r.total, 9500);
    assert.equal(r.average, 2375);
  });
  it('has one row for every day, including quiet ones, oldest first', () => {
    assert.equal(r.days.length, 7);
    assert.equal(r.days[0]!.day, at(10, 12, 0));
    assert.deepEqual(r.days.map((d) => d.total), [5000, 0, 800, 0, 0, 3700, 0]);
    assert.equal(r.bestDay!.total, 5000);
  });
  it('splits by person, biggest first, with unclaimed kept apart', () => {
    assert.deepEqual(r.people.map((p) => [p.name, p.total, p.count]), [['Sam Taylor', 5000, 1], ['Jane Doe', 3300, 2]]);
    assert.deepEqual(r.unclaimed, { total: 1200, count: 1 });
  });
  it('lists payments newest first with who sold each', () => {
    assert.deepEqual(r.rows.map((x) => [x.payment.code, x.soldBy]), [['A', 'Jane Doe'], ['B', ''], ['C', 'Jane Doe'], ['D', 'Sam Taylor']]);
  });
  it('finds the busiest hour for a day', () => {
    const d = buildReport(periodAt('day', at(10, 17)), payments, claims);
    assert.equal(d.count, 2);
    assert.ok(d.busiestHour === 10 || d.busiestHour === 11);
  });
  it('is all zeros and safe when nothing happened', () => {
    const e = buildReport(period, [], new Map());
    assert.equal(e.total, 0);
    assert.equal(e.average, 0);
    assert.equal(e.bestDay, null);
    assert.equal(e.busiestHour, null);
    assert.equal(e.days.length, 7);
  });
  it('ignores a claim whose payment is not in the period', () => {
    const e = buildReport(period, [pay('A', 100, at(10, 17))], new Map([claim('GONE', 'jane', 'Jane')].map((c) => [c.code, c])));
    assert.equal(e.people.length, 0);
    assert.equal(e.unclaimed.count, 1);
  });
});

describe('exports', () => {
  const period = periodAt('day', at(10, 17));
  it('CSV has a header, one row per payment, and who sold it', () => {
    const r = buildReport(period, [pay('A', 2500, at(10, 17, 11), 'John Smith'), pay('B', 1200, at(10, 17, 10))], new Map([claim('A', 'jane', 'Jane Doe')].map((c) => [c.code, c])));
    const lines = reportCsv(r).split('\r\n');
    assert.equal(lines[0], 'Code,Amount (KSh),Payer,Phone (as M-Pesa shows it),Received,Sold by');
    assert.equal(lines.length, 3);
    assert.match(lines[1]!, /^A,2500,John Smith,0712 ••• 481,2026-10-17 11:00:00,Jane Doe$/);
    assert.match(lines[2]!, /,$/); // unclaimed: empty Sold by
  });
  it('CSV quotes commas and neutralises spreadsheet formulas', () => {
    const r = buildReport(period, [pay('A', 5, at(10, 17), '=HYPERLINK("x")'), pay('B', 6, at(10, 17, 13), 'Doe, John')], new Map());
    const csv = reportCsv(r);
    assert.ok(csv.includes("\"'=HYPERLINK(\"\"x\"\")\""));
    assert.ok(csv.includes('"Doe, John"'));
  });
  it('PDF html escapes names and states what the numbers are', () => {
    const r = buildReport(period, [pay('A', 2500, at(10, 17, 11), '<script>alert(1)</script>')], new Map([claim('A', 'x', 'A & B')].map((c) => [c.code, c])));
    const html = reportHtml(r, 'City <Fuel> Stop', at(10, 17, 20));
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(html.includes('City &lt;Fuel&gt; Stop'));
    assert.ok(html.includes('A &amp; B'));
    assert.ok(html.includes('not verified settlement'));
    assert.ok(html.includes('Daily report'));
  });
  it('PDF for an empty period says so instead of printing empty tables', () => {
    const html = reportHtml(buildReport(period, [], new Map()), 'Shop', at(10, 17));
    assert.ok(html.includes('No payments in this period.'));
  });
});

describe('friendly names and comparison', () => {
  const now = at(10, 17, 15);
  it('names the period the way people say it', () => {
    assert.equal(relativeName(periodAt('day', now), now), 'Today');
    assert.equal(relativeName(shiftPeriod(periodAt('day', now), -1), now), 'Yesterday');
    assert.equal(relativeName(periodAt('week', now), now), 'This week');
    assert.equal(relativeName(shiftPeriod(periodAt('week', now), -1), now), 'Last week');
    assert.equal(relativeName(periodAt('month', now), now), 'This month');
    assert.equal(relativeName(shiftPeriod(periodAt('month', now), -1), now), 'Last month');
    const threeBack = shiftPeriod(shiftPeriod(shiftPeriod(periodAt('day', now), -1), -1), -1);
    assert.equal(relativeName(threeBack, now), 'Wednesday');
  });
  it('compares a day in progress with yesterday up to the same time, never the whole day', () => {
    const c = comparison(periodAt('day', now), now);
    assert.equal(c.from, at(10, 16, 0));
    assert.equal(c.to, at(10, 16, 15));
    assert.equal(c.label, 'vs yesterday at this time');
  });
  it('compares a finished period with the whole one before it', () => {
    const day = shiftPeriod(periodAt('day', now), -1);
    const c = comparison(day, now);
    assert.equal(c.from, at(10, 15, 0));
    assert.equal(c.to, at(10, 16, 0));
    assert.equal(c.label, 'vs the day before');
  });
  it('a week in progress is compared with the same stretch of last week', () => {
    const c = comparison(periodAt('week', now), now);
    assert.equal(c.from, at(10, 5, 0));
    assert.equal(c.to - c.from, now - at(10, 12, 0));
  });
  it('the report keeps 24 hourly rows that add up to the total', () => {
    const r = buildReport(periodAt('day', now), [pay('A', 100, at(10, 17, 9)), pay('B', 250, at(10, 17, 9, 30)), pay('C', 50, at(10, 17, 14))], new Map());
    assert.equal(r.hours.length, 24);
    assert.equal(r.hours[9]!.total, 350);
    assert.equal(r.hours[9]!.count, 2);
    assert.equal(r.hours.reduce((n, h) => n + h.total, 0), r.total);
  });
});

import { customPeriod, dayCount } from '../src/lib/reports/period.ts';

describe('custom ranges', () => {
  it('covers whole days, either order, both ends included', () => {
    const p = customPeriod(at(10, 12, 15), at(10, 18, 3));
    assert.equal(p.kind, 'custom');
    assert.equal(p.from, at(10, 12, 0));
    assert.equal(p.to, at(10, 19, 0));
    assert.equal(dayCount(p), 7);
    assert.deepEqual(customPeriod(at(10, 18), at(10, 12)), p);
    assert.equal(dayCount(customPeriod(at(10, 17), at(10, 17))), 1);
  });
  it('steps by its own length and keeps the length', () => {
    const p = customPeriod(at(10, 12), at(10, 18));
    const back = shiftPeriod(p, -1);
    assert.equal(back.from, at(10, 5, 0));
    assert.equal(dayCount(back), 7);
    assert.equal(shiftPeriod(back, 1).from, p.from);
  });
  it('labels and compares', () => {
    const now = at(10, 17, 15);
    assert.equal(periodLabel(customPeriod(at(10, 12), at(10, 18))), '12 – 18 Oct 2026');
    assert.equal(relativeName(customPeriod(at(10, 12), at(10, 18)), now), '7 days');
    assert.equal(relativeName(customPeriod(at(10, 17), at(10, 17)), now), 'One day');
    assert.equal(fileStem(customPeriod(at(10, 12), at(10, 18))), '2026-10-12-to-2026-10-18');
    assert.equal(fileStem(customPeriod(at(10, 17), at(10, 17))), '2026-10-17');
    const c = comparison(customPeriod(at(10, 5), at(10, 11)), now);
    assert.equal(c.from, at(9, 28, 0));
    assert.equal(c.to, at(10, 5, 0));
    assert.equal(c.label, 'vs the 7 days before');
  });
});

