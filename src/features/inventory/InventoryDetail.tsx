import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useInventoryStore, type CreateInventoryInput } from '@/store/inventory.store';
import { useRateStore } from '@/store/rate.store';
import { formatCurrency, formatDate, formatRate } from '@/utils/format';
import { ArrowLeft, Edit, Trash2, Package, TrendingUp, AlertCircle, DollarSign, AlertTriangle, Copy } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { type InventoryItem } from '@/types';

const inventorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  category: z.string().min(1, 'La categoría es obligatoria'),
  quantity: z
    .number({ required_error: 'La cantidad es obligatoria' })
    .nonnegative('La cantidad debe ser positiva'),
  unit: z.string().min(1, 'La unidad es obligatoria'),
  purchasePriceUSD: z.number().positive('El precio debe ser positivo').optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
  lowStockThreshold: z.number().nonnegative().optional(),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

type Category = 'papeleria' | 'materiales' | 'herramientas' | 'otros';

const categories: { value: Category; label: string; icon: string }[] = [
  { value: 'papeleria', label: 'Papelería', icon: '📄' },
  { value: 'materiales', label: 'Materiales', icon: '📦' },
  { value: 'herramientas', label: 'Herramientas', icon: '🔧' },
  { value: 'otros', label: 'Otros', icon: '📋' },
];

