import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatformStore } from '../../store/usePlatformStore';
import { Loader2, Package, Store, Users, ShoppingCart, Eye, Plus, Edit2, Trash2 } from 'lucide-react';
import { PlatformTenantModal } from './PlatformTenantModal';

const TIER_COLORS: Record<string, string> = {
  FREE: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  GROWTH: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  ENTERPRISE: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  EXPIRED: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  TRIAL: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
};

export function PlatformTenantsView() {
  const navigate = useNavigate();
  const tenants = usePlatformStore((state) => state.tenants);
  const activeTenantId = usePlatformStore((state) => state.activeTenantId);
  const loading = usePlatformStore((state) => state.loading);
  const error = usePlatformStore((state) => state.error);
  const fetchTenants = usePlatformStore((state) => state.fetchTenants);
  const setActiveTenant = usePlatformStore((state) => state.setActiveTenant);
  const deleteTenant = usePlatformStore((state) => state.deleteTenant);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleOpenCreateModal = () => {
    setEditingTenantId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tenantId: string) => {
    setEditingTenantId(tenantId);
    setIsModalOpen(true);
  };

  const handleDelete = async (tenantId: string, tenantName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus toko "${tenantName}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        await deleteTenant(tenantId);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus tenant.');
      }
    }
  };

  const handleInspect = (tenantId: string) => {
    setActiveTenant(tenantId);
    navigate(`/platform/tenants/${tenantId}`);
  };

  if (loading && tenants.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-700 dark:text-rose-300">
        {error}
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">
            Semua Tenant (0)
          </h2>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Tambah Tenant
          </button>
        </div>
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <Store className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Belum ada tenant terdaftar
          </p>
        </div>
        <PlatformTenantModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tenantIdToEdit={editingTenantId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">
          Semua Tenant ({tenants.length})
        </h2>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Tambah Tenant
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Tenant
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Paket
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <Package className="w-3.5 h-3.5 inline" />
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <Store className="w-3.5 h-3.5 inline" />
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <Users className="w-3.5 h-3.5 inline" />
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <ShoppingCart className="w-3.5 h-3.5 inline" />
                </th>
                <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => {
                const isActive = tenant.id === activeTenantId;
                return (
                  <tr
                    key={tenant.id}
                    className={`border-b border-slate-100 dark:border-slate-800/50 transition-colors ${
                      isActive
                        ? 'bg-violet-50/80 dark:bg-violet-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{tenant.name}</p>
                      <p className="text-[10px] text-slate-400">{tenant.slug}</p>
                      {isActive && (
                        <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                          Tenant Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${TIER_COLORS[tenant.subscriptionTier] ?? ''}`}
                      >
                        {tenant.subscriptionTier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${STATUS_COLORS[tenant.subscriptionStatus] ?? ''}`}
                      >
                        {tenant.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-slate-600 dark:text-slate-400">
                      {tenant._count.products}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-slate-600 dark:text-slate-400">
                      {tenant._count.outlets}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-slate-600 dark:text-slate-400">
                      {tenant._count.users}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-slate-600 dark:text-slate-400">
                      {tenant._count.transactions}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleInspect(tenant.id)}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:hover:bg-violet-900 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(tenant.id)}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(tenant.id, tenant.name)}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-900 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <PlatformTenantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tenantIdToEdit={editingTenantId}
      />
    </div>
  );
}
