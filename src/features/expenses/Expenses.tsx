import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useExpenseStore, type CreateExpenseInput } from '@/store/expense.store';
import { useRateStore } from '@/store/rate.store';
import { type Expense } from '@/types';
import { formatCurrency, formatDate, formatRate } from '@/utils/format';
import { Plus, Edit, Trash2, Search, Filter, Download, DollarSign, CreditCard, ChevronDown, ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const expenseSchema = z.object({
  description: z.string().min(1, 'La descripción es obligatoria'),
  category: z.string().min(1, 'La categoría es obligatoria'),
  amountUSD: z
    .number({ required_error: 'El monto es obligatorio' })
    .positive('El monto debe ser positivo'),
  paymentMethod: z.enum([
    'usd_cash',
    'ves_cash',
    'pago_movil',
    'kontigo',
    'binance',
    'transfer_ves',
    'other',
  ]),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

type Category = 'Materiales' | 'Insumos' | 'Servicios' | 'Transporte' | 'Marketing';

const categories: Category[] = ['Materiales', 'Insumos', 'Servicios', 'Transporte', 'Marketing'];

const paymentMethods = [
  { key: 'usd_cash' as const, label: 'USD Efectivo', icon: <DollarSign className="w-4 h-4" /> },
  { key: 'ves_cash' as const, label: 'Bs. Efectivo', icon: <CreditCard className="w-4 h-4" /> },
  { key: 'pago_movil' as const, label: 'Pago Móvil', icon: <CreditCard className="w-4 h-4" /> },
  { key: 'kontigo' as const, label: 'Kontigo', icon: <CreditCard className="w-4 h-4" /> },
  { key: 'binance' as const, label: 'Binance', icon: <CreditCard className="w-4 h-4" /> },
  { key: 'transfer_ves' as const, label: 'Transferencia Bs.', icon: <CreditCard className="w-4 h-4" /> },
  { key: 'other' as const, label: 'Otro', icon: <CreditCard className="w-4 h-4" /> },
];

const paymentMethodLabels: Record<ExpenseFormData['paymentMethod'], string> = {
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

const categoryColors: Record<Category, string> = {
  Materiales: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Insumos: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Servicios: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Transporte: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Marketing: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

export default function Expenses() {
  const { expenses, loadExpenses, createExpense, deleteExpense, isLoading } =
    useExpenseStore();
  const { rate } = useRateStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
  });

  const watchedAmountUSD = watch('amountUSD', 0);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const filteredExpenses = useMemo(() => {
    let result = expenses;
    if (searchQuery.trim()) {
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.supplier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.category.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter((e) => e.category === categoryFilter);
    }
    return result;
  }, [expenses, searchQuery, categoryFilter]);

  const totalUSD = filteredExpenses.reduce((sum, e) => sum + e.amountUSD, 0);
  const totalVES = filteredExpenses.reduce((sum, e) => sum + e.amountVES, 0);

  const previewAmountVES = rate ? formatCurrency(watchedAmountUSD * rate, 'VES') : null;

  const existingCategories = useMemo(() => {
    const cats = new Set<string>();
    expenses.forEach((e) => cats.add(e.category));
    return Array.from(cats);
  }, [expenses]);

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      await createExpense(data);
      setIsModalOpen(false);
      setEditingExpense(null);
      reset();
    } catch (e) {
      console.error('Error saving expense:', e);
    }
  };

  const openEditModal = (e: React.MouseEvent, expense: Expense) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingExpense(expense);
    reset({
      description: expense.description,
      category: expense.category as Category,
      amountUSD: expense.amountUSD,
      paymentMethod: expense.paymentMethod,
      supplier: expense.supplier || '',
      notes: expense.notes || '',
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingExpense(null);
    reset();
    setIsModalOpen(true);
  };

  const confirmDelete = (e: React.MouseEvent, expense: Expense) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`¿Eliminar "${expense.description}"?`)) {
      deleteExpense(expense.id);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Descripción', 'Categoría', 'Monto USD', 'Monto VES', 'Proveedor', 'Fecha'],
      ...filteredExpenses.map((e) => [
        e.id,
        e.description,
        e.category,
        e.amountUSD,
        e.amountVES,
        e.supplier || '',
        formatDate(e.createdAt),
      ]),
    ].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `egresos-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 space-y-6 pb-16">
      <header>
        <h1 className="text-2xl font-bold text-text">Egresos</h1>
        <p className="text-textMuted mt-1">Registra tus gastos y compras</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Total USD</p>
              <p className="text-xl font-bold text-text">-{formatCurrency(totalUSD, 'USD')}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Total Bs.</p>
              <p className="text-xl font-bold text-text">-{formatCurrency(totalVES, 'VES')}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Egresos</p>
              <p className="text-xl font-bold text-text">{filteredExpenses.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Tasa</p>
              <p className="text-xl font-bold text-text">{formatRate(rate) || '—'}</p>
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
                placeholder="Buscar egresos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setCategoryFilter(categoryFilter === 'all' ? categories[0] : 'all')}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              <span>{categoryFilter === 'all' ? 'Filtrar' : categoryFilter}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
            {filteredExpenses.length > 0 && (
              <Button variant="outline" onClick={handleExport} className="gap-2">
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </Button>
            )}
            <Button onClick={openCreateModal} className="gap-2">
              <Plus className="w-4 h-4" />
              <span>Nuevo</span>
            </Button>
          </div>

          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full justify-between py-2"
            >
              <span className="text-sm font-medium text-textSecondary">Filtrar por categoría</span>
              <ChevronDown className={`w-4 h-4 text-textMuted transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            {showFilters && (
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  variant={categoryFilter === 'all' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter('all')}
                >
                  Todas
                </Button>
                {existingCategories.map((cat) => (
                  <Button
                    key={cat}
                    variant={categoryFilter === cat ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setCategoryFilter(cat as Category)}
                  >
                    {cat}
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
            <p className="text-textMuted">Cargando egresos...</p>
          </div>
        </Card>
      ) : filteredExpenses.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-textMuted mx-auto mb-4" />
            <p className="text-textMuted text-base mb-4">No se encontraron egresos</p>
            {!searchQuery && categoryFilter === 'all' && (
              <Button variant="primary" onClick={openCreateModal}>Registrar primer egreso</Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3" role="list" aria-label="Lista de egresos">
          {filteredExpenses.map((expense) => (
            <Link key={expense.id} to={`/egresos/${expense.id}`} className="block group">
              <Card
                role="listitem"
                hover
                className="flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-medium text-text truncate group-hover:text-secondary transition-colors">{expense.description}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[expense.category as Category] || 'bg-gray-100 text-gray-700'}`}>
                      {expense.category}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-textMuted">
                    {expense.supplier && <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" />{expense.supplier}</span>}
                    <span className="flex items-center gap-1 font-medium text-secondary"><DollarSign className="w-3 h-3" />{formatCurrency(expense.amountUSD, 'USD')}</span>
                    <span>{formatDate(expense.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="font-bold text-error">-{formatCurrency(expense.amountUSD, 'USD')}</p>
                    {rate && <p className="text-xs text-textMuted">{formatCurrency(expense.amountVES, 'VES')}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => openEditModal(e, expense)}
                      aria-label="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => confirmDelete(e, expense)}
                      className="text-error hover:bg-error/10"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Summary sticky footer */}
      {filteredExpenses.length > 0 && (
        <Card className="sticky bottom-20 z-10 shadow-elevation-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-text">Total {filteredExpenses.length} egresos</span>
            <div className="text-right">
              <p className="font-bold text-error">-{formatCurrency(totalUSD, 'USD')}</p>
              <p className="text-sm text-textMuted">-{formatCurrency(totalVES, 'VES')}</p>
            </div>
          </div>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Editar Egreso' : 'Nuevo Egreso'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Descripción *</label>
            <Input {...register('description')} error={errors.description?.message} placeholder="Ej: Compra de materiales" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Categoría *</label>
              <Select
                options={categories.map(cat => ({ value: cat, label: cat }))}
                placeholder="Seleccionar..."
                {...register('category')}
                error={errors.category?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Monto (USD) *</label>
              <Input type="number" step={0.01} {...register('amountUSD', { valueAsNumber: true })} error={errors.amountUSD?.message} placeholder="0.00" />
            </div>
          </div>

          {previewAmountVES && (
            <div className="p-3 bg-secondary/5 rounded-lg border border-secondary/20">
              <p className="text-sm text-textSecondary">
                Monto en Bs. (aproximado): <span className="font-bold text-secondary">{previewAmountVES}</span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text mb-1">Método de Pago *</label>
            <Select
              options={paymentMethods.map(pm => ({ value: pm.key, label: pm.label }))}
              placeholder="Seleccionar..."
              {...register('paymentMethod')}
              error={errors.paymentMethod?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Proveedor (opcional)</label>
              <Input {...register('supplier')} placeholder="Nombre del proveedor" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Notas (opcional)</label>
              <Input {...register('notes')} placeholder="Información adicional" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={isLoading} className="flex-1">{isLoading ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}