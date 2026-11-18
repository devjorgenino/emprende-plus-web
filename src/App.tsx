import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import Layout from './components/layout/Layout';
import { Toaster, toast } from 'sonner';
import { WifiOff, Wifi } from 'lucide-react';

// Lazy load features
const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));
const Services = lazy(() => import('./features/services/Services'));
const ServiceDetail = lazy(() => import('./features/services/ServiceDetail'));
const Calculator = lazy(() => import('./features/calculator/Calculator'));
const Sales = lazy(() => import('./features/sales/Sales'));
const SaleDetail = lazy(() => import('./features/sales/SaleDetail'));
const Inventory = lazy(() => import('./features/inventory/Inventory'));
const InventoryDetail = lazy(() => import('./features/inventory/InventoryDetail'));
const Clients = lazy(() => import('./features/clients/Clients'));
const ClientDetail = lazy(() => import('./features/clients/ClientDetail'));
const Expenses = lazy(() => import('./features/expenses/Expenses'));
const ExpenseDetail = lazy(() => import('./features/expenses/ExpenseDetail'));
const Settings = lazy(() => import('./features/settings/Settings'));
const QuoteDetail = lazy(() => import('./features/quotes/QuoteDetail'));

function AppLoading() {
  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div>
          <h2 className="text-2xl font-bold text-text mb-2">Cargando Emprende+</h2>
          <p className="text-textMuted">Bienvenido a tu gestor comercial</p>
        </div>
      </div>
    </div>
  );
}

function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexión restaurada', {
        icon: <Wifi className="w-4 h-4 text-success" />,
        description: 'Tus datos se sincronizarán automáticamente.',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Sin conexión a internet', {
        icon: <WifiOff className="w-4 h-4 text-error" />,
        description: 'La aplicación sigue funcionando con los datos guardados.',
        duration: Infinity,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-fade-in" role="alert" aria-live="assertive">
      <div className="bg-error text-white px-4 py-3 rounded-xl shadow-elevation-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <WifiOff className="w-5 h-5" />
          <span className="text-sm font-medium">Trabajando sin conexión</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<AppLoading />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/servicios" element={<Services />} />
            <Route path="/servicios/:id" element={<ServiceDetail />} />
            <Route path="/calculadora" element={<Calculator />} />
            <Route path="/ventas" element={<Sales />} />
            <Route path="/ventas/:id" element={<SaleDetail />} />
            <Route path="/cotizaciones/:id" element={<QuoteDetail />} />
            <Route path="/inventario" element={<Inventory />} />
            <Route path="/inventario/:id" element={<InventoryDetail />} />
            <Route path="/clientes" element={<Clients />} />
            <Route path="/clientes/:id" element={<ClientDetail />} />
            <Route path="/egresos" element={<Expenses />} />
            <Route path="/egresos/:id" element={<ExpenseDetail />} />
            <Route path="/configuracion" element={<Settings />} />
          </Routes>
        </Suspense>
      </Layout>

      <OfflineBanner />

      <Toaster
        position="bottom-center"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
          style: {
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          },
        }}
      />
    </BrowserRouter>
  );
}