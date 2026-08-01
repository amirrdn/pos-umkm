export function TransactionStatusBadge({ status }: { status: string }) {
  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-750 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs shrink-0">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Selesai
      </span>
    );
  }

  if (status === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-750 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs shrink-0">
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        Pending
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-750 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs shrink-0">
      <span className="h-2 w-2 rounded-full bg-rose-500" />
      Batal
    </span>
  );
}