const categoryColors: Record<Category, string> = {
  papeleria: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  materiales: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  herramientas: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  otros: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export default function InventoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, getItemById, updateItem, deleteItem } = useInventoryStore();
  const { rate } = useRateStore();

  const [item, setItem] = useState<InventoryItem | null>(items.find((i) => i.id === id));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const found = getItemById(id || '');
    setItem(found || null);
  }, [id, getItemById, items]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
  });

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        description: item.description || '',
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        purchasePriceUSD: item.purchasePriceUSD,
        supplier: item.supplier || '',
        notes: item.notes || '',
        lowStockThreshold: item.lowStockThreshold,
      });
    }
  }, [item, reset]);

  const handleUpdate = async (data: InventoryFormData) => {
    if (!item) return;
    await updateItem(item.id, data);
    toast.success('Material actualizado');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`¿Eliminar "${item?.name}"?`)) {
      await deleteItem(id || '');
      toast.success('Material eliminado');
      navigate('/inventario');
    }
  };

  const isLowStock = item && item.lowStockThreshold && item.quantity <= item.lowStockThreshold;

  if (!item) {
    return (
      <div className="p-4 space-y-4">
        <Link to="/inventario">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver a Inventario
          </Button>
        </Link>
        <Card>
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-textMuted mx-auto mb-4" />
            <p className="text-textMuted text-base mb-4">Material no encontrado</p>
            <Link to="/inventario">
              <Button variant="secondary">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver a Inventario
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
        <Link to="/inventario">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            Editar
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

      {/* Item Header */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
            <Package className="w-8 h-8 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h2 className="text-xl font-bold text-text truncate">{item.name}</h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[item.category as Category]}`}>
                {categories.find(c => c.value === item.category)?.icon} {item.category}
              </span>
              {isLowStock && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-error/10 text-error flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Stock bajo
                </span>
              )}
            </div>
            {item.description && (
              <p className="text-textMuted mb-4">{item.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-textMuted">
              <span className="flex items-center gap-1">
                <Copy className="w-3 h-3" />
                ID: {item.id.slice(0, 8)}...
              </span>
              {item.supplier && (
                <span className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {item.supplier}
                </span>
              )}
              {item.createdAt && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {formatDate(item.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Quantity & Unit */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Cantidad</p>
              <p className="text-2xl font-bold text-text">{item.quantity}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Unidad</p>
              <p className="text-2xl font-bold text-text">{item.unit}</p>
            </div>
          </div>
        </Card>
        {item.lowStockThreshold && (
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-textMuted">Umbral stock</p>
                <p className="text-2xl font-bold text-text">{item.lowStockThreshold}</p>
              </div>
            </div>
          </Card>
        )}
        {item.purchasePriceUSD && (
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-textMuted">Valor unit.</p>
                <p className="text-2xl font-bold text-text">{formatCurrency(item.purchasePriceUSD, 'USD')}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Pricing & Inventory Value */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-text">Información de Compra</h3>
          </div>
          <div className="space-y-4">
            {item.purchasePriceUSD ? (
              <>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-sm text-textMuted">Precio Compra USD</p>
                    <p className="font-bold text-text text-lg">{formatCurrency(item.purchasePriceUSD, 'USD')}</p>
                  </div>
                  {rate && item.purchasePriceVES && (
                    <div className="p-3 bg-background rounded-lg">
                      <p className="text-sm text-textMuted">Precio Compra VES</p>
                      <p className="font-bold text-secondary text-lg">{formatCurrency(item.purchasePriceVES, 'VES')}</p>
                    </div>
                  )}
                </div>

                {item.exchangeRateAtPurchase && (
                  <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                    <p className="text-sm text-textMuted">Tasa en compra</p>
                    <p className="font-medium text-text">1 USD = {formatRate(item.exchangeRateAtPurchase)} VES</p>
                  </div>
                )}

                <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
                  <p className="text-sm text-textMuted">Valor total de inventario</p>
                  <p className="font-bold text-success text-2xl">
                    {formatCurrency(item.quantity * (item.purchasePriceUSD || 0), 'USD')}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-textMuted mx-auto mb-4" />
                <p className="text-textMuted">Sin precio de compra registrado</p>
              </div>
            )}
          </div>
        </Card>

        {rate && item.purchasePriceUSD && (
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-text">Proyección Actual</h3>
            </div>
            <div className="space-y-3 text-center">
              <div className="p-3 bg-background rounded-lg">
                <p className="text-sm text-textMuted">Valor actual VES</p>
                <p className="font-bold text-accent text-xl">
                  {formatCurrency(item.quantity * (item.purchasePriceVES || item.purchasePriceUSD * rate), 'VES')}
                </p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-sm text-textMuted">Tasa actual</p>
                <p className="font-bold text-text">1 USD = {formatRate(rate)} VES</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {item.notes && (
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Copy className="w-4 h-4 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-text">Notas</h3>
          </div>
          <p className="text-text">{item.notes}</p>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Editar Material"
        size="lg"
      >
        <form onSubmit={handleSubmit(handleUpdate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Nombre
            </label>
            <Input
              {...register('name')}
              error={errors.name?.message}
              placeholder="Nombre del material"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Descripción (opcional)
            </label>
            <Input {...register('description')} placeholder="Detalles" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Categoría
              </label>
              <Select
                options={categories.map(cat => ({ value: cat.value, label: `${cat.icon} ${cat.label}` }))}
                placeholder="Seleccionar..."
                {...register('category')}
                error={errors.category?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Unidad
              </label>
              <Input {...register('unit')} error={errors.unit?.message} placeholder="ej. unidad, kg, m" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Cantidad
              </label>
              <Input
                type="number"
                step={0.01}
                {...register('quantity', { valueAsNumber: true })}
                error={errors.quantity?.message}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Umbral Stock Bajo (opcional)
              </label>
              <Input
                type="number"
                step={1}
                {...register('lowStockThreshold', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Precio de Compra (USD)
              </label>
              <Input
                type="number"
                step={0.01}
                {...register('purchasePriceUSD', { valueAsNumber: true })}
                error={errors.purchasePriceUSD?.message}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Precio (VES) - calculado
              </label>
              <Input
                value={rate && item?.purchasePriceUSD ? formatCurrency(item.purchasePriceUSD * rate, 'VES') : '—'}
                disabled
                className="bg-background"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Proveedor (opcional)
            </label>
            <Input {...register('supplier')} placeholder="Nombre del proveedor" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Notas (opcional)
            </label>
            <Input {...register('notes')} placeholder="Información adicional" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Actualizar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}