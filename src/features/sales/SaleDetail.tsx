import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSaleStore } from '@/store/sale.store';
import { formatCurrency, formatDate } from '@/utils/format';
import { ArrowLeft, Edit, Trash2, Download, DollarSign, CreditCard, Calendar, User, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { type PaymentMethod } from '@/types';

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

export default function SaleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sales, getSaleById, deleteSale, isLoading } = useSaleStore();

  const [sale, setSale] = useState(sales.find((s) => s.id === id));

  useEffect(() => {
    const found = getSaleById(id || '');
    setSale(found || null);
  }, [id, getSaleById, sales]);

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de eliminar esta venta?')) {
      await deleteSale(id || '');
      toast.success('Venta eliminada');
      navigate('/ventas');
    }
  };

  const handleExport = async () => {
    if (!sale) return;

    const csvContent = [
      ['Campo', 'Valor'],
      ['ID', sale.id],
      ['Cliente', sale.clientName || 'No especificado'],
      ['Total USD', sale.totalUSD.toString()],
      ['Total VES', sale.totalVES.toString()],
      ['Tasa de Cambio', sale.exchangeRate.toString()],
      ['Método de Pago', paymentMethodLabels[sale.paymentMethod]],
      ['Fecha', formatDate(sale.createdAt)],
      ['Notas', sale.notes || 'N/A'],
      ...sale.items.map((item) => [
        `Servicio: ${item.serviceName}`,
        `Cantidad: ${item.quantity}`,
        `Precio: ${formatCurrency(item.priceUSD, 'USD')}`,
        `Subtotal: ${formatCurrency(item.subtotalUSD, 'USD')}`,
      ]),
    ].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `venta-${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Venta exportada');
  };

  if (!sale && !isLoading) {
    return (
      <div className="p-4 space-y-4 pb-16">
        <Link to="/ventas">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver a Ventas
          </Button>
        </Link>
        <Card>
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-textMuted mx-auto mb-4" />
            <p className="text-textMuted text-base mb-4">Venta no encontrada</p>
            <Link to="/ventas">
              <Button variant="secondary">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver a Ventas
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-16">
      <header className="flex items-center justify-between">
        <Link to="/ventas">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-error hover:bg-error/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Sale Header */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-8 h-8 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h2 className="text-xl font-bold text-text truncate">
                {sale?.clientName ? `Venta a ${sale.clientName}` : 'Venta sin cliente'}
              </h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentMethodColors[sale?.paymentMethod || 'other']}`}>
                {sale ? paymentMethodLabels[sale.paymentMethod] : '—'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-textMuted">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {sale ? formatDate(sale.createdAt) : '—'}
              </span>
              {sale && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  ID: {sale.id.slice(0, 8)}...
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Totals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Total USD</p>
              <p className="text-2xl font-bold text-text">{sale ? formatCurrency(sale.totalUSD, 'USD') : '—'}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Total VES</p>
              <p className="text-2xl font-bold text-text">{sale ? formatCurrency(sale.totalVES, 'VES') : '—'}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Tasa de Cambio</p>
              <p className="text-2xl font-bold text-text">
                {sale ? `1 USD = ${sale.exchangeRate.toLocaleString('es-VE')} VES` : '—'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text">Items de la Venta</h3>
          {sale && sale.items.length > 0 && (
            <span className="text-sm text-textMuted">{sale.items.length} item{sale.items.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        {sale?.items && sale.items.length > 0 ? (
          <div className="space-y-3">
            {sale.items.map((item) => (
              <div
                key={item.serviceId}
                className="flex items-center justify-between gap-4 p-3 bg-background rounded-lg border border-border"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-text truncate">{item.serviceName}</h4>
                  <p className="text-sm text-textMuted">
                    {item.quantity} × {formatCurrency(item.priceUSD, 'USD')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-secondary">{formatCurrency(item.subtotalUSD, 'USD')}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileDown className="w-12 h-12 text-textMuted mx-auto mb-4" />
            <p className="text-textMuted">No hay items en esta venta</p>
          </div>
        )}
      </Card>

      {sale?.notes && (
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <FileDown className="w-4 h-4 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-text">Notas</h3>
          </div>
          <p className="text-text">{sale.notes}</p>
        </Card>
      )}
    </div>
  );
}