import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { usePlatformStore } from '../../store/usePlatformStore';
import { isPlatformAdmin } from '../../utils/roles';

export function PlatformImpersonationBanner() {
  const user = useAuthStore((state) => state.user);
  const activeTenantMeta = usePlatformStore((state) => state.activeTenantMeta);

  if (!user || !isPlatformAdmin(user.roles) || !activeTenantMeta) {
    return null;
  }

  return (
    <div
      role="status"
      className="shrink-0 px-3 sm:px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-100"
    >
      <div className="flex items-start gap-2 sm:items-center sm:gap-3">
        <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 sm:mt-0 text-amber-600 dark:text-amber-400" />
        <p className="text-xs sm:text-sm leading-relaxed">
          Anda sedang menginspeksi tenant <strong>{activeTenantMeta.name}</strong> sebagai Admin Platform (
          {user.name}). Semua aksi tulis tercatat di audit trail.
        </p>
      </div>
    </div>
  );
}
