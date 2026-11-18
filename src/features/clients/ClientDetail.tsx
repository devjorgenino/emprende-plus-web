import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useClientStore } from '@/store/client.store';
import { useSaleStore } from '@/store/sale.store';
import { formatCurrency, formatDate } from '@/utils/format';
import { ArrowLeft, Edit, Trash2, Phone, Mail, Package, TrendingUp, User, DollarSign, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { type Client } from '@/types';

const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, getClientById, updateClient, deleteClient } = useClientStore();
  const { sales } = useSaleStore();

  const [client, setClient] = useState<Client | null>(clients.find((c) => c.id === id));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const found = getClientById(id || '');
    setClient(found || null);
  }, [id, getClientById, clients]);

  // Calculate client statistics
  const clientSales = sales.filter((s) => s.clientName === client?.name);
  const totalSpent = clientSales.reduce((sum, s) => sum + s.totalUSD, 0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        phone: client.phone || '',
        email: client.email || '',
        notes: client.notes || '',
      });
    }
  }, [client, reset]);

  const handleUpdate = async (data: ClientFormData) => {
    if (!client) return;
    await updateClient(client.id, {
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      notes: data.notes || undefined,
    });
    toast.success('Cliente actualizado');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`¿Eliminar a "${client?.name}"? Esta acción no se puede deshacer.`)) {
      await deleteClient(id || '');
      toast.success('Cliente eliminado');
      navigate('/clientes');
    }
  };

  if (!client) {
    return (
      <div className="p-4 space-y-4 pb-16">
        <Link to="/clientes">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver a Clientes
          </Button>
        </Link>
        <Card>
          <div className="text-center py-12">
            <User className="w-12 h-12 text-textMuted mx-auto mb-4" />
            <p className="text-textMuted text-base mb-4">Cliente no encontrado</p>
            <Link to="/clientes">
              <Button variant="secondary">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver a Clientes
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
        <Link to="/clientes">
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

      {/* Client Header */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-text truncate">{client.name}</h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-textMuted mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Cliente desde {formatDate(client.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Contact Info & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Info */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-text">Información de Contacto</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-textMuted mb-1 flex items-center gap-1">
                <Package className="w-3 h-3" /> Nombre
              </p>
              <p className="font-medium text-text text-lg">{client.name}</p>
            </div>

            {client.phone && (
              <div>
                <p className="text-sm font-medium text-textMuted mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Teléfono
                </p>
                <p className="font-medium text-text">{client.phone}</p>
              </div>
            )}

            {client.email && (
              <div>
                <p className="text-sm font-medium text-textMuted mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </p>
                <p className="font-medium text-text break-all">{client.email}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Stats */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-text">Estadísticas de Compra</h3>
          </div>
          <div className="space-y-4">
            <Card className="bg-secondary/5 border-secondary/20">
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-secondary" />
                <div>
                  <p className="text-sm text-textMuted">Total Gastado</p>
                  <p className="text-xl font-bold text-secondary">
                    {formatCurrency(totalSpent, 'USD')}
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-secondary" />
                  <div>
                    <p className="text-sm text-textMuted">Compras realizadas</p>
                    <p className="text-2xl font-bold text-text">{clientSales.length}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-warning" />
                  <div>
                    <p className="text-sm text-textMuted">Promedio por compra</p>
                    <p className="text-2xl font-bold text-text">
                      {clientSales.length > 0
                        ? formatCurrency(totalSpent / clientSales.length, 'USD')
                        : '—'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Sales */}
      {clientSales.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text">Historial de Compras</h3>
            <span className="text-sm text-textMuted">{clientSales.length} compra{clientSales.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-3">
            {clientSales.slice(0, 5).map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between gap-4 p-3 bg-background rounded-lg border border-border"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-medium text-text truncate">
                      {formatCurrency(sale.totalUSD, 'USD')}
                    </p>
                    <span className="px-2 py-0.5 rounded-full text-xs text-textMuted bg-background border border-border">
                      {formatDate(sale.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-textMuted">{sale.items.length} servicio{sale.items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
            {clientSales.length > 5 && (
              <p className="text-center text-sm text-textMuted py-2">
                +{clientSales.length - 5} compra{clientSales.length - 5 !== 1 ? 's' : ''} más
              </p>
            )}
          </div>
        </Card>
      )}

      {client.notes && (
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-text">Notas</h3>
          </div>
          <p className="text-text">{client.notes}</p>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Editar Cliente"
      >
        <form onSubmit={handleSubmit(handleUpdate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Nombre del Cliente
            </label>
            <Input
              {...register('name')}
              error={errors.name?.message}
              placeholder="Nombre del cliente"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Teléfono (opcional)
              </label>
              <Input
                {...register('phone')}
                error={errors.phone?.message}
                placeholder="+58 ..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Email (opcional)
              </label>
              <Input
                {...register('email')}
                error={errors.email?.message}
                placeholder="cliente@email.com"
                type="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Notas (opcional)
            </label>
            <textarea
              {...register('notes')}
              placeholder="Notas adicionales..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-secondary"
              rows={2}
            />
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
import { FileText } from 'lucide-react';