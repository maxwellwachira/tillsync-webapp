/** What an attendant may see beyond the basics (amount, code, time, who paid, and the masked number M-Pesa shows). */
export const PERMISSION_OPTIONS = [
  { key: 'seeOriginalSms', label: 'Original M-Pesa message', hint: 'It includes your account balance. Owner only by default.', defaultOn: false },
  { key: 'searchHistory', label: 'Payments older than a day', hint: 'Only the last 24 hours when off.', defaultOn: false },
] as const;

export const defaultPermissions = (): Record<string, boolean> => ({
  ...Object.fromEntries(PERMISSION_OPTIONS.map((o) => [o.key, o.defaultOn])),
  alerts: true,
});
