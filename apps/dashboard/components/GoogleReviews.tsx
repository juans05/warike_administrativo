import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { businessApi } from '../lib/api-client';

export default function GoogleReviews() {
  const { activePlaceId } = useRestaurant();
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const fetchReviews = async () => {
    if (!activePlaceId) return;
    setIsLoading(true);
    try {
      // 1. Get profile for rating and total count
      const profile = await businessApi.getProfile(activePlaceId);
      if (profile) {
        setRating(profile.googleRating ? parseFloat(profile.googleRating) : 0);
        setTotalReviews(profile.googleTotalReviews || 0);
      }

      // 2. Get persisted reviews from DB
      const dbReviews = await businessApi.getPersistedGoogleReviews(activePlaceId);
      if (dbReviews && Array.isArray(dbReviews)) {
        setReviews(dbReviews.map((r: any) => ({
          author_name: r.authorName,
          profile_photo_url: r.authorPhotoUrl,
          rating: r.rating,
          text: r.text,
          relative_time_description: r.relativeTimeDescription,
          time: r.time
        })));
      }
    } catch (e) {
      console.warn("Error fetching persisted reviews", e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [activePlaceId]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await businessApi.syncGoogleReviews(activePlaceId!);
      await fetchReviews();
    } catch (e) {
      alert('Error al sincronizar con Google. Verifica que el Place ID sea correcto.');
    }
    setIsSyncing(false);
  };

  const handleReply = (id: string) => {
    alert('Función de respuesta requiere verificación de Google Business Profile API. ✨');
    setReplyingTo(null);
  };

  if (isLoading) return <div className="text-center py-10 font-bold text-gray-400">Cargando reseñas...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-[var(--text)] font-warike italic">Reseñas de Google</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-yellow-400 text-xl font-black">{rating.toFixed(1)} ⭐</span>
            <p className="text-[var(--text-muted)] font-bold text-xs uppercase tracking-widest">{totalReviews} reseñas totales en Maps</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="btn-primary px-8 py-3 rounded-2xl text-[10px] tracking-widest disabled:opacity-50 flex items-center gap-2"
          >
            {isSyncing ? '⌛ Sincronizando...' : '🔄 Sincronizar Google'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.length === 0 ? (
          <div className="md:col-span-2 bg-gray-50 p-12 rounded-[2.5rem] border border-dashed border-gray-200 text-center">
            <p className="text-gray-400 font-bold italic">Sincroniza tu Google Place ID para ver las reseñas aquí.</p>
          </div>
        ) : (
          reviews.map((review, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-6 hover:shadow-xl transition-all relative overflow-hidden group">
              <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    {review.profile_photo_url ? (
                      <img src={review.profile_photo_url} className="w-12 h-12 rounded-2xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center font-black text-[var(--primary)] text-lg">
                        {review.author_name[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-black text-[var(--text)] text-base">{review.author_name}</p>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{review.relative_time_description}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 text-yellow-400 text-sm">
                    {Array.from({ length: review.rating }).map((_, i) => <span key={i}>⭐</span>)}
                  </div>
              </div>
              
              <div className="bg-[var(--background)] p-6 rounded-3xl border border-[var(--border)] italic text-[var(--text-muted)] text-sm font-bold leading-relaxed">
                  "{review.text}"
              </div>

              <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest bg-blue-50 text-blue-600">
                    Google Maps
                  </span>
                  <button 
                    onClick={() => setReplyingTo(review.author_name)}
                    className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest hover:scale-110 transition-transform bg-[var(--primary)]/5 px-4 py-2 rounded-xl"
                  >
                    Responder
                  </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
