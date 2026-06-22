const DESKTOP_SKELETON_ROWS = 5;
const MOBILE_SKELETON_CARDS = 3;

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`bg-slate-200 dark:bg-slate-800 rounded-lg ${className}`} />;
}

export function StaffListSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="hidden md:block">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
              {['Karyawan', 'Email', 'Role', 'Outlet', 'Status', 'Aksi'].map((column) => (
                <th
                  key={column}
                  className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-300 dark:text-slate-600"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {Array.from({ length: DESKTOP_SKELETON_ROWS }, (_, rowIndex) => (
              <tr key={rowIndex}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <SkeletonBlock className="h-9 w-9 rounded-xl shrink-0" />
                    <SkeletonBlock className="h-4 w-36" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <SkeletonBlock className="h-4 w-44" />
                </td>
                <td className="px-6 py-4">
                  <SkeletonBlock className="h-6 w-20 rounded-full" />
                </td>
                <td className="px-6 py-4">
                  <SkeletonBlock className="h-5 w-24" />
                </td>
                <td className="px-6 py-4">
                  <SkeletonBlock className="h-6 w-16 rounded-full" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <SkeletonBlock className="h-8 w-8 rounded-lg" />
                    <SkeletonBlock className="h-8 w-8 rounded-lg" />
                    <SkeletonBlock className="h-8 w-8 rounded-lg" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden p-4 space-y-4">
        {Array.from({ length: MOBILE_SKELETON_CARDS }, (_, cardIndex) => (
          <div
            key={cardIndex}
            className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3"
          >
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-10 w-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="h-3 w-44" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <SkeletonBlock className="h-5 w-16 rounded-md" />
              <SkeletonBlock className="h-5 w-24 rounded-md" />
              <SkeletonBlock className="h-5 w-14 rounded-full" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <SkeletonBlock className="h-8 w-8 rounded-lg" />
              <SkeletonBlock className="h-8 w-8 rounded-lg" />
              <SkeletonBlock className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
