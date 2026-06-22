function SkeletonBlock({ className }: { className: string }) {
  return <div className={`bg-slate-200 dark:bg-slate-800 rounded-lg ${className}`} />;
}

export function StaffSearchBarSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <SkeletonBlock className="h-10 flex-1 rounded-xl" />
          <SkeletonBlock className="h-10 w-16 rounded-xl" />
        </div>
        <SkeletonBlock className="h-9 w-24 rounded-lg self-start md:self-auto" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SkeletonBlock className="h-3 w-10" />
        <SkeletonBlock className="h-8 w-14 rounded-lg" />
        <SkeletonBlock className="h-8 w-16 rounded-lg" />
        <SkeletonBlock className="h-8 w-14 rounded-lg" />
        <SkeletonBlock className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}
