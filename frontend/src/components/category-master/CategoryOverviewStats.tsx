import { Tag, Package, Layers, Hash } from 'lucide-react';
import type { Category } from '../../api/categoryApi';

export interface CategoryOverviewStatsProps {
  categories: Category[];
}

export function CategoryOverviewStats({ categories }: CategoryOverviewStatsProps) {
  const totalCategories = categories.length;

  const totalProductsLinked = categories.reduce(
    (acc, cat) => acc + (cat._count?.products || 0),
    0
  );

  const sortedByProducts = [...categories].sort(
    (a, b) => (b._count?.products || 0) - (a._count?.products || 0)
  );

  const mostPopular = sortedByProducts[0];
  const mostPopularText = mostPopular
    ? `${mostPopular.name} (${mostPopular._count?.products || 0})`
    : 'Belum Ada';

  const uniquePrefixesCount = new Set(
    categories.map((c) => c.prefix.trim().toUpperCase())
  ).size;

  const stats = [
    {
      id: 'total-categories',
      title: 'Total Kategori',
      value: `${totalCategories} Kategori`,
      subtext: 'Aktif di sistem',
      icon: Tag,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    },
    {
      id: 'total-products',
      title: 'Produk Terkait',
      value: `${totalProductsLinked} Produk`,
      subtext: 'Terhubung ke kategori',
      icon: Package,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'popular-category',
      title: 'Kategori Teraktif',
      value: mostPopularText,
      subtext: 'Jumlah produk terbanyak',
      icon: Layers,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      id: 'unique-prefixes',
      title: 'Prefix SKU',
      value: `${uniquePrefixesCount} Kode`,
      subtext: 'Format auto SKU',
      icon: Hash,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
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
              <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 truncate">
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
