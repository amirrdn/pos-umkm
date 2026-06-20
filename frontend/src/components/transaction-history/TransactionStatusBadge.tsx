export function TransactionStatusBadge({ status }: { status: string }) {
  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-emerald-50 text-emerald-800 border border-emerald-100">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
        COMPLETED
      </span>
    );
  }

  if (status === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-amber-50 text-amber-800 border border-amber-100">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        PENDING
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-rose-50 text-rose-800 border border-rose-100">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
      VOID
    </span>
  );
}
