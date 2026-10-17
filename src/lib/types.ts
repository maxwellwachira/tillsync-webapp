export type Role = 'owner' | 'attendant' | 'till';

/** What an attendant may see beyond the basics (amount, code, time, payer name and the masked number M-Pesa shows). */
export type Permissions = {
  seeOriginalSms: boolean;
  searchHistory: boolean;
  receiveAlerts: boolean;
};

export type Membership = {
  businessId: string;
  businessName: string;
  businessType: string;
  role: Role;
  displayName: string;
  permissions: Permissions;
  /** The owner chose to use their own phone as a Till. */
  tillOnOwnerPhone: boolean;
};

export type Payment = {
  /** M-Pesa transaction code. Also the document id, so a duplicate can never be recorded twice. */
  code: string;
  /** Whole KSh. */
  amount: number;
  /** The payer's name as M-Pesa shows it. */
  payerDisplay: string;
  /** The number as M-Pesa masks it, e.g. "0712 ••• 481". May be empty. */
  phoneMasked: string;
  receivedAt: number;
  syncedAt: number;
  tillId: string;
};

export type Member = {
  uid: string;
  displayName: string;
  role: Role;
  status: string;
  permissions: Record<string, boolean>;
};

export type Device = {
  id: string;
  label: string;
  lastHeartbeat: number | null;
  lastSms: number | null;
  lastSync: number | null;
  pending: number;
  battery: number | null;
  charging: boolean;
  smsPermission: boolean;
  appVersion: string;
};

export const BUSINESS_TYPES = ['Petrol station', 'Shop', 'Restaurant', 'Supermarket', 'Hotel', 'Pharmacy', 'Other'] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const ROLE_LABEL: Record<Role, string> = { owner: 'Owner', attendant: 'Attendant', till: 'Till phone' };

/** Who served a sale. The document id is the payment's code, so a sale has at most one claim. */
export type Claim = {
  code: string;
  uid: string;
  displayName: string;
  claimedAt: number;
};
