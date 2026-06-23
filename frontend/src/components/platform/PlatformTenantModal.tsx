import { useState, useEffect } from 'react';
import { X, Store, Mail, User, Lock, Phone, Percent } from 'lucide-react';
import { usePlatformStore } from '../../store/usePlatformStore';

interface PlatformTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantIdToEdit?: string | null;
}

export function PlatformTenantModal({ isOpen, onClose, tenantIdToEdit }: PlatformTenantModalProps) {
  const tenants = usePlatformStore((state) => state.tenants);
  const createTenant = usePlatformStore((state) => state.createTenant);
  const updateTenant = usePlatformStore((state) => state.updateTenant);

  const isEditMode = !!tenantIdToEdit;
  const existingTenant = isEditMode ? tenants.find((t) => t.id === tenantIdToEdit) : null;

  const [formData, setFormData] = useState({
    tenantName: '',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
    taxRate: '11', // default 11%
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      Promise.resolve().then(() => {
        if (isEditMode && existingTenant) {
          setFormData({
            tenantName: existingTenant.name,
            ownerName: '',
            email: existingTenant.email,
            password: '',
            phone: existingTenant.phone || '',
            taxRate: '11',
          });
        } else {
          setFormData({
            tenantName: '',
            ownerName: '',
            email: '',
            password: '',
            phone: '',
            taxRate: '11',
          });
        }
        setErrorMsg('');
      });
    }
  }, [isOpen, isEditMode, existingTenant]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const taxRateValue = parseFloat(formData.taxRate) / 100;

      if (isEditMode && tenantIdToEdit) {
        await updateTenant(tenantIdToEdit, {
          name: formData.tenantName,
          phone: formData.phone,
          taxRate: taxRateValue,
        });
      } else {
        await createTenant({
          tenantName: formData.tenantName,
          ownerName: formData.ownerName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          taxRate: taxRateValue,
        });
      }
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {isEditMode ? 'Edit Tenant' : 'Tambah Tenant Baru'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800/50">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Toko
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Store className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                required
                value={formData.tenantName}
                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:text-white transition-all outline-none"
                placeholder="Misal: Kopi Kenangan"
              />
            </div>
          </div>

          {!isEditMode && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Pemilik
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:text-white transition-all outline-none"
                    placeholder="Nama lengkap pemilik"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:text-white transition-all outline-none"
                    placeholder="email@contoh.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:text-white transition-all outline-none"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nomor Telepon
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:text-white transition-all outline-none"
                  placeholder="0812..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Pajak (%)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Percent className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:text-white transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 flex items-center justify-center text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
