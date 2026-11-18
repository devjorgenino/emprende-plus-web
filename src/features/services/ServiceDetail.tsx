import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useServiceStore } from '@/store/service.store';
import { useRateStore } from '@/store/rate.store';
import { formatCurrency, formatRate } from '@/utils/format';
import { ArrowLeft, Edit, Trash2, Star, Check, X, Copy } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { type Service } from '@/types';

const serviceSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  priceUSD: z
    .number({ required_error: 'El precio es obligatorio' })
    .positive('El precio debe ser positivo'),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { services, getServiceById, updateService, deleteService } = useServiceStore();
  const { rate } = useRateStore();

  const [service, setService] = useState<Service | null>(services.find((s) => s.id === id));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const found = getServiceById(id || '');
    setService(found || null);
  }, [id, getServiceById, services]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
  });

  useEffect(() => {
    if (service) {
      reset({
        name: service.name,
        description: service.description || '',
        priceUSD: service.priceUSD,
      });
    }
  }, [service, reset]);

  const handleUpdate = async (data: ServiceFormData) => {
    if (!service) return;
    await updateService(service.id, {
      name: data.name,
      description: data.description || undefined,
      priceUSD: data.priceUSD,
      priceVES: rate ? Math.round(data.priceUSD * rate * 100) / 100 : undefined,
      isActive: service.isActive,
    });
    toast.success('Servicio actualizado');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`¿Eliminar "${service?.name}"?`)) {
      await deleteService(id || '');
      toast.success('Servicio eliminado');
      navigate('/servicios');
    }
  };

  const toggleActive = async () => {
    if (!service) return;
    await updateService(service.id, { isActive: !service.isActive });
    toast.success(
      service.isActive ? 'Servicio desactivado' : 'Servicio activado'
    );
  };

  if (!service) {
    return (
      <div className="p-4 space-y-4 pb-16">
        <Link to="/servicios">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver a Servicios
          </Button>
        </Link>
        <Card>
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-textMuted mx-auto mb-4" />
            <p className="text-textMuted text-base mb-4">Servicio no encontrado</p>
            <Link to="/servicios">
              <Button variant="secondary">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver a Servicios
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
        <Link to="/servicios">
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
            onClick={toggleActive}
            title={service.isActive ? 'Desactivar' : 'Activar'}
          >
            {service.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
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

      {/* Service Info Card */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
            <Star className="w-8 h-8 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-text truncate">{service.name}</h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                service.isActive ? 'bg-success/10 text-success' : 'bg-textMuted/10 text-textMuted'
              }`}>
                {service.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            {service.description && (
              <p className="text-textMuted mb-4">{service.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-textMuted">
                <Copy className="w-3 h-3" />
                ID: {service.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Pricing Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Precio USD</p>
              <p className="text-2xl font-bold text-text">{formatCurrency(service.priceUSD, 'USD')}</p>
            </div>
          </div>
        </Card>
        {rate && (
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-textMuted">Precio VES</p>
                <p className="text-2xl font-bold text-text">{formatCurrency(service.priceVES, 'VES')}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Exchange Rate */}
      {rate && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-textMuted">Tasa de Cambio</p>
                <p className="font-medium text-text">1 USD = {formatRate(rate)} VES</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Editar Servicio"
      >
        <form onSubmit={handleSubmit(handleUpdate)} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Precio (USD)
              </label>
              <Input
                {...register('priceUSD', { valueAsNumber: true })}
                type="number"
                step={0.01}
                error={errors.priceUSD?.message}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Precio (VES) - calculado
              </label>
              <Input
                value={rate && service ? formatCurrency(service.priceUSD * rate, 'VES') : '—'}
                disabled
                className="bg-background"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Guardar cambios
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Import missing icons
import { DollarSign } from 'lucide-react';