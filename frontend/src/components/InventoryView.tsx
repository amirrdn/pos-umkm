import { useInventory } from '../hooks/useInventory';
import { AppShellHeader } from './AppShellHeader';
import { InventoryContent, InventoryModals } from './inventory';
import { Package } from 'lucide-react';

export function InventoryView() {
  const inventory = useInventory();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      <AppShellHeader
        title="Kelola Stok"
        subtitle="Kartu Stok & Mutasi"
        icon={Package}
        accent="emerald"
        user={inventory.currentUser}
        onLogout={inventory.handleLogout}
      />

      <InventoryContent inventory={inventory} />
      <InventoryModals inventory={inventory} />
    </div>
  );
}
