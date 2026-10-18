'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { CheckCircle2, ShoppingCart, Store } from 'lucide-react';
import { toast } from 'sonner';
import { hardwareApi } from '../../../lib/api-client';
import { Button, Card, EmptyState, Input, PageHeader, Skeleton } from '../../../components/ui';
import { ProductCard, type HardwareProduct } from '../../../components/hardware/ProductCard';
import { useCustomerLabels } from '../../../hooks/useCustomerLabels';

interface PaidOrder {
  chargeId: string;
  product: string;
  quantity: number;
  amount: number;
}

const CULQI_PUBLIC_KEY = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY;

export default function HardwarePage() {
  const { customers } = useCustomerLabels();
  const [products, setProducts] = useState<HardwareProduct[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [shipping, setShipping] = useState({ fullName: '', phone: '', address: '', district: '' });
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [culqiReady, setCulqiReady] = useState(false);
  const [paidOrder, setPaidOrder] = useState<PaidOrder | null>(null);

  useEffect(() => {
    hardwareApi.getProducts()
      .then((list: HardwareProduct[]) => {
        setProducts(list);
        // Preselect the product chosen on the landing (?product=).
        const requested = new URLSearchParams(window.location.search).get('product');
        setSelectedId(list.find((p) => p.id === requested)?.id || list[0]?.id || null);
      })
      .catch(() => toast.error('No se pudo cargar el catálogo de hardware'))
      .finally(() => setLoading(false));
  }, []);

  const selected = products.find((p) => p.id === selectedId) || null;
  const total = selected ? selected.price * quantity : 0;
  const shippingComplete = Object.values(shipping).every((v) => v.trim());

  const handleBuy = () => {
    if (!selected) return;
    if (!shippingComplete) { toast.warning('Completa los datos de envío.'); return; }
    if (!CULQI_PUBLIC_KEY) { toast.error('Falta NEXT_PUBLIC_CULQI_PUBLIC_KEY: los pagos no están configurados.'); return; }
    if (!window.CulqiCheckout) { toast.warning('Cargando procesador de pagos...'); return; }
    const product = selected;
    const checkout = new window.CulqiCheckout(CULQI_PUBLIC_KEY, {
      settings: {
        title: product.name,
        currency: 'PEN',
        // El backend recalcula el monto con su propio precio; esto solo se muestra en el modal.
        amount: Math.round(product.price * 100) * quantity,
      },
      options: {
        lang: 'auto',
        installments: false,
        modal: true,
        paymentMethods: { tarjeta: true, yape: false, billetera: false, bancaMovil: false, agente: false, cuotealo: false },
        paymentMethodsSort: ['tarjeta'],
      },
      appearance: { menuType: 'sidebar', buttonCardPayText: 'Pagar' },
    });
    checkout.culqi = async () => {
      if (checkout.token) {
        const token = checkout.token.id;
        checkout.close();
        setPaying(true);
        try {
          const order = await hardwareApi.checkout({ token, productId: product.id, quantity, ...shipping });
          setPaidOrder(order);
        } catch (err: any) {
          toast.error(err.message || 'Error al procesar el pago');
        } finally {
          setPaying(false);
        }
      } else if (checkout.error) {
        toast.error(checkout.error.user_message || checkout.error.merchant_message || 'Culqi no pudo procesar la tarjeta');
      }
    };
    checkout.open();
  };

  const header = <PageHeader title="Tienda NFC" subtitle={`Stands y placas para que tus ${customers} dejen su reseña con solo acercar el celular.`} />;

  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <div role="status" aria-label="Cargando" className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="space-y-3">
              <Skeleton className="aspect-square h-auto w-full" />
              <Skeleton className="w-2/3" />
              <Skeleton className="h-6 w-1/3" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (paidOrder) {
    return (
      <div className="space-y-6">
        {header}
        <Card padding="lg" className="max-w-2xl space-y-3">
          <div aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-xl font-semibold text-text">¡Pedido pagado!</h2>
          <p className="text-sm text-text">
            {paidOrder.quantity} x {paidOrder.product} · S/ {paidOrder.amount.toFixed(2)}
          </p>
          <p className="text-sm text-text-muted">
            Código de pago: <span className="font-mono font-medium text-text">{paidOrder.chargeId}</span>. Te contactaremos al {shipping.phone} para coordinar la entrega.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Script src="https://js.culqi.com/checkout-js" onLoad={() => setCulqiReady(true)} strategy="afterInteractive" />

      <div className="space-y-6 pb-12">
        {header}

        {products.length === 0 ? (
          <Card>
            <EmptyState
              icon={Store}
              title="El catálogo no está disponible"
              description="No pudimos cargar los productos. Recarga la página en unos minutos."
            />
          </Card>
        ) : (
          <>
            <section role="radiogroup" aria-label="Productos" className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} selected={p.id === selectedId} onSelect={() => setSelectedId(p.id)} />
              ))}
            </section>

            {selected && (
              <Card padding="lg" className="space-y-6">
                <h2 className="text-xl font-semibold text-text">Datos de envío</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input label="Nombre de quien recibe" maxLength={100} value={shipping.fullName} onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} />
                  <Input label="Teléfono" type="tel" maxLength={20} value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
                  <Input label="Dirección" maxLength={200} value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} />
                  <Input label="Distrito" maxLength={60} value={shipping.district} onChange={(e) => setShipping({ ...shipping, district: e.target.value })} />
                  <Input
                    label="Cantidad"
                    type="number"
                    min={1}
                    max={20}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                  />
                </div>

                <div className="flex flex-col justify-between gap-4 border-t border-border pt-6 md:flex-row md:items-center">
                  <p className="text-2xl font-semibold tabular-nums text-text">Total: S/ {total.toFixed(2)}</p>
                  <Button icon={ShoppingCart} loading={paying} disabled={!culqiReady} onClick={handleBuy}>
                    {paying ? 'Procesando...' : 'Comprar'}
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}
