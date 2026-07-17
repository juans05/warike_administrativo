'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { publicApi } from '../../../lib/api-client';

type Dish = {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  imageUrl: string | null;
  displayOrder: number;
};

type Category = {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  dishes: Dish[];
};

type Place = {
  id: string;
  name: string;
  coverImageUrl: string | null;
};

export default function PublicMenuPage() {
  const { id } = useParams<{ id: string }>();
  const [place, setPlace] = useState<Place | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="space-y-3 w-full max-w-sm px-6">
          <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="h-8 bg-gray-200 rounded-xl w-2/3 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded-xl w-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-gray-500 text-sm">{error || 'Carta no encontrada'}</p>
        </div>
      </div>
    );
  }

  const activeDishes = categories.find(c => c.id === activeCategory)?.dishes ?? [];
  const hasMenu = categories.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative">
        {place.coverImageUrl ? (
          <img
            src={place.coverImageUrl}
            alt={place.name}
            className="w-full h-44 object-cover"
          />
        ) : (
          <div className="w-full h-44 bg-gradient-to-br from-orange-400 to-orange-600" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-white text-2xl font-black drop-shadow">{place.name}</h1>
          <p className="text-white/80 text-xs mt-0.5">Carta digital</p>
        </div>
      </div>

      {!hasMenu ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 text-sm">La carta aún no está disponible.</p>
        </div>
      ) : (
        <>
          {/* Category tabs */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
            <div className="flex gap-1 overflow-x-auto px-4 py-3 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    activeCategory === cat.id
                      ? 'bg-[#F26122] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Dishes */}
          <div className="px-4 py-4 space-y-3 max-w-2xl mx-auto pb-16">
            {activeDishes.map(dish => (
              <div key={dish.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex">
                <div className="flex-1 p-4">
                  <p className="font-black text-gray-900 text-base leading-tight">{dish.name}</p>
                  {dish.description && (
                    <p className="text-gray-500 text-sm mt-1 leading-snug line-clamp-2">{dish.description}</p>
                  )}
                  {dish.price && (
                    <p className="text-[#F26122] font-black text-lg mt-2">
                      S/ {parseFloat(dish.price).toFixed(2)}
                    </p>
                  )}
                </div>
                {dish.imageUrl && (
                  <div className="w-28 shrink-0">
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 text-center">
        <p className="text-[10px] text-gray-400">
          Carta digital con <span className="font-bold text-[#F26122]">Wuarike</span>
        </p>
      </div>
    </div>
  );
}
