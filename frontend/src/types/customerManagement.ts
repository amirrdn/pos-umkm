export type CustomerModalMode = 'create' | 'edit';

export type RepayMethod = 'CASH' | 'QRIS';

export interface CustomerNotification {
  type: 'success' | 'error';
  message: string;
}

export interface CustomerFormPayload {
  name: string;
  phone: string | null;
  email: string | null;
}
