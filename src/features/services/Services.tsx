import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useServiceStore } from '@/store/service.store';
import { useRateStore } from '@/store/rate.store';
import { type Service } from '@/types';
import { formatCurrency } from '@/utils/format';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash2, Search, Star } from 'lucide-react';

const serviceSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  priceUSD: z
    .number({ required_error: 'El precio es obligatorio' })
    .positive('El precio debe ser positivo'),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function Services() {
  const { services, loadServices, createService, updateService, deleteService, isLoading } =
    useServiceStore();
  const { rate } = useRateStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
  });

  // Watch priceUSD for VES preview
  const watchedPriceUSD = watch('priceUSD', 0);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Calculate VES for the form
  const previewPriceVES = rate ? formatCurrency(watchedPriceUSD * rate, 'VES') : null;

  const onSubmit = async (data: ServiceFormData) => {
    try {
      if (editingService) {
        await updateService(editingService.id, data);
      } else {
        await createService(data);
      }
      setIsModalOpen(false);
      setEditingService(null);
      reset();
    } catch (e) {
      console.error('Error saving service:', e);
    }
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    reset({
      name: service.name,
      description: service.description || '',
      priceUSD: service.priceUSD,
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingService(null);
    reset();
    setIsModalOpen(true);
  };

  const confirmDelete = (service: Service) => {
    if (window.confirm(`¿Eliminar "${service.name}"?`)) {
      deleteService(service.id);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-text">Servicios</h1>
        <p className="text-textSecondary mt-1">Gestiona tus servicios</p>
      </header>

      {/* Search & Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textSecondary" />
          <Input
            placeholder="Buscar servicios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={openCreateModal} className="flex-shrink-0">
          <Plus className="w-5 h-5 mr-1" />
          Nuevo
        </Button>
      </div>

      {/* Services List */}
      {isLoading ? (
        <Card>
          <p className="text-center py-8 text-textSecondary">Cargando servicios...</p>
        </Card>
      ) : filteredServices.length === 0 ? (
        <Card>
          <p className="text-center py-8 text-textSecondary">
            {searchTerm ? 'No se encontraron servicios' : 'No hay servicios registrados'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3 pb-24">
          {filteredServices.map((service) => (
            <Card key={service.id} className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-text">{service.name}</h3>
                {service.description && (
                  <p className="text-sm text-textSecondary">{service.description}</p>
                )}
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span className="font-bold text-primary">
                    {formatCurrency(service.priceUSD ?? 0, 'USD')}
                  </span>
                  {rate && (
                    <span className="text-textSecondary">
                      {formatCurrency(service.priceVES, 'VES')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(service)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => confirmDelete(service)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Nombre del Servicio
            </label>
            <Input
              {...register('name')}
              error={errors.name?.message}
              placeholder="Ej. Diseño gráfico"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Descripción (opcional)
            </label>
            <Input {...register('description')} placeholder="Detalles del servicio" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Precio en USD
            </label>
            <Input
              {...register('priceUSD', { valueAsNumber: true })}
              type="number"
              step={0.01}
              error={errors.priceUSD?.message}
              placeholder="0.00"
            />
          </div>

          {previewPriceVES && (
            <div className="p-3 bg-primary/5 rounded-lg">
              <p className="text-sm text-textSecondary">
                Precio en VES: <span className="font-bold">{previewPriceVES}</span>
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
