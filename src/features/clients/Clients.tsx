import { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useClientStore } from '@/store/client.store';
import { useSaleStore } from '@/store/sale.store';
import { type Client } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { Plus, Edit, Trash2, Search, User, Phone, Mail, Package, Users, DollarSign } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function Clients() {
  const { clients, loadClients, createClient, updateClient, deleteClient, isLoading } =
    useClientStore();
  const { sales } = useSaleStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Client sales statistics
  const clientStats = useMemo(() => {
    const stats = new Map<string, { count: number; total: number }>();
    sales.forEach((s) => {
      if (s.clientName) {
        const existing = stats.get(s.clientName) || { count: 0, total: 0 };
        stats.set(s.clientName, {
          count: existing.count + 1,
          total: existing.total + s.totalUSD,
        });
      }
    });
    return stats;
  }, [sales]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (editingClient) {
        await updateClient(editingClient.id, data);
      } else {
        await createClient({
          name: data.name,
          phone: data.phone || undefined,
          email: data.email || undefined,
          notes: data.notes || undefined,
        });
      }
      setIsModalOpen(false);
      setEditingClient(null);
      reset();
    } catch (e) {
      console.error('Error saving client:', e);
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    reset({
      name: client.name,
      phone: client.phone || '',
      email: client.email || '',
      notes: client.notes || '',
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingClient(null);
    reset();
    setIsModalOpen(true);
  };

  const confirmDelete = (client: Client) => {
    if (window.confirm(`¿Eliminar a "${client.name}"?`)) {
      deleteClient(client.id);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-16">
      <header>
        <h1 className="text-2xl font-bold text-text">Clientes</h1>
        <p className="text-textMuted mt-1">Gestiona tus clientes</p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Total clientes</p>
              <p className="text-xl font-bold text-text">{clients.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Con compras</p>
              <p className="text-xl font-bold text-text">
                {new Set(sales.map(s => s.clientName).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Ingresos totales</p>
              <p className="text-xl font-bold text-text">
                {formatCurrency(sales.reduce((sum, s) => sum + s.totalUSD, 0), 'USD')}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Búsqueda</p>
              <p className="text-xl font-bold text-text">{searchTerm || '—'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Add */}
      <Card>
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={openCreateModal} className="flex-shrink-0 gap-2">
            <Plus className="w-5 h-5" />
            <span>Nuevo cliente</span>
          </Button>
        </div>
      </Card>

      {/* Clients List */}
      {isLoading ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-textMuted">Cargando clientes...</p>
          </div>
        </Card>
      ) : filteredClients.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <User className="w-12 h-12 text-textMuted mx-auto mb-4" />
            <p className="text-textMuted text-base mb-2">
              {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
            </p>
            {!searchTerm && (
              <Button variant="primary" className="mt-4" onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar primer cliente
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredClients.map((client) => {
            const stats = clientStats.get(client.name) || { count: 0, total: 0 };
            return (
              <Card key={client.id} hover className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-medium text-text truncate">{client.name}</h3>
                    {stats.count > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                        {stats.count} compra{stats.count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-textMuted">
                    {client.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {client.phone}
                      </span>
                    )}
                    {client.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {client.email}
                      </span>
                    )}
                    {stats.total > 0 && (
                      <span className="flex items-center gap-1 font-medium text-secondary">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(stats.total, 'USD')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(client)}
                    aria-label="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => confirmDelete(client)}
                    className="text-error hover:bg-error/10"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Guardando...' : editingClient ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}