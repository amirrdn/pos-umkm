export function hasCustomerDebt(debtBalance: number | string): boolean {
  return Number(debtBalance) > 0;
}

export function formatCustomerDebt(debtBalance: number | string): string {
  return `Rp ${Number(debtBalance || 0).toLocaleString('id-ID')}`;
}

export function formatCustomerJoinDate(date: string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getCustomerDebtClass(debtBalance: number | string): string {
  return hasCustomerDebt(debtBalance)
    ? 'text-rose-600 dark:text-rose-400'
    : 'text-slate-500 dark:text-slate-400';
}
