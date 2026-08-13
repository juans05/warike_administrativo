'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Fraunces, Karla } from 'next/font/google';
import { publicApi } from '../../../lib/api-client';

const fraunces = Fraunces({ subsets: ['latin'], weight: ['500', '600', '700', '900'], style: ['normal', 'italic'], variable: '--font-fraunces' });
const karla = Karla({ subsets: ['latin'], weight: ['400', '500', '700', '800'], variable: '--font-karla' });

type Dish = {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  imageUrl: string | null;
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
};

const ACCENT: Record<CategoryType, { ink: string; wash: string; tint: string; icon: string }> = {
  food: { ink: '#A8431F', wash: '#EFC9AE', tint: '#FBEEE3', icon: '◆' },
  drink: { ink: '#146661', wash: '#AFD6D1', tint: '#E6F1EF', icon: '●' },
  dessert: { ink: '#B23D65', wash: '#EFB9CB', tint: '#FBEBF0', icon: '✦' },
  other: { ink: '#7A5B33', wash: '#DDC9A3', tint: '#F5EEE1', icon: '▲' },
};

export default function PublicMenuPage() {
  const { id } = useParams<{ id: string }>();
  const [place, setPlace] = useState<Place | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoOpen, setVideoOpen] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF3E7] flex items-center justify-center">
        <div className="space-y-3 w-full max-w-sm px-6">
          <div className="h-32 bg-[#EEE2CC] rounded-2xl animate-pulse" />
          <div className="h-8 bg-[#EEE2CC] rounded-xl w-2/3 mx-auto animate-pulse" />
          <div className="h-4 bg-[#EEE2CC] rounded-xl w-1/2 mx-auto animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="min-h-screen bg-[#FAF3E7] flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-[#8A7A63] text-sm">{error || 'Carta no encontrada'}</p>
        </div>
      </div>
    );
  }

  const activeCat = categories.find(c => c.id === activeCategory);
  const activeDishes = activeCat?.dishes ?? [];
  const activeAccent = ACCENT[activeCat?.categoryType || 'food'];
  const hasMenu = categories.length > 0;

  return (
    <div className={`${fraunces.variable} ${karla.variable} min-h-screen bg-[#FAF3E7]`} style={{ fontFamily: 'var(--font-karla)' }}>
      {/* Header */}
      <div className="relative">
        {place.coverImageUrl ? (
          <img src={place.coverImageUrl} alt={place.name} className="w-full h-52 object-cover" />
        ) : (
          <div className="w-full h-52 bg-gradient-to-br from-[#3A2A1C] to-[#1E1610]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1610]/85 via-[#1E1610]/25 to-[#1E1610]/40" />

        {/* Centered logo, overlapping bottom edge */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 rounded-full border-4 border-[#FAF3E7] shadow-lg overflow-hidden bg-[#FAF3E7] flex items-center justify-center">
            {place.logoUrl ? (
              <img src={place.logoUrl} alt={place.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl" style={{ fontFamily: 'var(--font-fraunces)' }}>
                {place.name.charAt(0)}
              </span>
            )}
          </div>
        </div>

        <div className="absolute top-5 left-0 right-0 text-center px-6">
          <p className="text-white/70 text-[10px] tracking-[0.3em] uppercase font-bold">Carta digital</p>
        </div>
      </div>

      <div className="pt-14 pb-4 text-center px-6">
        <h1
          className="text-[#2B2118] text-3xl leading-tight"
          style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 700, fontStyle: 'italic' }}
        >
          {place.name}
        </h1>
      </div>

      {!hasMenu ? (
        place.menuImageUrl ? (
          <div className="px-4 py-4 max-w-2xl mx-auto pb-16">
            <img
              src={place.menuImageUrl}
              alt={`Carta de ${place.name}`}
              className="w-full rounded-2xl shadow-sm border border-[#E8DCC4]"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-[#8A7A63] text-sm">La carta aún no está disponible.</p>
          </div>
        )
      ) : (
        <>
          {/* Category tabs */}
          <div className="sticky top-0 z-10 bg-[#FAF3E7]/95 backdrop-blur-sm border-b border-[#E8DCC4]">
            <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none justify-center">
              {categories.map(cat => {
                const a = ACCENT[cat.categoryType || 'food'];
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className="shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border"
                    style={active
                      ? { background: a.ink, color: '#FFFDF8', borderColor: a.ink }
                      : { background: a.tint, color: a.ink, borderColor: a.wash }}
                  >
                    <span className="mr-1.5">{a.icon}</span>
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dishes: Text -> Image -> Price -> video icon */}
          <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto pb-20">
            {activeDishes.map(dish => (
              <div
                key={dish.id}
                className="rounded-3xl overflow-hidden bg-[#FFFDF8] border shadow-sm"
                style={{ borderColor: activeAccent.wash }}
              >
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-start gap-2">
                    <p
                      className="text-[#2B2118] text-xl leading-snug flex-1"
                      style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 600 }}
                    >
                      {dish.name}
                    </p>
                    {dish.isVegetarian && (
                      <span
                        className="shrink-0 text-[10px] font-black px-2 py-1 rounded-full mt-0.5"
                        style={{ background: '#E4F0DE', color: '#3F6B2E' }}
                        title="Vegetariano"
                      >
                        🌱 Veg
                      </span>
                    )}
                  </div>
                  {dish.description && (
                    <p className="text-[#8A7A63] text-sm mt-1.5 leading-relaxed">{dish.description}</p>
                  )}
                </div>

                {dish.imageUrl && (
                  <div className="relative">
                    <img src={dish.imageUrl} alt={dish.name} className="w-full h-56 object-cover" />
                    {dish.videoUrl && (
                      <button
                        onClick={() => setVideoOpen(dish.videoUrl)}
                        className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-[#1E1610]/70 backdrop-blur-sm flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
                        aria-label={`Ver video de ${dish.name}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11l10-5.5-10-5.5z" /></svg>
                      </button>
                    )}
                  </div>
                )}
                {!dish.imageUrl && dish.videoUrl && (
                  <div className="px-5 pb-1">
                    <button
                      onClick={() => setVideoOpen(dish.videoUrl)}
                      className="flex items-center gap-2 text-sm font-bold rounded-full px-3 py-2"
                      style={{ background: activeAccent.tint, color: activeAccent.ink }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11l10-5.5-10-5.5z" /></svg>
                      Ver preparación
                    </button>
                  </div>
                )}

                {dish.price && (
                  <div className="px-5 py-4 flex items-center justify-between">
                    <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#B7A98D]">Precio</span>
                    <span
                      className="text-2xl"
                      style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 700, color: activeAccent.ink }}
                    >
                      S/ {parseFloat(dish.price).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="border-t border-[#E8DCC4] px-4 py-5 text-center">
        <p className="text-[10px] text-[#B7A98D]">
          Carta digital con <span className="font-black text-[#A8431F]">Wuarike</span>
        </p>
      </div>

      {/* Video lightbox */}
      {videoOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center px-4"
          onClick={() => setVideoOpen(null)}
        >
          <button
            onClick={() => setVideoOpen(null)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center text-xl"
            aria-label="Cerrar video"
          >
            ×
          </button>
          <video
            src={videoOpen}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-[80vh] rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
