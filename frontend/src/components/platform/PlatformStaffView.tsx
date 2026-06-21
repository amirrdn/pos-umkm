import { useEffect, useState } from 'react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { Loader2, Users, Search, Store, Shield } from 'lucide-react';

export function PlatformStaffView() {
  const fetchStaffList = usePlatformStore((state) => state.fetchStaffList);
  const staffList = usePlatformStore((state) => state.staffList);
  const loading = usePlatformStore((state) => state.loading);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStaffList(1, 500); // Load up to 500 staffs for simple search
  }, [fetchStaffList]);

  const filteredStaff = staffList.filter((staff) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      staff.name.toLowerCase().includes(searchLower) ||
      staff.email.toLowerCase().includes(searchLower) ||
      staff.tenantName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-600" />
            Monitoring Staf Global
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Data read-only seluruh pengguna dari semua toko yang terdaftar di platform.
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari nama, email, atau toko..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:text-white transition-all outline-none"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4">Nama Staf & Email</th>
                <th className="px-6 py-4">Toko (Tenant)</th>
                <th className="px-6 py-4">Role / Posisi</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Bergabung Sejak</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading && staffList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 text-violet-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center font-bold text-xs uppercase">
                          {staff.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {staff.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {staff.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <Store className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{staff.tenantName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {staff.roles && staff.roles.length > 0 ? (
                          staff.roles.map((role: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                              <Shield className="w-3 h-3" />
                              {role}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs italic">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {staff.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(staff.createdAt))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                    {searchTerm ? 'Pencarian tidak menemukan staf yang cocok.' : 'Belum ada data staf terdaftar.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
