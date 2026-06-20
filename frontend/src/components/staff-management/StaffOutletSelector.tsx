import { Check, MapPin, Store } from 'lucide-react';
import { hasOutletHierarchy } from '../../utils/staffManagementHelpers';
import type { OutletHierarchy, OutletOption } from '../../types/staffManagement';

export interface StaffOutletSelectorProps {
  outletHierarchy: OutletHierarchy;
  selectedOutletIds: string[];
  submitting: boolean;
  onToggle: (outletId: string) => void;
}

function OutletCheckbox({
  outlet,
  checked,
  submitting,
  onToggle,
}: {
  outlet: OutletOption;
  checked: boolean;
  submitting: boolean;
  onToggle: (outletId: string) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none py-0.5">
      <div className="relative flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(outlet.id)}
          className="peer sr-only"
          disabled={submitting}
        />
        <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-colors" />
        <Check className="absolute inset-0 w-4 h-4 text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none" />
      </div>
      <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
        {outlet.name}
        {outlet.code ? (
          <span className="ml-1 text-slate-400 dark:text-slate-500 font-mono">({outlet.code})</span>
        ) : null}
      </span>
    </label>
  );
}

export function StaffOutletSelector({
  outletHierarchy,
  selectedOutletIds,
  submitting,
  onToggle,
}: StaffOutletSelectorProps) {
  const hasOutlets = hasOutletHierarchy(outletHierarchy);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Pilih Outlet Penempatan
      </label>
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3 max-h-44 overflow-y-auto space-y-3">
        {!hasOutlets ? (
          <p className="text-xs text-slate-400 dark:text-slate-600 italic">Belum ada outlet aktif.</p>
        ) : (
          <>
            {outletHierarchy.main && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1">
                  <Store className="w-3 h-3" />
                  Outlet Utama
                </p>
                <div className="pl-1 space-y-1">
                  <OutletCheckbox
                    outlet={outletHierarchy.main}
                    checked={selectedOutletIds.includes(outletHierarchy.main.id)}
                    submitting={submitting}
                    onToggle={onToggle}
                  />
                </div>
              </div>
            )}
            {outletHierarchy.branches.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Cabang
                </p>
                <div className="pl-1 space-y-1">
                  {outletHierarchy.branches.map((outlet) => (
                    <OutletCheckbox
                      key={outlet.id}
                      outlet={outlet}
                      checked={selectedOutletIds.includes(outlet.id)}
                      submitting={submitting}
                      onToggle={onToggle}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
