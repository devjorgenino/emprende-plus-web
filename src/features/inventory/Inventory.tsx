import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useInventoryStore, type CreateInventoryInput } from '@/store/inventory.store';
import { useRateStore } from '@/store/rate.store';
import { formatCurrency, formatRate } from '@/utils/format';
import { Plus, Edit, Trash2, Search, Package, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

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

export default function Inventory() {
  const { items, loadItems, createItem, updateItem, deleteItem, isLoading } =
    useInventoryStore();
  const { rate } = useRateStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
  });

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.supplier || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const lowStockItems = items.filter((i) => i.lowStockThreshold && i.quantity <= i.lowStockThreshold);

  const onSubmit = async (data: InventoryFormData) => {
    try {
      if (editingItem) {
        await updateItem(editingItem.id, data);
      } else {
        await createItem(data);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      reset();
    } catch (e) {
      console.error('Error saving item:', e);
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    reset({
      name: item.name,
      description: item.description || '',
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      purchasePriceUSD: item.purchasePriceUSD,
      supplier: item.supplier || '',
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    reset();
    setIsModalOpen(true);
  };

  const confirmDelete = (item: any) => {
    if (window.confirm(`¿Eliminar "${item.name}"?`)) {
      deleteItem(item.id);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-16">
      <header>
        <h1 className="text-2xl font-bold text-text">Inventario</h1>
        <p className="text-textMuted mt-1">Gestiona tus materiales e implementos</p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Total items</p>
              <p className="text-xl font-bold text-text">{items.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Stock bajo</p>
              <p className="text-xl font-bold text-text">{lowStockItems.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Categorías</p>
              <p className="text-xl font-bold text-text">
                {new Set(items.map(i => i.category)).size}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Tasa</p>
              <p className="text-xl font-bold text-text">{formatRate(rate) || '—'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="bg-warning/5 border-warning">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-warning mb-2">
                Alerta de stock bajo ({lowStockItems.length})
              </p>
              <ul className="text-sm text-warning space-y-1">
                {lowStockItems.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span className="font-medium">{item.name}:</span>
                    <span>{item.quantity} {item.unit}</span>
                  </li>
                ))}
                {lowStockItems.length > 3 && (
                  <li className="text-textMuted">+{lowStockItems.length - 3} más</li>
                )}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Search & Add */}
      <Card>
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
            <Input
              placeholder="Buscar materiales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={openCreateModal} className="flex-shrink-0 gap-2">
            <Plus className="w-5 h-5" />
            <span>Nuevo</span>
          </Button>
        </div>
      </Card>

      {/* Items List */}
      {isLoading ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-textMuted">Cargando inventario...</p>
          </div>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-textMuted mx-auto mb-4" />
            <p className="text-textMuted text-base mb-4">
              {searchTerm ? 'No se encontraron materiales' : 'No hay materiales registrados'}
            </p>
            {!searchTerm && (
              <Button variant="primary" className="mt-4" onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar primer material
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <Card key={item.id} hover className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-medium text-text truncate">{item.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[item.category as Category]}`}>
                    {categories.find(c => c.value === item.category)?.icon} {item.category}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm text-textMuted mb-1">{item.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-textMuted">
                  <span className="font-medium text-text">{item.quantity}</span>
                  <span>{item.unit}</span>
                  {item.supplier && (
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {item.supplier}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {item.purchasePriceUSD && rate && (
                  <div className="text-right">
                    <p className="text-xs text-textMuted">Precio compra</p>
                    <p className="font-bold text-secondary text-sm">
                      {formatCurrency(item.purchasePriceUSD, 'USD')}
                    </p>
                  </div>
                )}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(item)}
                    aria-label="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => confirmDelete(item)}
                    className="text-error hover:bg-error/10"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Material' : 'Nuevo Material'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Guardando...' : editingItem ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}