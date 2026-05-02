'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi, fetchWithAuth } from '../../../lib/api-client';

// API helpers for social module
const socialApi = {
  getAccounts: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/social/accounts`),
  connect: (placeId: string, data: any) => fetchWithAuth(`/business/places/${placeId}/social/connect`, { method: 'POST', body: JSON.stringify(data) }),
  disconnect: (placeId: string, accountId: string) => fetchWithAuth(`/business/places/${placeId}/social/accounts/${accountId}`, { method: 'DELETE' }),
  getComments: (placeId: string, accountId?: string) => fetchWithAuth(`/business/places/${placeId}/social/comments${accountId ? `?accountId=${accountId}` : ''}`),
  getRules: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/social/rules`),
  updateRules: (placeId: string, data: any) => fetchWithAuth(`/business/places/${placeId}/social/rules`, { method: 'PUT', body: JSON.stringify(data) }),
  reply: (placeId: string, commentId: string, reply: string) => fetchWithAuth(`/business/places/${placeId}/social/comments/${commentId}/reply`, { method: 'POST', body: JSON.stringify({ reply }) }),
};

interface SocialAccountInfo {
  id: string;
  platform: string;
  username: string;
  connectedAt: string;
}

export default function SocialPage() {
  const { activePlaceId } = useRestaurant();
  const [accounts, setAccounts] = useState<SocialAccountInfo[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAccountFilter, setActiveAccountFilter] = useState<string | null>(null);
  const [isSavingRules, setIsSavingRules] = useState(false);

  // Comments
  const [comments, setComments] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  // Bot Rules
  const [rules, setRules] = useState({
    replyToQuestions: true,
    replyToCompliments: true,
    redirectComplaints: true,
    revealPrices: false,
    personality: 'friendly' as 'friendly' | 'formal' | 'casual',
  });

  // Load accounts
  useEffect(() => {
    if (!activePlaceId) { setIsLoading(false); return; }
    setIsLoading(true);
    socialApi.getAccounts(activePlaceId)
      .then((res: any) => {
        setAccounts(res.accounts || []);
      })
      .catch(() => {
        // Demo data if backend unavailable
        setAccounts([
          { id: 'demo-1', platform: 'instagram', username: '@mi_huarique_lima', connectedAt: new Date().toISOString() },
        ]);
      })
      .finally(() => setIsLoading(false));
  }, [activePlaceId]);

  // Load comments when accounts change
  useEffect(() => {
    if (!activePlaceId || accounts.length === 0) return;
    socialApi.getComments(activePlaceId, activeAccountFilter || undefined)
      .then((res: any) => setComments(res.data || []))
      .catch(() => {
        // Demo comments
        setComments([
          { id: '1', authorUsername: '@foodie_lima', text: '¿A qué hora abren los domingos?', sentiment: 'question', isReplied: true, aiReply: '¡Hola! Los domingos abrimos de 12:00 PM a 5:00 PM. ¡Te esperamos!', accountUsername: accounts[0]?.username, createdAt: new Date(Date.now() - 300000).toISOString() },
          { id: '2', authorUsername: '@carlos.m', text: '¡El ceviche estuvo increíble! Volveremos seguro.', sentiment: 'positive', isReplied: true, aiReply: '¡Muchas gracias Carlos! Nos alegra que hayas disfrutado de nuestra sazón.', accountUsername: accounts[0]?.username, createdAt: new Date(Date.now() - 7200000).toISOString() },
          { id: '3', authorUsername: '@mariana_99', text: 'Tienen opciones vegetarianas?', sentiment: 'question', isReplied: false, aiReply: '', accountUsername: accounts[0]?.username, createdAt: new Date(Date.now() - 86400000).toISOString() },
          { id: '4', authorUsername: '@pedro_chef', text: 'El servicio fue un poco lento pero la comida compensó todo', sentiment: 'neutral', isReplied: false, aiReply: '', accountUsername: accounts[0]?.username, createdAt: new Date(Date.now() - 172800000).toISOString() },
        ]);
      });
  }, [activePlaceId, accounts, activeAccountFilter]);

  // Load rules
  useEffect(() => {
    if (!activePlaceId) return;
    socialApi.getRules(activePlaceId)
      .then((res: any) => {
        if (res.replyToQuestions !== undefined) setRules(res);
      })
      .catch(() => {});
  }, [activePlaceId]);

  const handleConnect = () => {
    setIsConnecting(true);
    // Simulate OAuth (in production, this opens a Facebook Login popup)
    setTimeout(() => {
      const newAccount: SocialAccountInfo = {
        id: `demo-${Date.now()}`,
        platform: 'instagram',
        username: `@cuenta_${accounts.length + 1}`,
        connectedAt: new Date().toISOString(),
      };
      setAccounts(prev => [...prev, newAccount]);
      setIsConnecting(false);
    }, 1500);
  };

  const handleDisconnect = async (accountId: string) => {
    if (!activePlaceId) return;
    if (!confirm('¿Estás seguro de desvincular esta cuenta?')) return;
    try {
      await socialApi.disconnect(activePlaceId, accountId);
    } catch {}
    setAccounts(prev => prev.filter(a => a.id !== accountId));
  };

  const handleReply = async (commentId: string) => {
    if (!activePlaceId || !replyText[commentId]) return;
    try {
      await socialApi.reply(activePlaceId, commentId, replyText[commentId]);
    } catch {}
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, isReplied: true, manualReply: replyText[commentId] } : c));
    setReplyText(prev => ({ ...prev, [commentId]: '' }));
  };

  const handleSaveRules = async () => {
    if (!activePlaceId) return;
    setIsSavingRules(true);
    try {
      await socialApi.updateRules(activePlaceId, rules);
    } catch {}
    setIsSavingRules(false);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${Math.floor(hours / 24)}d`;
  };

  const sentimentEmoji: Record<string, string> = {
    positive: '😊',
    negative: '😞',
    neutral: '😐',
    question: '❓',
  };

  if (isLoading) return (
    <div className="py-20 text-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="font-bold text-gray-400">Cargando redes sociales...</p>
    </div>
  );

  return (
    <div className="max-w-6xl space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b-2 border-border pb-10">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-text tracking-tight font-warike">Reputación Social</h1>
          <p className="text-text-muted font-bold text-lg max-w-xl leading-snug">
            Gestiona los comentarios de Instagram y deja que la IA responda por ti en tiempo real.
          </p>
        </div>
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="btn-primary px-8 py-4 rounded-2xl text-[10px] tracking-widest disabled:opacity-50 whitespace-nowrap"
        >
          {isConnecting ? 'CONECTANDO...' : '+ VINCULAR CUENTA'}
        </button>
      </header>

      {/* ═══════════════════════════════════════════════ */}
      {/* CUENTAS CONECTADAS                              */}
      {/* ═══════════════════════════════════════════════ */}
      {accounts.length === 0 ? (
        <section className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-border text-center space-y-8 max-w-3xl mx-auto">
          <div className="w-24 h-24 mx-auto rounded-[2rem] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-xl shadow-pink-500/30">
             <span className="text-white text-5xl">📷</span>
          </div>
          <div className="space-y-4">
             <h2 className="text-3xl font-black text-text font-warike">Conecta tu Instagram Profesional</h2>
             <p className="text-text-muted font-bold">Autoriza a Warique para leer y responder automáticamente los comentarios de tus clientes 24/7.</p>
             <p className="text-xs font-bold text-gray-400">Puedes vincular <span className="text-primary">múltiples cuentas</span> si tu negocio tiene varias sedes o marcas.</p>
          </div>
          <button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="btn-primary px-12 py-5 rounded-2xl text-sm tracking-widest w-full max-w-sm mx-auto disabled:opacity-50"
          >
            {isConnecting ? 'CONECTANDO...' : 'VINCULAR PRIMERA CUENTA'}
          </button>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-6">Requiere cuenta de empresa vinculada a Facebook</p>
        </section>
      ) : (
        <>
          {/* Connected Accounts Bar */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-text-muted uppercase tracking-widest px-2">Cuentas Vinculadas ({accounts.length})</h3>
            <div className="flex flex-wrap gap-4">
              {accounts.map(account => (
                <div key={account.id} className={`bg-white px-6 py-4 rounded-2xl border-2 shadow-sm flex items-center gap-4 group transition-all ${
                  activeAccountFilter === account.id ? 'border-primary shadow-lg shadow-primary/10' : 'border-border hover:border-gray-300'
                }`}>
                  <button
                    onClick={() => setActiveAccountFilter(activeAccountFilter === account.id ? null : account.id)}
                    className="flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white text-lg">📷</div>
                    <div className="text-left">
                      <p className="font-black text-sm text-text">{account.username}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        {activeAccountFilter === account.id ? '✓ Filtrando' : 'Instagram'}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <button
                      onClick={() => handleDisconnect(account.id)}
                      className="text-[9px] font-black text-red-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              {/* Add another account button */}
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-6 py-4 rounded-2xl border-2 border-dashed border-primary text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all disabled:opacity-50 flex items-center gap-2"
              >
                + Agregar Cuenta
              </button>
            </div>
            {activeAccountFilter && (
              <button onClick={() => setActiveAccountFilter(null)} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline px-2">
                ✕ Quitar filtro — ver todas las cuentas
              </button>
            )}
          </section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-both">
            
            {/* Left Column: Comments Feed */}
            <div className="lg:col-span-7 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-text font-warike">
                  Comentarios {activeAccountFilter ? `de ${accounts.find(a => a.id === activeAccountFilter)?.username}` : 'de Todas las Cuentas'}
                </h3>
                <span className="bg-gray-100 text-gray-500 text-xs font-black px-4 py-2 rounded-xl">{comments.length} total</span>
              </div>

              <div className="space-y-6">
                {comments.length === 0 ? (
                  <div className="bg-white p-12 rounded-[2.5rem] border border-border text-center space-y-4">
                    <div className="text-5xl">💬</div>
                    <p className="font-black text-text">Sin comentarios aún</p>
                    <p className="text-xs font-bold text-gray-400">Los comentarios de Instagram aparecerán aquí en tiempo real.</p>
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm space-y-4 group hover:shadow-lg transition-all">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">
                          {sentimentEmoji[comment.sentiment] || '💬'}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-text">{comment.authorUsername}</span>
                              {accounts.length > 1 && (
                                <span className="text-[8px] bg-purple-50 text-purple-500 px-2 py-0.5 rounded-full font-black uppercase">
                                  {comment.accountUsername}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-gray-400">{timeAgo(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm font-bold text-gray-600">{comment.text}</p>
                        </div>
                      </div>

                      {(comment.isReplied && (comment.aiReply || comment.manualReply)) ? (
                        <div className="ml-16 bg-background p-4 rounded-2xl border-l-4 border-primary space-y-2">
                           <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                                {comment.manualReply ? 'Respuesta Manual' : 'Respuesta IA'}
                              </span>
                           </div>
                           <p className="text-xs font-bold text-gray-600">{comment.manualReply || comment.aiReply}</p>
                        </div>
                      ) : (
                        <div className="ml-16 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <input
                            type="text"
                            value={replyText[comment.id] || ''}
                            onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                            placeholder="Responder manualmente..."
                            className="input-premium py-2 text-xs flex-1"
                            onKeyDown={(e) => e.key === 'Enter' && handleReply(comment.id)}
                          />
                          <button
                            onClick={() => handleReply(comment.id)}
                            className="bg-text text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-colors"
                          >
                            Enviar
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: AI Bot Settings */}
            <div className="lg:col-span-5 space-y-8">
              <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-border space-y-8 sticky top-10">
                 <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-3xl shadow-lg shadow-primary/20">🤖</div>
                   <div>
                     <h3 className="text-2xl font-black text-text font-warike">Motor de IA</h3>
                     <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                       Aplica a las {accounts.length} cuenta{accounts.length !== 1 ? 's' : ''}
                     </p>
                   </div>
                 </div>

                 <div className="space-y-6 pt-4">
                   <ToggleSetting 
                     title="Preguntas Frecuentes" 
                     desc="Responde a dudas sobre horarios, ubicación y menú." 
                     checked={rules.replyToQuestions}
                     onChange={(v) => setRules({...rules, replyToQuestions: v})}
                   />
                   <ToggleSetting 
                     title="Agradecimientos" 
                     desc="Responde automáticamente a elogios y buenos comentarios." 
                     checked={rules.replyToCompliments}
                     onChange={(v) => setRules({...rules, replyToCompliments: v})}
                   />
                   <ToggleSetting 
                     title="Derivar Quejas" 
                     desc="Pide que envíen un Mensaje Directo (DM) si el comentario es negativo." 
                     checked={rules.redirectComplaints}
                     onChange={(v) => setRules({...rules, redirectComplaints: v})}
                   />
                   <ToggleSetting 
                     title="Responder con Precios" 
                     desc="Revelar precios de la carta en los comentarios si lo solicitan." 
                     checked={rules.revealPrices}
                     onChange={(v) => setRules({...rules, revealPrices: v})}
                   />
                 </div>

                 <div className="pt-8 border-t border-border space-y-4">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Personalidad del Bot</label>
                   <select
                     value={rules.personality}
                     onChange={(e) => setRules({...rules, personality: e.target.value as any})}
                     className="input-premium w-full cursor-pointer"
                   >
                     <option value="friendly">Amigable y Cercano (Ej: ¡Hola! Claro que sí...)</option>
                     <option value="formal">Formal y Profesional (Ej: Estimado cliente...)</option>
                     <option value="casual">Jovial y Moderno (Ej: ¡Qué tal bro!...)</option>
                   </select>
                 </div>
                 
                 <button
                   onClick={handleSaveRules}
                   disabled={isSavingRules}
                   className="w-full btn-primary px-8 py-5 rounded-2xl text-xs tracking-widest disabled:opacity-50"
                 >
                   {isSavingRules ? 'GUARDANDO...' : 'GUARDAR REGLAS DE IA'}
                 </button>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

function ToggleSetting({ title, desc, checked, onChange }: { title: string, desc: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="flex justify-between items-center p-5 bg-background rounded-3xl border border-border cursor-pointer hover:border-gray-300 transition-colors" onClick={() => onChange(!checked)}>
      <div className="flex-1 pr-4">
        <p className="font-black text-text text-sm">{title}</p>
        <p className="text-[10px] font-bold text-text-muted mt-1">{desc}</p>
      </div>
      <div className={`w-12 h-6 rounded-full relative transition-all shrink-0 ${checked ? 'bg-primary' : 'bg-gray-200'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${checked ? 'left-7' : 'left-1'}`}></div>
      </div>
    </div>
  );
}
