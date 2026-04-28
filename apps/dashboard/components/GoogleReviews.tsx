'use client';

import React from 'react';

const MOCK_REVIEWS = [
  { id: 1, author: "Juan Perez", rating: 5, text: "El mejor ceviche de Miraflores. El sistema de QR es súper rápido.", date: "Hace 2 días", platform: "Google" },
  { id: 2, author: "Maria Garcia", rating: 4, text: "Excelente sazón, aunque el local estaba un poco lleno. Muy recomendado.", date: "Hace 1 semana", platform: "Google" },
  { id: 3, author: "Carlos Rodriguez", rating: 5, text: "Increíble experiencia. La atención es de primera.", date: "Hace 3 días", platform: "Warique Feedback" },
];

export default function GoogleReviews() {
  const [replyingTo, setReplyingTo] = React.useState<number | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleReply = (id: number) => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setReplyingTo(null);
      alert('Respuesta sincronizada con Google Maps con éxito. ✨');
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-[var(--text)] font-warike italic">Reseñas de la Comunidad</h2>
          <p className="text-[var(--text-muted)] font-bold text-sm uppercase tracking-widest mt-2">Gestión centralizada: Google Maps • Warique • Instagram</p>
        </div>
        <div className="flex gap-4">
          <div className="px-6 py-3 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-3">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Google Sync Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOCK_REVIEWS.map(review => (
          <div key={review.id} className="bg-white p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-6 hover:shadow-xl transition-all relative overflow-hidden group">
             <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center font-black text-[var(--primary)] text-lg">
                    {review.author[0]}
                  </div>
                  <div>
                    <p className="font-black text-[var(--text)] text-base">{review.author}</p>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{review.date}</p>
                  </div>
                </div>
                <div className="flex gap-1 text-yellow-400 text-sm">
                  {Array.from({ length: review.rating }).map((_, i) => <span key={i}>⭐</span>)}
                </div>
             </div>
             
             <div className="bg-[var(--background)] p-6 rounded-3xl border border-[var(--border)] italic text-[var(--text-muted)] text-sm font-bold leading-relaxed">
                "{review.text}"
             </div>

             {replyingTo === review.id ? (
               <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <textarea 
                    className="input-premium min-h-[100px] py-4 text-xs" 
                    placeholder="Escribe tu respuesta oficial aquí..."
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleReply(review.id)}
                      disabled={isSyncing}
                      className="flex-1 bg-[var(--text)] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSyncing ? 'Sincronizando...' : 'Publicar en Google & Warique'}
                    </button>
                    <button onClick={() => setReplyingTo(null)} className="px-6 py-3 bg-gray-100 rounded-xl font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                  </div>
               </div>
             ) : (
               <div className="flex justify-between items-center">
                  <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${review.platform === 'Google' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                    {review.platform}
                  </span>
                  <button 
                    onClick={() => setReplyingTo(review.id)}
                    className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest hover:scale-110 transition-transform bg-[var(--primary)]/5 px-4 py-2 rounded-xl"
                  >
                    Responder
                  </button>
               </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );
}
