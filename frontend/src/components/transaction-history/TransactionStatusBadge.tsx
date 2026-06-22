export function TransactionStatusBadge({ status }: { status: string }) {
  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/40 shadow-sm shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Selesai
      </span>
    );
  }

  if (status === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-450 border border-amber-100 dark:border-amber-900/40 shadow-sm shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        Pending
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-450 border border-rose-100 dark:border-rose-900/40 shadow-sm shrink-0">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
      Batal
    </span>
  );
}
