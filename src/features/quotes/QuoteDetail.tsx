import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useQuoteStore } from '@/store/quote.store';
import { formatCurrency, formatDate, formatRate } from '@/utils/format';
import { ArrowLeft, Edit, Trash2, Download, Send, Check, X, DollarSign, Calendar, User, FileDown, Clipboard, FileText } from 'lucide-react';
import { toast } from 'sonner';

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'Borrador',
    sent: 'Enviada',
    accepted: 'Aceptada',
    rejected: 'Rechazada',
  };
  return labels[status] || status;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <FileDown className="w-4 h-4" />,
  sent: <Send className="w-4 h-4" />,
  accepted: <Check className="w-4 h-4" />,
  rejected: <X className="w-4 h-4" />,
};

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quotes, getQuoteById, deleteQuote, sendQuote, acceptQuote, isLoading } = useQuoteStore();

  const [quote, setQuote] = useState(quotes.find((q) => q.id === id));

  useEffect(() => {
    const found = getQuoteById(id || '');
    setQuote(found || null);
  }, [id, getQuoteById, quotes]);

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de eliminar esta cotización?')) {
      await deleteQuote(id || '');
      toast.success('Cotización eliminada');
      navigate('/calculadora');
    }
  };

  const handleSend = async () => {
    if (quote) {
      await sendQuote(id || '');
      toast.success('Cotización enviada');
    }
  };

  const handleAccept = async () => {
    if (quote) {
      await acceptQuote(id || '');
      toast.success('Cotización aceptada');
    }
  };

  const handleExport = async () => {
    if (!quote) return;

    const csvContent = [
      ['Campo', 'Valor'],
      ['ID', quote.id],
      ['Cliente', quote.clientName || 'No especificado'],
      ['Total USD', quote.totalUSD.toString()],
      ['Total VES', quote.totalVES.toString()],
      ['Tasa de Cambio', quote.exchangeRate.toString()],
      ['Estado', getStatusLabel(quote.status)],
      ['Fecha', formatDate(quote.createdAt)],
      ['Notas', quote.notes || 'N/A'],
      ...quote.items.map((item) => [
        `Servicio: ${item.serviceName}`,
        `Cantidad: ${item.quantity}`,
        `Precio: ${formatCurrency(item.priceUSD, 'USD')} c/u`,
        `Subtotal: ${formatCurrency(item.subtotalUSD, 'USD')}`,
      ]),
    ].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cotizacion-${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Cotización exportada');
  };

  if (!quote && !isLoading) {
    return (
      <div className="p-4 space-y-4 pb-16">
        <Link to="/calculadora">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver a Calculadora
          </Button>
        </Link>
        <Card>
          <div className="text-center py-12">
            <Clipboard className="w-12 h-12 text-textMuted mx-auto mb-4" />
            <p className="text-textMuted text-base mb-4">Cotización no encontrada</p>
            <Link to="/calculadora">
              <Button variant="secondary">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver a Calculadora
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
        <Link to="/calculadora">
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
          {quote.status === 'draft' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSend}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                Enviar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAccept}
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                Aceptar
              </Button>
            </>
          )}
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

      {/* Quote Header */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
            <Clipboard className="w-8 h-8 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h2 className="text-xl font-bold text-text truncate">
                {quote.clientName ? `Cotización para ${quote.clientName}` : 'Cotización sin cliente'}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)} flex items-center gap-1`}>
                {statusIcons[quote.status]}
                {getStatusLabel(quote.status)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-textMuted">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(quote.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                ID: {quote.id.slice(0, 8)}...
              </span>
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
              <p className="text-2xl font-bold text-text">{formatCurrency(quote.totalUSD, 'USD')}</p>
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
              <p className="text-2xl font-bold text-text">{formatCurrency(quote.totalVES, 'VES')}</p>
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
                1 USD = {formatRate(quote.exchangeRate)} VES
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text">Servicios</h3>
          <span className="text-sm text-textMuted">{quote.items.length} servicio{quote.items.length !== 1 ? 's' : ''}</span>
        </div>
        {quote.items.length > 0 ? (
          <div className="space-y-3">
            {quote.items.map((item) => (
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
            <Clipboard className="w-12 h-12 text-textMuted mx-auto mb-4" />
            <p className="text-textMuted">No hay servicios en esta cotización</p>
          </div>
        )}
      </Card>

      {quote.notes && (
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-text">Notas</h3>
          </div>
          <p className="text-text">{quote.notes}</p>
        </Card>
      )}
    </div>
  );
}

