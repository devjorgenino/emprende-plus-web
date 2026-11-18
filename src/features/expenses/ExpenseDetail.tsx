import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useExpenseStore, type CreateExpenseInput } from '@/store/expense.store';
import { formatCurrency, formatDate, formatRate } from '@/utils/format';
import { ArrowLeft, Edit, Trash2, FileDown, DollarSign, CreditCard, Calendar, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { type Expense } from '@/types';

const paymentMethodLabels: Record<string, string> = {
  usd_cash: 'USD Efectivo',
  ves_cash: 'Bs. Efectivo',
  pago_movil: 'Pago Móvil',
  kontigo: 'Kontigo',
  binance: 'Binance',
  transfer_ves: 'Transferencia Bs.',
  other: 'Otro',
};

const paymentMethodColors: Record<string, string> = {
  usd_cash: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ves_cash: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pago_movil: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  kontigo: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  binance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  transfer_ves: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const categoryColors: Record<string, string> = {
  Materiales: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Insumos: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Servicios: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Transporte: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Marketing: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

export default function ExpenseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { expenses, getExpenseById, updateExpense, deleteExpense, isLoading } = useExpenseStore();

  const [expense, setExpense] = useState<Expense | null>(expenses.find((e) => e.id === id));

  useEffect(() => {
    const found = getExpenseById(id || '');
    setExpense(found || null);
  }, [id, getExpenseById, expenses]);

  const handleDelete = async () => {
    if (window.confirm(`¿Eliminar "${expense?.description}"?`)) {
      await deleteExpense(id || '');
      toast.success('Egreso eliminado');
      navigate('/egresos');
    }
  };

  const handleExport = async () => {
    if (!expense) return;
    const csvContent = [
      ['Campo', 'Valor'],
      ['ID', expense.id],
      ['Descripción', expense.description],
      ['Categoría', expense.category],
      ['Monto USD', expense.amountUSD.toString()],
      ['Monto VES', expense.amountVES.toString()],
      ['Tasa de Cambio', expense.exchangeRate.toString()],
      ['Método de Pago', paymentMethodLabels[expense.paymentMethod] || expense.paymentMethod],
      ['Proveedor', expense.supplier || 'N/A'],
      ['Notas', expense.notes || 'N/A'],
      ['Fecha', formatDate(expense.createdAt)],
    ].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `egreso-${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Egreso exportado');
  };

  if (!expense) {
    return (
      <div className="p-4 space-y-4">
        <Link to="/egresos">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver a Egresos
          </Button>
        </Link>
        <Card>
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-textMuted mx-auto mb-4" />
            <p className="text-textMuted text-base mb-4">Egreso no encontrado</p>
            <Link to="/egresos">
              <Button variant="secondary">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver a Egresos
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <Link to="/egresos">
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

      {/* Expense Header */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-8 h-8 text-error" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h2 className="text-xl font-bold text-text truncate">{expense.description}</h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[expense.category] || 'bg-gray-100 text-gray-700'}`}>
                {expense.category}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-textMuted">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(expense.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                ID: {expense.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Amounts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Monto USD</p>
              <p className="text-2xl font-bold text-error">-{formatCurrency(expense.amountUSD, 'USD')}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Monto VES</p>
              <p className="text-2xl font-bold text-text">-{formatCurrency(expense.amountVES, 'VES')}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Tasa de Cambio</p>
              <p className="text-2xl font-bold text-text">
                1 USD = {formatRate(expense.exchangeRate)} VES
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-text">Detalles del Pago</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-background rounded-lg">
              <span className="text-textMuted">Método de Pago</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentMethodColors[expense.paymentMethod] || 'bg-gray-100 text-gray-700'}`}>
                {paymentMethodLabels[expense.paymentMethod] || expense.paymentMethod}
              </span>
            </div>
            {expense.supplier && (
              <div className="flex justify-between items-center p-2 bg-background rounded-lg">
                <span className="text-textMuted">Proveedor</span>
                <span className="font-medium text-text">{expense.supplier}</span>
              </div>
            )}
            <div className="flex justify-between items-center p-2 bg-background rounded-lg">
              <span className="text-textMuted">Fecha</span>
              <span className="font-medium text-text">{formatDate(expense.createdAt)}</span>
            </div>
          </div>
        </Card>

        {expense.notes && (
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-text">Notas</h3>
            </div>
            <p className="text-text">{expense.notes}</p>
          </Card>
        )}
      </div>

      {/* Summary */}
      <Card className="bg-error/5 border-error/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-error" />
          </div>
          <h3 className="text-lg font-semibold text-text">Resumen</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-textMuted">Categoría</p>
            <p className="font-medium text-text">{expense.category}</p>
          </div>
          <div>
            <p className="text-sm text-textMuted">USD</p>
            <p className="font-bold text-error text-lg">-{formatCurrency(expense.amountUSD, 'USD')}</p>
          </div>
          <div>
            <p className="text-sm text-textMuted">VES</p>
            <p className="font-bold text-text text-lg">-{formatCurrency(expense.amountVES, 'VES')}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Import missing icons
import { FileText } from 'lucide-react';