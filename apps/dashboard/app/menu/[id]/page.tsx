'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import { Image as ImageIcon, LayoutGrid, List, Play, Sparkles, X } from 'lucide-react';
import { publicApi } from '../../../lib/api-client';
import { buildPalette, type MenuTheme, type Palette } from '../../../lib/menuTheme';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'], variable: '--font-display' });
const body = Figtree({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body' });

type Dish = {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  imageUrl: string | null;
  images?: string[] | null;
  videoUrl: string | null;
  isVegetarian: boolean;
  displayOrder: number;
};

type CategoryType = 'food' | 'drink' | 'dessert' | 'other';

type Category = {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  categoryType: CategoryType;
  dishes: Dish[];
};

type Place = {
  id: string;
  name: string;
  coverImageUrl: string | null;
  menuImageUrl: string | null;
  logoUrl: string | null;
  theme?: MenuTheme;
};

type View = 'fotos' | 'cuadricula' | 'lista';

// Los colores salen del diseño que eligió el restaurante (4 colores); sin diseño, carbón con ají amarillo.
const PalContext = createContext<Palette>(buildPalette());
const usePal = () => useContext(PalContext);

const typeColor = (pal: Palette, t: CategoryType) => ({ food: pal.food, drink: pal.drink, dessert: pal.dessert, other: pal.other })[t];

const VIEWS: { id: View; label: string; Icon: typeof LayoutGrid }[] = [
  { id: 'fotos', label: 'Fotos', Icon: ImageIcon },
  { id: 'cuadricula', label: 'Cuadrícula', Icon: LayoutGrid },
  { id: 'lista', label: 'Lista', Icon: List },
];

const photosOf = (d: Dish): string[] => (d.images?.length ? d.images : d.imageUrl ? [d.imageUrl] : []);
const money = (p: string | null) => {
  if (!p) return null;
  const n = parseFloat(p);
  if (Number.isNaN(n)) return null;
  return `S/ ${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;
};

function PriceTag({ price, color }: { price: string | null; color: string }) {
  const C = usePal();
  const text = money(price);
  if (!text) return null;
  return (
    <span className="shrink-0 rounded-full px-3 py-1 text-sm font-bold" style={{ background: color, color: C.accentInk }}>
      {text}
    </span>
  );
}

// Carrusel deslizable (varias fotos por plato) con contador.
function PhotoStrip({ photos, alt, className }: { photos: string[]; alt: string; className: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const onScroll = () => {
    const el = ref.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };
  return (
    <div className="relative">
      <div ref={ref} onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none">
        {photos.map((src, i) => (
          <img key={src + i} src={src} alt={`${alt} ${i + 1}`} loading="lazy" className={`${className} w-full shrink-0 snap-center object-cover`} />
        ))}
      </div>
      {photos.length > 1 && (
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {index + 1}/{photos.length}
        </span>
      )}
    </div>
  );
}

function NoPhoto({ name, color, className }: { name: string; color: string; className: string }) {
  const C = usePal();
  return (
    <div className={`${className} flex items-center justify-center`} style={{ background: `linear-gradient(135deg, ${color}33, ${C.surface})` }}>
      <span className="text-5xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color }}>
        {name.charAt(0)}
      </span>
    </div>
  );
}

function VegBadge() {
  const C = usePal();
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: `${C.veg}26`, color: C.veg }}>
      Vegetariano
    </span>
  );
}

function PlayButton({ onClick, name }: { onClick: () => void; name: string }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={`Ver video de ${name}`}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-black/65 text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-105 motion-reduce:transition-none"
    >
      <Play size={16} fill="currentColor" />
    </button>
  );
}

// Vista "Fotos": un plato por tarjeta, la foto manda.
function FeedCard({ dish, color, onVideo }: { dish: Dish; color: string; onVideo: (url: string) => void }) {
  const C = usePal();
  const photos = photosOf(dish);
  return (
    <article id={`dish-${dish.id}`} className="relative overflow-hidden rounded-3xl" style={{ background: C.surface }}>
      {photos.length > 0 ? (
        <PhotoStrip photos={photos} alt={dish.name} className="aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5]" />
      ) : (
        <NoPhoto name={dish.name} color={color} className="aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5]" />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-5 pb-5 pt-24">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-2xl font-bold leading-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>{dish.name}</h3>
            {dish.description && <p className="mt-1 line-clamp-2 text-sm text-white/80">{dish.description}</p>}
            {dish.isVegetarian && <div className="mt-2"><VegBadge /></div>}
          </div>
          <PriceTag price={dish.price} color={color} />
        </div>
      </div>
      {dish.videoUrl && (
        <div className="absolute left-3 top-3">
          <PlayButton onClick={() => onVideo(dish.videoUrl!)} name={dish.name} />
        </div>
      )}
    </article>
  );
}

// Vista "Cuadrícula": mosaico que aprovecha todo el ancho.
function GridTile({ dish, color, onOpen }: { dish: Dish; color: string; onOpen: () => void }) {
  const C = usePal();
  const photo = photosOf(dish)[0];
  return (
    <button
      id={`dish-${dish.id}`}
      onClick={onOpen}
      className="group overflow-hidden rounded-2xl text-left transition-transform active:scale-[0.98] motion-reduce:transition-none"
      style={{ background: C.surface }}
    >
      <div className="relative">
        {photo ? (
          <img src={photo} alt={dish.name} loading="lazy" className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
        ) : (
          <NoPhoto name={dish.name} color={color} className="aspect-square w-full" />
        )}
        {dish.videoUrl && (
          <span className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm" aria-label="Tiene video">
            <Play size={13} fill="currentColor" />
          </span>
        )}
        <span className="absolute bottom-2 right-2"><PriceTag price={dish.price} color={color} /></span>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug" style={{ fontFamily: 'var(--font-display)', color: C.text }}>{dish.name}</h3>
        {dish.isVegetarian && <div className="mt-1.5"><VegBadge /></div>}
      </div>
    </button>
  );
}

// Vista "Lista": como una carta impresa, para leer rápido.
function ListRow({ dish, color, onOpen }: { dish: Dish; color: string; onOpen: () => void }) {
  const C = usePal();
  const photo = photosOf(dish)[0];
  const price = money(dish.price);
  return (
    <button id={`dish-${dish.id}`} onClick={onOpen} className="flex w-full gap-4 py-4 text-left" style={{ borderBottom: `1px solid ${C.line}` }}>
      {photo ? (
        <img src={photo} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-2xl font-extrabold" style={{ background: `${color}22`, color, fontFamily: 'var(--font-display)' }}>
          {dish.name.charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="text-lg font-bold leading-tight" style={{ fontFamily: 'var(--font-display)', color: C.text }}>{dish.name}</h3>
          <span className="mb-1 min-w-4 flex-1 self-end border-b border-dotted" style={{ borderColor: C.muted }} />
          {price && <span className="shrink-0 text-lg font-bold" style={{ color }}>{price}</span>}
        </div>
        {dish.description && <p className="mt-1 line-clamp-2 text-sm" style={{ color: C.muted }}>{dish.description}</p>}
        {dish.isVegetarian && <div className="mt-1.5"><VegBadge /></div>}
      </div>
    </button>
  );
}

// Detalle de un plato (cuadrícula y lista): hoja desde abajo en celular, ventana centrada en pantallas grandes.
function DishSheet({ dish, color, onClose, onVideo }: { dish: Dish; color: string; onClose: () => void; onVideo: (url: string) => void }) {
  const C = usePal();
  const photos = photosOf(dish);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6" role="dialog" aria-modal="true" aria-label={dish.name}>
      <button className="absolute inset-0 bg-black/75" onClick={onClose} aria-label="Cerrar" tabIndex={-1} />
      <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl md:max-w-lg md:rounded-3xl" style={{ background: C.surface }}>
        <button ref={closeRef} onClick={onClose} aria-label="Cerrar" className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm">
          <X size={18} />
        </button>
        {photos.length > 0 ? <PhotoStrip photos={photos} alt={dish.name} className="aspect-[4/3]" /> : <NoPhoto name={dish.name} color={color} className="aspect-[4/3] w-full" />}
        <div className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-2xl font-bold leading-tight" style={{ fontFamily: 'var(--font-display)', color: C.text }}>{dish.name}</h2>
            <PriceTag price={dish.price} color={color} />
          </div>
          {dish.isVegetarian && <VegBadge />}
          {dish.description && <p className="text-[15px] leading-relaxed" style={{ color: C.muted }}>{dish.description}</p>}
          {dish.videoUrl && (
            <button
              onClick={() => onVideo(dish.videoUrl!)}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold"
              style={{ background: color, color: C.accentInk }}
            >
              <Play size={15} fill="currentColor" /> Ver video del plato
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PublicMenuPage() {
  const { id } = useParams<{ id: string }>();
  const [place, setPlace] = useState<Place | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoOpen, setVideoOpen] = useState<string | null>(null);
  const [openDish, setOpenDish] = useState<Dish | null>(null);
  const [view, setViewState] = useState<View>('cuadricula');
  const [chatOpen, setChatOpen] = useState(false);
  const [chat, setChat] = useState<{ role: 'user' | 'assistant'; content: string; dishIds?: string[] }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const C = buildPalette(place?.theme);

  // La vista elegida se recuerda en el celular; si el almacenamiento falla, se usa la cuadrícula.
  useEffect(() => {
    const isView = (v: string | null): v is View => v === 'fotos' || v === 'cuadricula' || v === 'lista';
    // El enlace manda (?vista=lista, para un QR con su vista favorita); si no, lo último que eligió el cliente.
    const fromLink = new URLSearchParams(window.location.search).get('vista');
    if (isView(fromLink)) { setViewState(fromLink); return; }
    try {
      const saved = localStorage.getItem('wuarike-menu-view');
      if (isView(saved)) setViewState(saved);
    } catch { /* sin almacenamiento */ }
  }, []);
  const setView = (v: View) => {
    setViewState(v);
    try { localStorage.setItem('wuarike-menu-view', v); } catch { /* sin almacenamiento */ }
  };
  const closeDish = useCallback(() => setOpenDish(null), []);

  const askAssistant = async (text: string) => {
    if (!id || !text.trim() || chatBusy) return;
    const history = chat.map(({ role, content }) => ({ role, content }));
    setChat(prev => [...prev, { role: 'user', content: text }]);
    setChatInput('');
    setChatBusy(true);
    try {
      const res: { reply: string; dishIds: string[] } = await publicApi.recommendDish(id, text, history);
      setChat(prev => [...prev, { role: 'assistant', content: res.reply, dishIds: res.dishIds }]);
    } catch {
      setChat(prev => [...prev, { role: 'assistant', content: 'Ahora mismo no puedo ayudarte, intenta de nuevo en un momento.' }]);
    } finally {
      setChatBusy(false);
    }
  };

  // Al tocar una sugerencia, salta a la categoría del plato.
  const goToDish = (dishId: string) => {
    const cat = categories.find(c => c.dishes.some(d => d.id === dishId));
    if (!cat) return;
    setActiveCategory(cat.id);
    setChatOpen(false);
    setTimeout(() => document.getElementById(`dish-${dishId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  };

  useEffect(() => {
    if (!id) return;
    publicApi.getPublicMenu(id)
      .then((data: any) => {
        setPlace(data.place);
        const cats: Category[] = (data.categories || []).filter((c: Category) => c.dishes?.length > 0);
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0].id);
      })
      .catch(() => setError('No se pudo cargar la carta.'))
      .finally(() => setLoading(false));
  }, [id]);

  // flex en columna: el pie queda abajo aunque la carta sea corta.
  const shell = `${display.variable} ${body.variable} flex min-h-screen flex-col`;
  const shellStyle = { background: C.bg, color: C.text, fontFamily: 'var(--font-body)' } as const;
  const theme = place?.theme ?? {};

  if (loading) {
    return (
      <div className={`${shell} flex items-center justify-center`} style={shellStyle}>
        <div className="w-full max-w-sm space-y-3 px-6">
          <div className="h-32 animate-pulse rounded-2xl" style={{ background: C.surface }} />
          <div className="h-8 w-2/3 animate-pulse rounded-xl" style={{ background: C.surface }} />
          <div className="h-4 w-1/2 animate-pulse rounded-xl" style={{ background: C.surface }} />
        </div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className={`${shell} flex items-center justify-center`} style={shellStyle}>
        <div className="px-6 text-center">
          <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>{error || 'No encontramos esta carta'}</p>
          <p className="mt-1 text-sm" style={{ color: C.muted }}>Revisa el enlace o escanea el código QR otra vez.</p>
        </div>
      </div>
    );
  }

  const activeCat = categories.find(c => c.id === activeCategory);
  const activeDishes = activeCat?.dishes ?? [];
  const color = typeColor(C, activeCat?.categoryType || 'food');
  const hasMenu = categories.length > 0;
  const totalDishes = categories.reduce((n, c) => n + c.dishes.length, 0);

  return (
    <PalContext.Provider value={C}>
    <div className={shell} style={shellStyle}>
      <style>{'.scrollbar-none{scrollbar-width:none}.scrollbar-none::-webkit-scrollbar{display:none}'}</style>
      {/* Portada: el color del encabezado y el logo los define el restaurante */}
      <header className="relative" style={{ background: C.headerBg, color: C.headerText }}>
        {place.coverImageUrl ? (
          <img src={place.coverImageUrl} alt="" className="h-56 w-full object-cover md:h-80" />
        ) : (
          <div className="h-56 w-full md:h-80" style={{ background: `linear-gradient(135deg, ${C.headerBg}, ${C.accent}55)` }} />
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${C.headerBg} 0%, ${C.headerBg}B3 38%, transparent 100%)` }} />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto flex max-w-6xl items-end gap-4 px-4 pb-5 md:gap-6 md:pb-8">
            {place.logoUrl && (
              <img src={place.logoUrl} alt={`Logo de ${place.name}`} className="h-16 w-16 shrink-0 rounded-2xl object-cover md:h-24 md:w-24" style={{ border: `3px solid ${C.headerBg}`, background: C.headerBg }} />
            )}
            <div className="min-w-0">
              <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl" style={{ fontFamily: 'var(--font-display)' }}>{place.name}</h1>
              {theme.tagline && <p className="mt-1.5 text-base md:text-lg" style={{ color: C.headerText, opacity: 0.9 }}>{theme.tagline}</p>}
              {hasMenu && <p className="mt-1 text-sm md:text-base" style={{ color: C.headerMuted }}>{totalDishes} platos en {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}</p>}
            </div>
          </div>
        </div>
      </header>

      {!hasMenu ? (
        place.menuImageUrl ? (
          <div className="mx-auto max-w-2xl px-4 pb-16 pt-4">
            <img src={place.menuImageUrl} alt={`Carta de ${place.name}`} className="w-full rounded-2xl" style={{ border: `1px solid ${C.line}` }} />
          </div>
        ) : (
          <div className="px-6 py-24 text-center">
            <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>La carta todavía no está lista</p>
            <p className="mt-1 text-sm" style={{ color: C.muted }}>Vuelve en un rato o pregunta al personal.</p>
          </div>
        )
      ) : (
        <>
          {/* Categorías y forma de ver la carta */}
          <div className="sticky top-0 z-30 backdrop-blur-md" style={{ background: `${C.bg}E6`, borderBottom: `1px solid ${C.line}` }}>
            <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
              <nav className="flex min-w-0 flex-1 gap-2 overflow-x-auto scrollbar-none" aria-label="Categorías">
                {categories.map(cat => {
                  const tone = typeColor(C, cat.categoryType || 'food');
                  const active = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      aria-current={active ? 'true' : undefined}
                      className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors motion-reduce:transition-none"
                      style={active ? { background: tone, color: C.accentInk } : { background: C.surface, color: C.muted, border: `1px solid ${C.line}` }}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </nav>
              <div className="flex shrink-0 rounded-full p-1" style={{ background: C.surface, border: `1px solid ${C.line}` }} role="group" aria-label="Forma de ver la carta">
                {VIEWS.map(({ id: v, label, Icon }) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    aria-pressed={view === v}
                    aria-label={label}
                    title={label}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold"
                    style={view === v ? { background: C.text, color: C.bg } : { color: C.muted }}
                  >
                    <Icon size={16} />
                    <span className="hidden md:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-8">
            {theme.menuTitle && (
              <p className="mb-3 text-lg font-bold md:text-xl" style={{ fontFamily: 'var(--font-display)', color: C.muted }}>{theme.menuTitle}</p>
            )}
            {theme.notice && (
              <p className="mb-6 rounded-xl px-4 py-3 text-sm" style={{ background: C.surface, border: `1px solid ${C.line}`, color: C.text }}>{theme.notice}</p>
            )}
            {activeCat && (
              <div className="mb-6">
                <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ fontFamily: 'var(--font-display)', color }}>{activeCat.name}</h2>
                {activeCat.description && <p className="mt-1 max-w-xl text-[15px]" style={{ color: C.muted }}>{activeCat.description}</p>}
              </div>
            )}

            {view === 'fotos' && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {activeDishes.map(d => <FeedCard key={d.id} dish={d} color={color} onVideo={setVideoOpen} />)}
              </div>
            )}

            {view === 'cuadricula' && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {activeDishes.map(d => <GridTile key={d.id} dish={d} color={color} onOpen={() => setOpenDish(d)} />)}
              </div>
            )}

            {view === 'lista' && (
              <div className="grid grid-cols-1 gap-x-10 lg:grid-cols-2">
                {activeDishes.map(d => <ListRow key={d.id} dish={d} color={color} onOpen={() => setOpenDish(d)} />)}
              </div>
            )}
          </main>
        </>
      )}

      <footer className="px-4 py-8 text-center" style={{ background: C.footerBg, color: C.footerText, borderTop: `1px solid ${C.footerLine}` }}>
        {theme.footerText && <p className="mx-auto mb-4 max-w-xl whitespace-pre-line text-sm leading-relaxed">{theme.footerText}</p>}
        <p className="text-xs" style={{ color: C.footerMuted }}>
          Carta digital hecha con <span className="font-bold" style={{ color: C.footerText }}>Wuarike</span>
        </p>
      </footer>

      {/* Detalle de plato */}
      {openDish && <DishSheet dish={openDish} color={color} onClose={closeDish} onVideo={setVideoOpen} />}

      {/* Asistente IA */}
      {hasMenu && !chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-xl"
          style={{ background: C.accent, color: C.accentInk }}
        >
          <Sparkles size={16} /> ¿Qué me recomiendas?
        </button>
      )}
      {chatOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[75vh] max-w-2xl flex-col rounded-t-3xl shadow-2xl" style={{ background: C.surface, border: `1px solid ${C.line}` }} role="dialog" aria-label="Asistente de la carta">
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
            <p className="flex items-center gap-2 font-bold" style={{ fontFamily: 'var(--font-display)' }}><Sparkles size={16} style={{ color: C.accent }} /> Te ayudo a elegir</p>
            <button onClick={() => setChatOpen(false)} aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-full" style={{ color: C.muted }}><X size={18} /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {chat.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {['Algo vegetariano', 'Algo para compartir', 'Lo más pedido', 'Algo ligero y económico'].map(q => (
                  <button key={q} onClick={() => askAssistant(q)} className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ border: `1px solid ${C.accent}`, color: C.accent }}>{q}</button>
                ))}
              </div>
            )}
            {chat.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
                <p
                  className="inline-block max-w-[85%] rounded-2xl px-4 py-2 text-left text-sm"
                  style={m.role === 'user' ? { background: C.accent, color: C.accentInk } : { background: C.bg, color: C.text }}
                >
                  {m.content}
                </p>
                {m.dishIds?.map(did => {
                  const dish = categories.flatMap(c => c.dishes).find(d => d.id === did);
                  const thumb = dish ? photosOf(dish)[0] : null;
                  return dish && (
                    <button key={did} onClick={() => goToDish(did)} className="mt-2 flex w-full items-center gap-3 rounded-xl p-2 text-left" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
                      {thumb && <img src={thumb} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                      <span className="flex-1 text-sm font-semibold">{dish.name}</span>
                      {money(dish.price) && <span className="text-sm font-bold" style={{ color: C.accent }}>{money(dish.price)}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
            {chatBusy && <p className="text-xs" style={{ color: C.muted }}>Buscando en la carta…</p>}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); askAssistant(chatInput); }} className="flex gap-2 p-3" style={{ borderTop: `1px solid ${C.line}` }}>
            <input
              value={chatInput} onChange={(e) => setChatInput(e.target.value)} maxLength={300}
              placeholder="Cuéntame qué se te antoja"
              className="flex-1 rounded-full px-4 py-2 text-sm outline-none"
              style={{ background: C.bg, color: C.text, border: `1px solid ${C.line}` }}
            />
            <button disabled={chatBusy || !chatInput.trim()} className="rounded-full px-5 text-sm font-bold disabled:opacity-50" style={{ background: C.accent, color: C.accentInk }}>Enviar</button>
          </form>
        </div>
      )}

      {/* Video */}
      {videoOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 px-4" onClick={() => setVideoOpen(null)} role="dialog" aria-label="Video del plato">
          <button onClick={() => setVideoOpen(null)} className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Cerrar video">
            <X size={20} />
          </button>
          <video src={videoOpen} controls autoPlay playsInline className="max-h-[80vh] max-w-full rounded-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
    </PalContext.Provider>
  );
}
