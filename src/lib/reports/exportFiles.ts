import { downloadCsv } from '../csv';

import { reportCsv } from './exportCsv';
import { reportHtml } from './exportHtml';
import { fileStem } from './period';
import type { Report } from './report';

export function downloadReportCsv(r: Report) {
  downloadCsv(`tillsync-payments-${fileStem(r.period)}.csv`, reportCsv(r));
}

/**
 * Opens the browser's print dialog for the report, where “Save as PDF” is one click. The report is drawn in a hidden
 * frame so nothing on the page is disturbed; the frame is removed after printing.
 */
export function printReport(r: Report, business: string): void {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.title = `TillSync report ${fileStem(r.period)}`;
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(reportHtml(r, business, Date.now()));
  doc.close();
  const done = () => setTimeout(() => frame.remove(), 1000);
  frame.contentWindow!.addEventListener('afterprint', done);
  setTimeout(() => {
    frame.contentWindow!.focus();
    frame.contentWindow!.print();
  }, 250);
}
