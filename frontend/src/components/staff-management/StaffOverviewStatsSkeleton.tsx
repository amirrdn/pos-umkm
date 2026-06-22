const STAT_CARD_COUNT = 4;

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`bg-slate-200 dark:bg-slate-800 rounded-lg ${className}`} />;
}

export function StaffOverviewStatsSkeleton() {
  return (
    <div className="flex overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory lg:grid lg:grid-cols-4 gap-4 shrink-0 px-1 -mx-1 animate-pulse">
      {Array.from({ length: STAT_CARD_COUNT }, (_, index) => (
        <div
          key={index}
          className="w-[260px] lg:w-auto shrink-0 snap-start bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4"
        >
          <div className="space-y-2 min-w-0 flex-1">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-6 w-12" />
            <SkeletonBlock className="h-3 w-28" />
          </div>
          <SkeletonBlock className="h-11 w-11 rounded-2xl shrink-0" />
        </div>
      ))}
    </div>
  );
}
