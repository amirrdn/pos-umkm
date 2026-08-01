import { Users, Award, PhoneCall, Sparkles } from 'lucide-react';
import type { Customer } from '../../store/useCustomerStore';

export interface CustomerOverviewStatsProps {
  customers: Customer[];
}

export function CustomerOverviewStats({ customers }: CustomerOverviewStatsProps) {
  const totalCustomers = customers.length;

  // Compute customer with highest points
  const topCustomer = customers.reduce<Customer | null>((prev, current) => {
    if (!prev) return current;
    return (current.points || 0) > (prev.points || 0) ? current : prev;
  }, null);

  const topCustomerName = topCustomer ? topCustomer.name : '-';
  const topCustomerPoints = topCustomer ? topCustomer.points || 0 : 0;

  // Customers with phone/whatsapp
  const customersWithPhone = customers.filter((c) => c.phone && c.phone.trim() !== '').length;

  // Total loyalty points in circulation
  const totalLoyaltyPoints = customers.reduce((sum, c) => sum + (c.points || 0), 0);

  const stats = [
    {
      id: 'total',
      title: 'Total Pelanggan',
      value: `${totalCustomers} Pelanggan`,
      subtext: 'Terdaftar di database',
      icon: Users,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300',
    },
    {
      id: 'top_points',
      title: 'Poin Terbanyak',
      value: `${topCustomerPoints} Poin`,
      subtext: topCustomerName,
      icon: Award,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
    },
    {
      id: 'whatsapp',
      title: 'Kontak WhatsApp',
      value: `${customersWithPhone} Terverifikasi`,
      subtext: 'Dapat dikirim promo',
      icon: PhoneCall,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
    },
    {
      id: 'total_points',
      title: 'Total Poin Beredar',
      value: `${totalLoyaltyPoints.toLocaleString('id-ID')} Poin`,
      subtext: 'Program reward loyalitas',
      icon: Sparkles,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      badgeBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
    },
  ];

  return (
    <div className="flex overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory lg:grid lg:grid-cols-4 gap-4 shrink-0 px-1 -mx-1">
      {stats.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.id}
            className="w-[270px] lg:w-auto shrink-0 snap-start bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md dark:shadow-none flex items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-md"
          >
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {item.title}
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-slate-50 block truncate font-mono tracking-tight">
                {item.value}
              </span>
              <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 truncate max-w-full">
                {item.subtext}
              </span>
            </div>
            <div className={`p-3 rounded-2xl border shrink-0 ${item.iconBg}`}>
              <IconComponent className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
