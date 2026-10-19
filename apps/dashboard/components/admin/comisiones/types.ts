export interface CommissionSettings {
  firstMonthRate: number;
  recurringRate: number;
  recurringMonths: number;
  clawbackDays: number;
  updatedAt: string | null;
}

export interface CommissionPayout {
  id: string;
  period: string;
  totalAmount: number;
  status: 'pending' | 'paid';
  paidAt: string | null;
  note: string | null;
  salesUserName: string;
}

export interface CommissionEntry {
  id: string;
  type: string;
  monthNumber: number;
  rate: number;
  amount: number;
  placeName: string;
  createdAt: string;
}

export interface PayoutDetail {
  payout: CommissionPayout;
  entries: CommissionEntry[];
}

/** Los montos de comisiones vienen en céntimos. */
export const money = (cents: number) => `S/ ${(cents / 100).toFixed(2)}`;

export const ENTRY_TYPE_LABEL: Record<string, string> = { first_month: 'Primer mes', recurring: 'Mensual' };
