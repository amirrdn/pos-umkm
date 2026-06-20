import type { Outlet } from '../store/useOutletStore';

/**
 * Filter outlets based on selected mutation type.
 */
export function outletsForMutationType(all: Outlet[], type: string): Outlet[] {
  if (type === 'RESTOCK') return all.filter((o) => o.type === 'MAIN');
  return all;
}

/**
 * Get CSS badge classes for transfer status.
 */
export function getTransferStatusBadgeClass(status: string): string {
  const statusColors: Record<string, string> = {
    DRAFT: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    IN_TRANSIT: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    COMPLETED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    CANCELLED: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };
  return statusColors[status] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';
}

/**
 * Get CSS badge classes for mutation request types.
 */
export function getMutationTypeBadgeClass(type: string): string {
  if (type === 'RESTOCK') {
    return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  }
  if (type === 'ADJUSTMENT_PLUS') {
    return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
  }
  return 'bg-rose-500/10 text-rose-450 border border-rose-500/20';
}

/**
 * Format ledger mutation quantity prefix sign and CSS classes.
 */
export function getLedgerQuantitySignAndColor(quantity: number): { sign: string; colorClass: string } {
  const isPositive = quantity > 0;
  return {
    sign: isPositive ? '+' : '',
    colorClass: isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10',
  };
}

/**
 * Get CSS badge classes for ledger entry types.
 */
export function getLedgerTypeBadgeClass(type: string): string {
  if (type === 'SALE') return 'bg-indigo-500/10 text-indigo-400';
  if (type === 'RESTOCK') return 'bg-emerald-500/10 text-emerald-400';
  return 'bg-amber-500/10 text-amber-400';
}
