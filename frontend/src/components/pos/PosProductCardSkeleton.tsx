const SKELETON_COUNT = 8;

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse ${className}`} />;
}

export function PosProductCardSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        >
          <SkeletonBlock className="h-32 sm:h-40 lg:h-48 w-full rounded-none" />
          <div className="p-4 sm:p-5 space-y-3">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-5 w-full" />
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <SkeletonBlock className="h-6 w-24" />
              <SkeletonBlock className="h-4 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
