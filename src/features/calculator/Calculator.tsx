import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useServiceStore } from '@/store/service.store';
import { useQuoteStore } from '@/store/quote.store';
import { useRateStore } from '@/store/rate.store';
import { formatCurrency, formatRate } from '@/utils/format';
import { Save, Share, Trash2, ShoppingCart, List, Plus, X, ArrowLeft, ArrowRight, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

export default function Calculator() {
  const { services, loadServices } = useServiceStore();
  const { draft, addItem, removeItem, updateQuantity, clearDraft, saveQuote, isLoading: isSaving, setClientName } = useQuoteStore();
  const clientName = draft.clientName;
  const { rate, loadRate } = useRateStore();

  const [mode, setMode] = useState<'select' | 'cart'>('select');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isSavingQuote, setIsSavingQuote] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const quoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadServices();
    loadRate();
  }, [loadServices, loadRate]);

  const activeServices = services.filter((s) => s.isActive);
  const totalUSD = draft.items.reduce((sum, i) => sum + i.subtotalUSD, 0);
  const totalVES = rate ? Math.round(totalUSD * rate * 100) / 100 : null;

  const copyToClipboard = async (includePaymentInfo = false) => {
    let text = `COTIZACIÓN
${clientName ? `Cliente: ${clientName}` : ''}
Fecha: ${new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })}

${draft.items.map(i => `${i.quantity}x ${i.serviceName} - ${formatCurrency(i.priceUSD, 'USD')} c/u (Total: ${formatCurrency(i.subtotalUSD, 'USD')})`).join('\n')}

Total USD: ${formatCurrency(totalUSD, 'USD')}
${totalVES ? `Total VES: ${formatCurrency(totalVES, 'VES')}` : ''}
Tasa: ${formatRate(rate)} Bs/USD`;

    if (includePaymentInfo && totalVES) {
      // Solo el apartado de datos de pago móvil sin título para WhatsApp caption
      text = `${totalVES.toFixed(2).replace('.', ',')}\n0105\n04248477348\n24195497`;
    }

    await navigator.clipboard.writeText(text);
    if (!includePaymentInfo) {
      toast.success('Copiado al portapapeles');
      setShowShareModal(false);
    }
    return text;
  };

  const handleShare = async () => {
    if (!quoteRef.current) return;
    try {
      const paymentText = await copyToClipboard(true); // Solo datos de pago para el caption
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(quoteRef.current, {
        scale: 2, // Bajamos escala para que no pese tanto y se vea mejor en móvil
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'cotizacion.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Cotización',
              text: paymentText // Solo monto y datos de pago móvil aquí
            });
            toast.success('Compartido');
          } catch (e) {
            // Silencioso
          }
        } else {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'cotizacion.png';
          link.click();
          toast.success('Imagen guardada');
        }
        setShowShareModal(false);
      }, 'image/png', 0.9);
    } catch (e) {
      toast.error('Error al capturar imagen');
    }
  };

  return (
    <div className="p-4 space-y-6 pb-16">
      <header>
        <h1 className="text-2xl font-bold text-text">Calculadora de Cotizaciones</h1>
        <p className="text-textMuted mt-1">Crea cotizaciones profesionales en segundos</p>
      </header>

      {/* Mode Switcher */}
      <Card className="p-1">
        <div className="flex bg-background rounded-lg">
          <button
            onClick={() => setMode('select')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md transition-all ${
              mode === 'select' ? 'bg-secondary text-white shadow-elevation-1' : 'text-textMuted hover:text-text'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Servicios</span>
          </button>
          <button
            onClick={() => setMode('cart')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md transition-all ${
              mode === 'cart' ? 'bg-secondary text-white shadow-elevation-1' : 'text-textMuted hover:text-text'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Carrito ({draft.items.length})</span>
          </button>
        </div>
      </Card>

      {/* Rate Display */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Copy className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Tasa de Cambio</p>
              {rate ? (
                <p className="text-xl font-bold text-text">1 USD = {formatRate(rate)} VES</p>
              ) : (
                <p className="text-textMuted">Cargando...</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Services Mode */}
      {mode === 'select' && (
        <>
          {activeServices.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-textMuted mx-auto mb-4" />
                <p className="text-textMuted text-base mb-4">No hay servicios activos</p>
                <Button variant="secondary" className="mt-4" onClick={() => window.history.pushState(null, '', '/servicios')}>
                  <Plus className="w-4 h-4 mr-1" />
                  Crear servicios
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeServices.map((service) => (
                <Card key={service.id} hover className="flex items-center justify-between gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <Plus className="w-5 h-5 text-secondary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-text truncate">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-textMuted truncate">{service.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right flex flex-col">
                      <p className="font-bold text-secondary text-lg leading-none mb-1">{formatCurrency(service.priceUSD, 'USD')}</p>
                      {rate ? (
                        <p className="text-[10px] text-textMuted font-medium">
                          ≈ {formatCurrency(service.priceUSD * rate, 'VES')}
                        </p>
                      ) : (
                        <p className="text-[10px] text-textMuted font-medium">Tasa no disponible</p>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => addItem(service)}
                      className="gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Cart Mode */}
      {mode === 'cart' && (
        <>
          {draft.items.length === 0 ? (
            <Card>
              <div className="text-center py-16">
                <ShoppingCart className="w-16 h-16 text-textMuted mx-auto mb-4" />
                <p className="text-textMuted text-lg mb-2">Carrito vacío</p>
                <p className="text-textMuted text-sm mb-6">Agrega servicios para crear tu cotización</p>
                <Button variant="secondary" onClick={() => setMode('select')}>
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Ver servicios
                </Button>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="space-y-3 mb-4">
                {draft.items.map((item, index) => (
                  <div key={item.serviceId} className="flex items-center justify-between gap-4 p-3 bg-background rounded-lg border border-border">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0 text-secondary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-text truncate">{item.serviceName}</h4>
                        <div className="flex flex-col">
                          <p className="text-xs text-textMuted">{formatCurrency(item.priceUSD, 'USD')} c/u</p>
                          {rate ? (
                            <p className="text-[10px] text-slate-400">
                              {formatCurrency(item.priceUSD * rate, 'VES')} c/u
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400">Tasa no disponible</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Input
                        type="number"
                        min={1}
                        max={999}
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 1;
                          updateQuantity(item.serviceId, Math.max(1, Math.min(999, val)));
                        }}
                        className="w-14 h-8 text-center px-1"
                      />
                      <div className="text-right min-w-[90px]">
                        <p className="font-bold text-secondary text-sm">{formatCurrency(item.subtotalUSD, 'USD')}</p>
                        {rate ? (
                          <p className="text-[10px] text-textMuted">
                            {formatCurrency(item.subtotalUSD * rate, 'VES')}
                          </p>
                        ) : (
                          <p className="text-[10px] text-textMuted">--</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.serviceId)}
                        className="text-error hover:bg-error/10"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-border pt-4 mb-4 space-y-3" aria-live="polite">
                <div className="flex justify-between">
                  <span className="text-textSecondary">Subtotal USD</span>
                  <span className="font-bold text-text">{formatCurrency(totalUSD, 'USD')}</span>
                </div>
                {totalVES && (
                  <div className="flex justify-between text-lg">
                    <span className="font-bold text-text">Total Bs.</span>
                    <span className="font-bold text-secondary text-xl">{formatCurrency(totalVES, 'VES')}</span>
                  </div>
                )}
              </div>

              {/* Client Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text mb-1">Cliente (opcional)</label>
                <Input
                  value={clientName || ''}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nombre del cliente para la cotización"
                />
              </div>

              {/* Actions */}
              <div className="space-y-3 pb-8">
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={clearDraft} className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Limpiar
                  </Button>
                  <Button variant="secondary" onClick={async () => { await saveQuote(); toast.success('Cotización guardada'); clearDraft(); }} disabled={isSaving} className="gap-2">
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Guardando...' : 'Guardar cotización'}
                  </Button>
                </div>
                <Button variant="primary" className="w-full gap-2" onClick={() => setShowShareModal(true)}>
                  <Share className="w-4 h-4" />
                  Compartir por WhatsApp / Imagen
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Share Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Compartir Cotización"
        size="sm"
      >
        <div className="space-y-3">
          <Button variant="outline" onClick={() => copyToClipboard(false)} className="w-full justify-start gap-3">
            <Copy className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium text-text">Copiar texto</p>
            </div>
          </Button>
          <Button variant="primary" onClick={handleShare} className="w-full justify-start gap-3">
            <Download className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium text-text">Compartir Imagen</p>
            </div>
          </Button>
        </div>
      </Modal>

      {/* Hidden view for capture */}
      <div className="absolute top-[-9999px] left-0">
        <div ref={quoteRef} className="p-8 bg-white text-slate-900 font-sans rounded-[32px] shadow-2xl" style={{ width: Math.max(500, draft.items.length * 280), minHeight: 350 }}>
          <header className="mb-6">
            <h2 className="text-[36px] font-bold tracking-tight text-slate-900 mb-1">Cotización</h2>
            <div className="flex items-center gap-2 text-[16px] text-slate-400 font-medium">
              <span>{new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span>·</span>
              <span>{clientName || 'Servicio de Papelería'}</span>
            </div>
          </header>

          <div className="space-y-4 mb-6">
            {draft.items.map((item) => (
              <div key={item.serviceId} className="flex justify-between items-start">
                <div className="flex-1 pr-3">
                  <h3 className="text-[20px] font-bold text-slate-800 leading-tight mb-1">{item.serviceName}</h3>
                  <p className="text-[15px] text-slate-400 font-medium">
                    x{item.quantity} · {formatCurrency(Number(item.priceUSD) || 0, 'USD')} c/u
                  </p>
                  {rate && typeof item.priceUSD === 'number' ? (
                    <p className="text-[15px] text-slate-600 font-semibold mt-0.5">
                      ≈ Bs. {formatRate(rate)} c/u
                    </p>
                  ) : null}
                </div>
                <div className="text-right ml-4">
                  <p className="text-[24px] font-bold text-slate-900">{formatCurrency(Number(item.subtotalUSD) || 0, 'USD')}</p>
                  {rate && typeof item.subtotalUSD === 'number' ? (
                    <p className="text-[15px] text-slate-600 font-semibold">
                      Bs. {formatRate(rate)}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="h-[1px] bg-slate-100 mb-4" />

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[28px] font-bold text-slate-900">Total</span>
              <span className="text-[28px] font-bold text-slate-900">{formatCurrency(totalUSD, 'USD')}</span>
            </div>

            {totalVES && (
              <div className="flex justify-between items-center">
                <span className="text-[22px] font-semibold text-slate-700">Total Bs.</span>
                <span className="text-[24px] font-bold text-slate-800">Bs. {totalVES.toLocaleString('es-VE')}</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-[16px] text-slate-700 font-semibold">
              Tasa BCV: 1 USD = Bs. {formatRate(rate)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}