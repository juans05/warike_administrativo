import { Check } from 'lucide-react';
import { Badge, cn } from '../ui';

export interface HardwareProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
}

const PRODUCT_IMAGES: Record<string, string> = {
  'expositor-nfc': '/images/warike_expositor_clean.png',
  'stand-madera': '/images/warike_madera_clean.png',
  'placa-google': '/images/warike_placa_clean.png',
};

/** Producto del catálogo; se elige con un toque (radio), y lo elegido se marca con ícono y texto, no solo con color. */
export function ProductCard({ product, selected, onSelect }: { product: HardwareProduct; selected: boolean; onSelect(): void }) {
  const image = PRODUCT_IMAGES[product.id];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'space-y-3 rounded-card border bg-surface p-4 text-left shadow-card transition-colors duration-200 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:bg-background',
      )}
    >
      {image && (
        // eslint-disable-next-line @next/next/no-img-element -- imágenes estáticas del catálogo
        <img src={image} alt={product.name} className="aspect-square w-full rounded-control object-contain" />
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-base font-semibold text-text">{product.name}</p>
          <p className="text-xl font-semibold tabular-nums text-primary-hover">S/ {product.price.toFixed(2)}</p>
        </div>
        {selected && <Badge tone="primary"><Check size={16} aria-hidden />Elegido</Badge>}
      </div>
    </button>
  );
}
