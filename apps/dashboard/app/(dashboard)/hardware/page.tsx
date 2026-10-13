'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { hardwareApi } from '../../../lib/api-client';
import { SkeletonPage } from '../../../components/SkeletonLoader';
import { toast } from 'sonner';

interface HardwareProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
}

interface PaidOrder {
  chargeId: string;
  product: string;
  quantity: number;
  amount: number;
}

const PRODUCT_IMAGES: Record<string, string> = {
  'expositor-nfc': '/images/warike_expositor_clean.png',
  'stand-madera': '/images/warike_madera_clean.png',
  'placa-google': '/images/warike_placa_clean.png',
};

const CULQI_PUBLIC_KEY = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY;

const inputClass = 'w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#F26122]';
const labelClass = 'block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1';

export default function HardwarePage() {
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

  if (loading) return <SkeletonPage type="default" />;

  if (paidOrder) {
    return (
      <section className="max-w-2xl bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 space-y-3">
        <div className="text-4xl">✅</div>
        <h1 className="text-2xl font-black text-[#1A1A1A]">¡Pedido pagado!</h1>
        <p className="text-gray-500 font-medium">
          {paidOrder.quantity} x {paidOrder.product} — S/. {paidOrder.amount.toFixed(2)}
        </p>
        <p className="text-gray-500 font-medium text-sm">
          Código de pago: <span className="font-mono font-bold">{paidOrder.chargeId}</span>. Te contactaremos al {shipping.phone} para coordinar la entrega.
        </p>
      </section>
    );
  }

  return (
    <>
      <Script src="https://js.culqi.com/checkout-js" onLoad={() => setCulqiReady(true)} strategy="afterInteractive" />

      <div className="space-y-10 pb-20 max-w-4xl">
        <header>
          <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">Hardware NFC</h1>
          <p className="text-[#6B7280] font-medium">Stands y placas para que tus clientes dejen su reseña con solo acercar el celular.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={`text-left bg-white rounded-[2rem] border-2 p-6 space-y-3 transition-all ${p.id === selectedId ? 'border-[#F26122] shadow-lg shadow-[#F26122]/10' : 'border-gray-100'}`}
            >
              {PRODUCT_IMAGES[p.id] && <img src={PRODUCT_IMAGES[p.id]} alt={p.name} className="w-full aspect-square object-contain" />}
              <p className="font-black text-[#1A1A1A]">{p.name}</p>
              <p className="text-xl font-black text-[#F26122]">S/. {p.price.toFixed(2)}</p>
            </button>
          ))}
        </section>

        {selected && (
          <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 space-y-6">
            <h2 className="text-xl font-black text-[#1A1A1A]">Datos de envío</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nombre de quien recibe</label>
                <input className={inputClass} maxLength={100} value={shipping.fullName} onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Teléfono</label>
                <input className={inputClass} type="tel" maxLength={20} value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Dirección</label>
                <input className={inputClass} maxLength={200} value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Distrito</label>
                <input className={inputClass} maxLength={60} value={shipping.district} onChange={(e) => setShipping({ ...shipping, district: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Cantidad</label>
                <input className={inputClass} type="number" min={1} max={20} value={quantity} onChange={(e) => setQuantity(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))} />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-gray-50 pt-6">
              <p className="text-2xl font-black text-[#1A1A1A]">Total: S/. {total.toFixed(2)}</p>
              <button
                onClick={handleBuy}
                disabled={paying || !culqiReady}
                className="bg-[#F26122] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#F26122]/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              >
                {paying ? 'Procesando...' : 'Comprar'}
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
