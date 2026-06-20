import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface StaffAlertsProps {
  error: string | null;
  successMsg: string | null;
}

export function StaffAlerts({ error, successMsg }: StaffAlertsProps) {
  return (
    <>
      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 animate-pulse">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}
    </>
  );
}
