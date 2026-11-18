import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSaleStore } from '@/store/sale.store';
import { useExpenseStore } from '@/store/expense.store';
import { useQuoteStore } from '@/store/quote.store';
import { useServiceStore } from '@/store/service.store';
import { useInventoryStore } from '@/store/inventory.store';
import { useClientStore } from '@/store/client.store';
import { useRateStore } from '@/store/rate.store';
import { useThemeStore } from '@/store/theme.store';
import { Download, Upload, RefreshCw, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { promptInstall, isStandalone } from '@/pwa/pwa-register';
import { formatRate } from '@/utils/format';

interface RateRecord {
  rate: number;
  source: string;
  date: string;
}

export default function Settings() {
  const { sales } = useSaleStore();
  const { expenses } = useExpenseStore();
  const { quotes } = useQuoteStore();
  const { rate, refresh } = useRateStore();
  const { theme, toggleTheme } = useThemeStore();
  const [rates, setRates] = useState<RateRecord[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(isStandalone());

  useEffect(() => {
    const handleBeforeInstall = () => setCanInstall(true);
    const handleAppInstalled = () => {
      setCanInstall(false);
      setIsAppInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    await promptInstall();
  };

  useEffect(() => {
    try {
      const allRecords: RateRecord[] = [];
      sales.forEach((s) => allRecords.push({ rate: s.exchangeRate, source: 'venta', date: s.createdAt }));
      quotes.forEach((q) => allRecords.push({ rate: q.exchangeRate, source: 'cotización', date: q.createdAt }));
      expenses.forEach((e) => allRecords.push({ rate: e.exchangeRate, source: 'egreso', date: e.createdAt }));
      setRates(allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20));
    } catch {}
  }, [sales, expenses, quotes]);

  async function handleBackup() {
    setIsBackingUp(true);
    try {
      // Backup reads all object stores directly via IndexedDB — no repositories needed
      const { db } = await import('@/services/db/db');
      const database = await db.getDatabase();

      const storeNames = ['services', 'quotes', 'quoteItems', 'sales', 'saleItems', 'expenses', 'inventory', 'clients'];
      const data: Record<string, any[]> = {};

      for (const name of storeNames) {
        data[name] = await new Promise<any[]>((resolve, reject) => {
          const tx = database.transaction(name, 'readonly');
          const req = tx.objectStore(name).getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
      }

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `emprendeplus-backup-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Backup exportado correctamente');
    } catch (e) {
      toast.error('Error al exportar backup: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsBackingUp(false);
    }
  }

  async function handleRestore() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (event: any) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsRestoring(true);
      try {
        const text = await file.text();
        const backup = JSON.parse(text);

        const { db } = await import('@/services/db/db');
        const database = await db.getDatabase();

        const storeNames = ['services', 'quotes', 'quoteItems', 'sales', 'saleItems', 'expenses', 'inventory', 'clients'];

        // 1. Clear all stores
        for (const name of storeNames) {
          await new Promise<void>((resolve, reject) => {
            const tx = database.transaction(name, 'readwrite');
            tx.objectStore(name).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });
        }

        // 2. Insert directly with put — no repositories, no dynamic repo imports
        const putAll = async (store: string, items: any[] | undefined) => {
          if (!items?.length) return;
          await new Promise<void>((resolve, reject) => {
            const tx = database.transaction(store, 'readwrite');
            const os = tx.objectStore(store);
            items.forEach((item) => os.put(item));
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });
        };

        await putAll('services', backup.services);
        await putAll('quotes', backup.quotes);
        await putAll('quoteItems', backup.quoteItems);
        await putAll('sales', backup.sales);
        await putAll('saleItems', backup.saleItems);
        await putAll('expenses', backup.expenses);
        await putAll('inventory', backup.inventory);
        await putAll('clients', backup.clients);

        // 3. Reload Zustand stores
        await Promise.all([
          useServiceStore.getState().loadServices(),
          useSaleStore.getState().loadSales(),
          useExpenseStore.getState().loadExpenses(),
          useInventoryStore.getState().loadItems(),
          useClientStore.getState().loadClients(),
          useQuoteStore.getState().loadQuotes(),
        ]);

        toast.success('Backup restaurado correctamente');
      } catch (e) {
        toast.error('Error al restaurar: ' + (e instanceof Error ? e.message : String(e)));
      } finally {
        setIsRestoring(false);
      }
    };
    input.click();
  }

  return (
    <div className="p-4 space-y-6 pb-16">
      <header>
        <h1 className="text-2xl font-bold text-text">Configuración</h1>
        <p className="text-textMuted mt-1">Ajustes y mantenimiento</p>
      </header>

      <Card>
        <h3 className="text-lg font-semibold text-text mb-4">Respaldo de Datos</h3>
        <p className="text-sm text-textMuted mb-4">
          Exporta todos tus datos (servicios, ventas, cotizaciones, egresos, inventario y clientes) como archivo JSON, o restaura desde un backup previo.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button onClick={handleBackup} disabled={isBackingUp} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            <span>{isBackingUp ? 'Exportando...' : 'Exportar Backup'}</span>
          </Button>
          <Button onClick={handleRestore} disabled={isRestoring} variant="secondary" className="gap-2">
            <Upload className="w-4 h-4" />
            <span>{isRestoring ? 'Restaurando...' : 'Restaurar Backup'}</span>
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text">Tasa de Cambio</h3>
          <Button variant="ghost" size="sm" onClick={() => refresh()} className="gap-1">
            <RefreshCw className="w-4 h-4" />
            <span>Actualizar</span>
          </Button>
        </div>
        <p className="text-3xl font-bold text-secondary text-center py-4">
          {rate ? `1 USD = ${formatRate(rate)} VES` : 'Cargando...'}
        </p>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-text mb-4">Apariencia</h3>
        <Button onClick={toggleTheme} variant="outline" className="w-full justify-between gap-3">
          <span>{theme === 'light' ? 'Modo claro' : 'Modo oscuro'}</span>
          {theme === 'light' ? '☀️' : '🌙'}
        </Button>
      </Card>

      {!isAppInstalled && canInstall && (
        <Card>
          <h3 className="text-lg font-semibold text-text mb-3">Instalar App</h3>
          <p className="text-sm text-textMuted mb-4">Accede más rápido desde tu pantalla de inicio</p>
          <Button onClick={handleInstall} className="w-full gap-2">
            <Smartphone className="w-4 h-4" />
            <span>Instalar</span>
          </Button>
        </Card>
      )}

      <Card>
        <div className="text-center text-xs text-textMuted py-2">Emprende+ v1.1.0</div>
      </Card>
    </div>
  );
}