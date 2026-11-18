import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSaleStore } from '@/store/sale.store';
import { useRateStore } from '@/store/rate.store';
import { formatCurrency, formatDate, formatRate } from '@/utils/format';
import { Search, Filter, Calendar, Download, RefreshCw, DollarSign, CreditCard, ChevronDown } from 'lucide-react';
import { addDays } from 'date-fns';
import { toast } from 'sonner';
import { type PaymentMethod } from '@/types';

const PAYMENT_FILTERS: { key: PaymentMethod | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'Todos', icon: <CreditCard className="w-4 h-4" /> },
  { key: 'usd_cash', label: 'USD Efectivo', icon: <DollarSign className="w-4 h-4" /> },
  { key: 'ves_cash', label: 'Bs. Efectivo', icon: <CreditCard className="w-4 h-4" /> },
  { key: 'pago_movil', label: 'Pago Móvil', icon: <CreditCard className="w-4 h-4" /> },
  { key: 'kontigo', label: 'Kontigo', icon: <CreditCard className="w-4 h-4" /> },
  { key: 'binance', label: 'Binance', icon: <CreditCard className="w-4 h-4" /> },
  { key: 'transfer_ves', label: 'Transf. Bs.', icon: <CreditCard className="w-4 h-4" /> },
  { key: 'other', label: 'Otro', icon: <CreditCard className="w-4 h-4" /> },
];

const paymentMethodLabels: Record<PaymentMethod, string> = {
  usd_cash: 'USD Efectivo',
  ves_cash: 'Bs. Efectivo',
  pago_movil: 'Pago Móvil',
  kontigo: 'Kontigo',
  binance: 'Binance',
  transfer_ves: 'Transferencia Bs.',
  other: 'Otro',
};

const paymentMethodColors: Record<PaymentMethod, string> = {
  usd_cash: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ves_cash: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pago_movil: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  kontigo: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  binance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  transfer_ves: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export default function Sales() {
  const { sales, loadSales, searchSales, isLoading } = useSaleStore();
  const { rate } = useRateStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  let filteredSales = searchTerm
    ? searchSales(searchTerm)
    : sales;

  if (paymentFilter !== 'all') {
    filteredSales = filteredSales.filter((s) => s.paymentMethod === paymentFilter);
  }

  if (dateFilter !== 'all') {
    const now = new Date();
    let startDate: Date;
    switch (dateFilter) {
      case 'week': startDate = addDays(now, -7); break;
      case 'month': startDate = addDays(now, -30); break;
      default: startDate = new Date(0);
    }
    filteredSales = filteredSales.filter((s) => new Date(s.createdAt) >= startDate);
  }

  const totalUSD = filteredSales.reduce((sum, s) => sum + s.totalUSD, 0);
  const totalVES = filteredSales.reduce((sum, s) => sum + s.totalVES, 0);

  const handleExport = async () => {
    if (filteredSales.length === 0) {
      toast.error('No hay ventas para exportar');
      return;
    }
    const csvContent = [
      ['ID', 'Cliente', 'Monto USD', 'Monto VES', 'Método de Pago', 'Fecha'],
      ...filteredSales.map((s) => [
        s.id, s.clientName || '', s.totalUSD, s.totalVES,
        paymentMethodLabels[s.paymentMethod] || s.paymentMethod,
        formatDate(s.createdAt),
      ]),
    ].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ventas-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('¡Archivo CSV descargado!');
  };

  const handleRefresh = () => {
    loadSales().then(() => {
      toast.success('¡Ventas actualizadas!');
    });
  };

  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-text">Historial de Ventas</h1>
        <p className="text-textMuted mt-1">Registra y consulta tus ventas</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Total USD</p>
              <p className="text-xl font-bold text-text">{formatCurrency(totalUSD, 'USD')}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Total Bs.</p>
              <p className="text-xl font-bold text-text">{formatCurrency(totalVES, 'VES')}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Ventas</p>
              <p className="text-xl font-bold text-text">{filteredSales.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <ChevronDown className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Tasa</p>
              <p className="text-xl font-bold text-text">{formatRate(rate) || '—'} VES</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
              <Input
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setDateFilter(dateFilter === 'all' ? 'week' : dateFilter === 'week' ? 'month' : 'all')}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              <span>{dateFilter === 'all' ? 'Semana' : dateFilter === 'week' ? 'Mes' : 'Todos'}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
            {filteredSales.length > 0 && (
              <Button variant="outline" onClick={handleExport} className="gap-2">
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </Button>
            )}
            <Button variant="ghost" onClick={handleRefresh} title="Actualizar" className="shrink-0">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full justify-between py-2"
            >
              <span className="text-sm font-medium text-textSecondary">Filtrar por método de pago</span>
              <ChevronDown className={`w-4 h-4 text-textMuted transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            {showFilters && (
              <div className="flex flex-wrap gap-2 mt-2">
                {PAYMENT_FILTERS.map((f) => (
                  <Button
                    key={f.key}
                    variant={paymentFilter === f.key ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentFilter(f.key)}
                    className="gap-1.5"
                  >
                    {f.icon}
                    <span>{f.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-textMuted">Cargando ventas...</p>
          </div>
        </Card>
      ) : filteredSales.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-textMuted mx-auto mb-4" />
            <p className="text-textMuted text-base mb-2">No se encontraron ventas</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3" role="list" aria-label="Lista de ventas">
          {filteredSales.map((sale) => (
            <Link key={sale.id} to={`/ventas/${sale.id}`} className="block group">
              <Card
                role="listitem"
                hover
                className="flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-medium text-text truncate group-hover:text-secondary transition-colors">{sale.clientName || 'Cliente general'}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentMethodColors[sale.paymentMethod]}`}>
                      {paymentMethodLabels[sale.paymentMethod] || sale.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-textMuted">{formatDate(sale.createdAt)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-secondary">{formatCurrency(sale.totalUSD, 'USD')}</p>
                  <p className="text-sm text-textMuted">{formatCurrency(sale.totalVES, 'VES')}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {filteredSales.length > 0 && (
        <Card className="sticky bottom-20 z-10 shadow-elevation-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-text">Total {filteredSales.length} ventas</span>
            <div className="text-right">
              <p className="font-bold text-secondary">{formatCurrency(totalUSD, 'USD')}</p>
              <p className="text-sm text-textMuted">{formatCurrency(totalVES, 'VES')}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}