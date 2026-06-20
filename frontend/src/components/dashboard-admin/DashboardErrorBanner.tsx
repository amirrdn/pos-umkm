import { AlertCircle } from 'lucide-react';

export interface DashboardErrorBannerProps {
  error: string;
}

export function DashboardErrorBanner({ error }: DashboardErrorBannerProps) {
  return (
    <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-medium flex items-center gap-2">
      <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
      {error}
    </div>
  );
}
