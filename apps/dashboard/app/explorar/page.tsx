'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const MOCK_RESTAURANTS = [
  {
    id: 1,
    name: "Cevichería El Puerto",
    category: "Comida Marina",
    location: "Lima, Perú",
    rating: 4.9,
    reviews: 1250,
    image: "/images/hero.png",
    latestReview: "El mejor ceviche carretillero, el ají está en su punto exacto."
  },
  {
    id: 2,
    name: "Ten1 Tapas",
    category: "Tapas de Autor",
    location: "Madrid, España",
    rating: 4.8,
    reviews: 843,
    image: "/images/interior.png",
    latestReview: "Ambiente increíble y las bravas son de otro planeta."
  },
  {
    id: 3,
    name: "Anticuchos de la Tía",
    category: "Criollo",
    location: "Lima, Perú",
    rating: 4.7,
    reviews: 512,
    image: "/images/stand.png", // using available mock image
    latestReview: "Sabor tradicional. Valió la pena la cola de 20 minutos."
  }
];

export default function ExplorarPage() {
  const [activeCity, setActiveCity] = useState('Lima');

  return (
    <div className="min-h-screen bg-[var(--background)] texture-paper pb-32">
      {/* Navigation */}
      <nav className="bg-white/70 backdrop-blur-xl border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-20 flex justify-between items-center">
          <Link href="/" className="flex flex-col">
            <span className="text-2xl font-black text-[var(--primary)] tracking-tighter font-warike">WUARIKE</span>
            <span className="text-[8px] uppercase tracking-[0.4em] font-black text-[var(--text-muted)] -mt-1">La Guía Oficial</span>
          </Link>
          <div className="flex gap-4">
            <button className="text-xs font-black text-[var(--text)] uppercase tracking-widest px-4 py-2 hover:bg-gray-100 rounded-xl transition-colors">Iniciar Sesión</button>
            <button className="btn-primary text-xs uppercase tracking-widest px-6 py-2 rounded-xl">Descargar App</button>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="pt-20 pb-16 px-8 text-center space-y-6">
        <div className="inline-block px-6 py-2 bg-[var(--text)] text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4">
          Reseñas 100% Verificadas por NFC
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-[var(--text)] font-warike italic leading-[0.9]">
          Encuentra la <br/>verdadera <span className="text-[var(--primary)]">sazón</span>.
        </h1>
        <p className="text-lg font-bold text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
          Olvídate de las trampas turísticas. Descubre los mejores huariques, bares y restaurantes ocultos, validados por la comunidad que realmente ha comido ahí.
        </p>
        
        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mt-10 relative">
          <input 
            type="text" 
            placeholder="¿Qué se te antoja hoy? (ej. Ceviche, Tapas, Chifa...)"
            className="w-full bg-white border-2 border-[var(--border)] rounded-full py-6 pl-8 pr-32 text-sm font-bold shadow-xl outline-none focus:border-[var(--primary)] transition-colors"
          />
          <button className="absolute right-3 top-3 bottom-3 bg-[var(--primary)] text-white px-8 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-[var(--primary)]/30">
            Buscar
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-8 mb-12 flex justify-center gap-4">
        {['Lima', 'Madrid', 'Barcelona', 'Arequipa'].map(city => (
          <button 
            key={city}
            onClick={() => setActiveCity(city)}
            className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeCity === city ? 'bg-[var(--text)] text-white shadow-xl' : 'bg-white text-[var(--text-muted)] hover:bg-gray-50 border border-[var(--border)]'}`}
          >
            {city}
          </button>
        ))}
      </div>

      {/* Directory Grid */}
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-black text-[var(--text)] font-warike italic">Huariques Destacados en {activeCity}</h2>
          <select className="bg-transparent font-black text-xs uppercase tracking-widest text-[var(--text-muted)] outline-none cursor-pointer">
            <option>Más Populares (NFC Taps)</option>
            <option>Mejor Valorados</option>
            <option>Agregados Recientemente</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_RESTAURANTS.map(place => (
            <Link href={`/l/${place.id}`} key={place.id} className="group cursor-pointer">
              <div className="bg-white rounded-[3rem] p-4 border border-[var(--border)] shadow-sm hover:shadow-2xl hover:border-[var(--primary)]/30 transition-all duration-500 hover:-translate-y-2">
                <div className="relative h-64 rounded-[2.5rem] overflow-hidden mb-6">
                  <img src={place.image} alt={place.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                    <span className="text-yellow-500 text-sm">⭐</span>
                    <span className="font-black text-sm">{place.rating}</span>
                  </div>
                </div>
                
                <div className="px-4 space-y-4">
                  <div>
                    <h3 className="text-2xl font-black text-[var(--text)] font-warike group-hover:text-[var(--primary)] transition-colors">{place.name}</h3>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">{place.category} • {place.location}</p>
                  </div>
                  
                  <div className="bg-[var(--background)] p-4 rounded-2xl italic text-xs font-bold text-[var(--text-muted)] relative">
                    <span className="absolute -top-3 left-4 text-2xl opacity-20 font-serif">"</span>
                    {place.latestReview}
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                     <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest bg-[var(--primary)]/10 px-3 py-1 rounded-full flex items-center gap-1">
                       <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-pulse"></span> Verificado NFC
                     </span>
                     <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{place.reviews} reseñas en la app</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Banner App */}
      <div className="max-w-7xl mx-auto px-8 mt-32">
         <div className="bg-[var(--primary)] rounded-[4rem] p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-[var(--primary)]/30">
            <div className="relative z-10 space-y-8">
               <h2 className="text-5xl font-black font-warike italic">La sazón no se busca, se descubre.</h2>
               <p className="text-lg font-bold opacity-90 max-w-2xl mx-auto leading-relaxed">Descarga la app de Wuarike. Guarda tus huariques favoritos, lee las reseñas de la comunidad y encuentra tesoros gastronómicos en Lima y España.</p>
               <button className="bg-white text-[var(--primary)] px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-transform shadow-xl">
                 Descargar para iOS y Android
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
