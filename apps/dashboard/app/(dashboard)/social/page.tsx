'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi, fetchWithAuth } from '../../../lib/api-client';
import { SkeletonPage, SkeletonChat } from '../../../components/SkeletonLoader';

// API helpers for social module
const socialApi = {
  getAccounts: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/social/accounts`),
  getConnectUrl: (placeId: string, platform: string) => fetchWithAuth(`/business/places/${placeId}/social/connect-url?platform=${platform}`),
  disconnect: (placeId: string, accountId: string) => fetchWithAuth(`/business/places/${placeId}/social/accounts/${accountId}`, { method: 'DELETE' }),
  getComments: (placeId: string, accountId?: string) => fetchWithAuth(`/business/places/${placeId}/social/comments${accountId ? `?accountId=${accountId}` : ''}`),
  getRules: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/social/rules`),
  updateRules: (placeId: string, data: any) => fetchWithAuth(`/business/places/${placeId}/social/rules`, { method: 'PUT', body: JSON.stringify(data) }),
  reply: (placeId: string, commentId: string, reply: string) => fetchWithAuth(`/business/places/${placeId}/social/comments/${commentId}/reply`, { method: 'POST', body: JSON.stringify({ reply }) }),
  getConversations: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/social/conversations`),
  getConversationMessages: (placeId: string, conversationId: string, accountId: string) => fetchWithAuth(`/business/places/${placeId}/social/conversations/${conversationId}/messages?accountId=${accountId}`),
  sendMessage: (placeId: string, conversationId: string, accountId: string, message: string) => fetchWithAuth(`/business/places/${placeId}/social/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ accountId, message }) }),
};

interface SocialAccountInfo {
  id: string;
  platform: string;
  username: string;
  connectedAt: string;
}

export default function SocialPage() {
  const { activePlaceId } = useRestaurant();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [accounts, setAccounts] = useState<SocialAccountInfo[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPickingPlatform, setIsPickingPlatform] = useState(false);
  const [accountPendingDisconnect, setAccountPendingDisconnect] = useState<SocialAccountInfo | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAccountFilter, setActiveAccountFilter] = useState<string | null>(null);
  const [isSavingRules, setIsSavingRules] = useState(false);

  // Esta misma página es el destino final del redirect de OAuth de Zernio.
  // Instagram/Zernio aíslan la ventana (Cross-Origin-Opener-Policy) durante el OAuth, así que
  // window.opener llega null la mayoría de las veces — no podemos avisar a la ventana principal
  // por mensaje. Solo intentamos cerrarnos; la ventana principal detecta el cierre por su cuenta
  // (ver el poll en handleConnect). Si no se puede cerrar (no era un popup real), limpiamos la URL.
  useEffect(() => {
    const connected = searchParams.get('connected');
    const oauthError = searchParams.get('error');
    if (!connected && !oauthError) return;

    if (oauthError) toast.error('No se pudo conectar la cuenta. Intenta de nuevo.');
    window.close();
    const t = setTimeout(() => router.replace('/social'), 300);
    return () => clearTimeout(t);
  }, [searchParams, router]);

  // Comments
  const [comments, setComments] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  // Direct Messages
  const [activeTab, setActiveTab] = useState<'comments' | 'messages'>('comments');
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [activeConversation, setActiveConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Bot Rules
  const [rules, setRules] = useState({
    isActive: true,
    dmBotEnabled: false,
    replyToQuestions: true,
    replyToCompliments: true,
    redirectComplaints: true,
    revealPrices: false,
    personality: 'friendly' as 'friendly' | 'formal' | 'casual',
  });

  const loadAccounts = React.useCallback(() => {
    if (!activePlaceId) { setIsLoading(false); return; }
    setIsLoading(true);
    socialApi.getAccounts(activePlaceId)
      .then((res: any) => setAccounts(res.accounts || []))
      .catch(() => toast.error('No se pudieron cargar las cuentas conectadas.'))
      .finally(() => setIsLoading(false));
  }, [activePlaceId]);

  // Load accounts
  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  // Load comments when accounts change
  useEffect(() => {
    if (!activePlaceId || accounts.length === 0) { setComments([]); return; }
    socialApi.getComments(activePlaceId, activeAccountFilter || undefined)
      .then((res: any) => {
        setComments(res.data || []);
        if (res.notice) toast.info(res.notice);
      })
      .catch(() => toast.error('No se pudieron cargar los comentarios.'));
  }, [activePlaceId, accounts, activeAccountFilter]);

  // Load DM conversations when switching to that tab
  useEffect(() => {
    if (activeTab !== 'messages' || !activePlaceId || accounts.length === 0) return;
    setIsLoadingConversations(true);
    socialApi.getConversations(activePlaceId)
      .then((res: any) => setConversations(res.data || []))
      .catch(() => toast.error('No se pudieron cargar los mensajes directos.'))
      .finally(() => setIsLoadingConversations(false));
  }, [activeTab, activePlaceId, accounts]);

  // Load rules
  useEffect(() => {
    if (!activePlaceId) return;
    socialApi.getRules(activePlaceId)
      .then((res: any) => {
        if (res.replyToQuestions !== undefined) setRules(res);
      })
      .catch(() => {});
  }, [activePlaceId]);

  const handleConnect = async (platform: 'instagram' | 'facebook') => {
    if (!activePlaceId) return;
    setIsPickingPlatform(false);
    setIsConnecting(true);
    try {
      const { authUrl } = await socialApi.getConnectUrl(activePlaceId, platform);
      const popup = window.open(authUrl, 'zernio-connect', 'width=520,height=680');
      if (!popup) {
        toast.error('El navegador bloqueó la ventana emergente. Habilita los popups para este sitio.');
        setIsConnecting(false);
        return;
      }
      // No podemos confiar en window.opener/postMessage (Instagram/Zernio aíslan la ventana
      // durante el OAuth), así que detectamos que terminó por el cierre del popup y refrescamos.
      const countBefore = accounts.length;
      const poll = setInterval(() => {
        if (!popup.closed) return;
        clearInterval(poll);
        setIsConnecting(false);
        socialApi.getAccounts(activePlaceId)
          .then((res: any) => {
            const newAccounts = res.accounts || [];
            setAccounts(newAccounts);
            if (newAccounts.length > countBefore) toast.success('Cuenta conectada correctamente.');
          })
          .catch(() => {});
      }, 800);
    } catch {
      toast.error('No se pudo iniciar la conexión con Instagram/Facebook. Intenta de nuevo.');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!activePlaceId || !accountPendingDisconnect) return;
    setIsDisconnecting(true);
    try {
      await socialApi.disconnect(activePlaceId, accountPendingDisconnect.id);
      setAccounts(prev => prev.filter(a => a.id !== accountPendingDisconnect.id));
      setAccountPendingDisconnect(null);
    } catch {
      toast.error('No se pudo desvincular la cuenta. Intenta de nuevo.');
    }
    setIsDisconnecting(false);
  };

  const handleReply = async (commentId: string) => {
    if (!activePlaceId || !replyText[commentId]) return;
    try {
      await socialApi.reply(activePlaceId, commentId, replyText[commentId]);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, isReplied: true, manualReply: replyText[commentId] } : c));
      setReplyText(prev => ({ ...prev, [commentId]: '' }));
    } catch {
      toast.error('No se pudo enviar la respuesta. Intenta de nuevo.');
    }
  };

  const openConversation = (conv: any) => {
    if (!activePlaceId) return;
    setActiveConversation(conv);
    setMessages([]);
    setIsLoadingMessages(true);
    socialApi.getConversationMessages(activePlaceId, conv.id, conv.accountId)
      .then((res: any) => setMessages(res.data || []))
      .catch(() => toast.error('No se pudo cargar la conversación.'))
      .finally(() => setIsLoadingMessages(false));
  };

  const handleSendMessage = async () => {
    if (!activePlaceId || !activeConversation || !messageText.trim()) return;
    setIsSendingMessage(true);
    try {
      await socialApi.sendMessage(activePlaceId, activeConversation.id, activeConversation.accountId, messageText);
      setMessages(prev => [...prev, {
        id: `local-${Date.now()}`,
        message: messageText,
        direction: 'outgoing',
        createdAt: new Date().toISOString(),
      }]);
      setMessageText('');
    } catch {
      toast.error('No se pudo enviar el mensaje. Intenta de nuevo.');
    }
    setIsSendingMessage(false);
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

  if (isLoading) return <SkeletonPage type="default" />;

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
          onClick={() => setIsPickingPlatform(true)}
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
             <p className="text-text-muted font-bold">Autoriza a Wuarike para leer y responder automáticamente los comentarios de tus clientes 24/7.</p>
             <p className="text-xs font-bold text-gray-400">Puedes vincular <span className="text-primary">múltiples cuentas</span> si tu negocio tiene varias sedes o marcas.</p>
          </div>
          <button 
            onClick={() => setIsPickingPlatform(true)}
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
                      onClick={() => setAccountPendingDisconnect(account)}
                      className="text-[9px] font-black text-red-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              {/* Add another account button */}
              <button
                onClick={() => setIsPickingPlatform(true)}
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
            
            {/* Left Column: Comments / DMs */}
            <div className="lg:col-span-7 space-y-8">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'comments' ? 'bg-text text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  Comentarios
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'messages' ? 'bg-text text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  Mensajes Directos
                </button>
              </div>

              {activeTab === 'comments' ? (
              <>
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
              </>
              ) : isLoadingConversations ? (
              <SkeletonChat />
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 h-[600px]">
                {/* Conversation list */}
                <div className="sm:col-span-2 bg-white rounded-[2rem] border border-border overflow-y-auto p-3 space-y-2">
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <div className="text-3xl">✉️</div>
                      <p className="text-xs font-bold text-gray-400">Sin mensajes directos aún.</p>
                    </div>
                  ) : (
                    conversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => openConversation(conv)}
                        className={`w-full text-left p-3 rounded-2xl transition-colors flex items-center gap-3 ${activeConversation?.id === conv.id ? 'bg-primary/10' : 'hover:bg-background'}`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg shrink-0">👤</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center gap-2">
                            <p className="font-black text-xs text-text truncate">{conv.participantName || conv.participantUsername}</p>
                            {!!conv.unreadCount && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                          </div>
                          <p className="text-[11px] font-bold text-gray-400 truncate">{conv.lastMessage}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Thread */}
                <div className="sm:col-span-3 bg-white rounded-[2rem] border border-border flex flex-col overflow-hidden">
                  {!activeConversation ? (
                    <div className="flex-1 flex items-center justify-center text-xs font-bold text-gray-400 p-8 text-center">
                      Selecciona una conversación para ver los mensajes.
                    </div>
                  ) : (
                    <>
                      <div className="p-4 border-b border-border">
                        <p className="font-black text-sm text-text">{activeConversation.participantName || activeConversation.participantUsername}</p>
                        <p className="text-[10px] font-bold text-gray-400">@{activeConversation.participantUsername}</p>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {isLoadingMessages ? (
                          <div className="space-y-4 animate-pulse">
                            <div className="h-10 bg-gray-100 rounded-2xl w-2/3"></div>
                            <div className="h-10 bg-gray-100 rounded-2xl w-1/2 ml-auto"></div>
                            <div className="h-10 bg-gray-100 rounded-2xl w-3/5"></div>
                          </div>
                        ) : (
                          messages.map(m => (
                            <div key={m.id} className={`flex ${m.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-xs font-bold ${m.direction === 'outgoing' ? 'bg-primary text-white' : 'bg-background text-text'}`}>
                                {m.message}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-4 border-t border-border flex gap-2">
                        <input
                          type="text"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="Escribe un mensaje..."
                          className="input-premium py-2 text-xs flex-1"
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={isSendingMessage || !messageText.trim()}
                          className="bg-text text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-colors disabled:opacity-50"
                        >
                          Enviar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              )}
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
                     title="Respuestas Automáticas (Comentarios)"
                     desc="Permite que el bot responda comentarios solo. Si lo apagás, tenés que responder todo a mano."
                     checked={rules.isActive}
                     onChange={(v) => setRules({...rules, isActive: v})}
                   />
                   <ToggleSetting
                     title="Respuestas Automáticas (Mensajes Directos)"
                     desc="Permite que el bot responda los DM del inbox. Por defecto apagado — el inbox es más personal que los comentarios."
                     checked={rules.dmBotEnabled}
                     onChange={(v) => setRules({...rules, dmBotEnabled: v})}
                   />
                   <ToggleSetting
                     title="Preguntas Frecuentes"
                     desc="Responde a dudas sobre horarios, ubicación y menú."
                     checked={rules.replyToQuestions}
                     onChange={(v) => setRules({...rules, replyToQuestions: v})}
                     disabled={!rules.isActive}
                   />
                   <ToggleSetting
                     title="Agradecimientos"
                     desc="Responde automáticamente a elogios y buenos comentarios."
                     checked={rules.replyToCompliments}
                     onChange={(v) => setRules({...rules, replyToCompliments: v})}
                     disabled={!rules.isActive}
                   />
                   <ToggleSetting
                     title="Derivar Quejas"
                     desc="Pide que envíen un Mensaje Directo (DM) si el comentario es negativo."
                     checked={rules.redirectComplaints}
                     onChange={(v) => setRules({...rules, redirectComplaints: v})}
                     disabled={!rules.isActive}
                   />
                   <ToggleSetting
                     title="Responder con Precios"
                     desc="Revelar precios de la carta en los comentarios si lo solicitan."
                     checked={rules.revealPrices}
                     onChange={(v) => setRules({...rules, revealPrices: v})}
                     disabled={!rules.isActive}
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

      {isPickingPlatform && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsPickingPlatform(false)}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 space-y-6" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-1">
              <h3 className="font-black text-lg text-text">¿Qué plataforma quieres vincular?</h3>
              <p className="text-xs font-bold text-text-muted">Vas a autorizar a Wuarike desde tu cuenta de empresa.</p>
            </div>
            <div className="space-y-3">
              {(['instagram', 'facebook'] as const).map(platform => {
                const connectedCount = accounts.filter(a => a.platform === platform).length;
                return (
                  <button
                    key={platform}
                    onClick={() => handleConnect(platform)}
                    className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl border-2 border-border hover:border-primary transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shrink-0 ${platform === 'instagram' ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600' : 'bg-blue-600'}`}>
                      {platform === 'instagram' ? '📷' : 'f'}
                    </div>
                    <span className="font-black text-sm text-text flex-1 text-left capitalize">{platform}</span>
                    {connectedCount > 0 && (
                      <span className="flex items-center gap-1 text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-widest shrink-0">
                        ✓ {connectedCount > 1 ? `${connectedCount} conectadas` : 'Conectado'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setIsPickingPlatform(false)}
              className="w-full text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-text transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {accountPendingDisconnect && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAccountPendingDisconnect(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 space-y-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-2xl mx-auto">⚠️</div>
            <div className="space-y-1 text-center">
              <h3 className="font-black text-lg text-text">¿Desvincular {accountPendingDisconnect.username}?</h3>
              <p className="text-xs font-bold text-text-muted">Dejará de leer y responder comentarios/mensajes de esta cuenta. Podrás volver a conectarla cuando quieras.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setAccountPendingDisconnect(null)}
                className="flex-1 px-5 py-3 rounded-2xl border-2 border-border font-black text-[10px] uppercase tracking-widest text-text-muted hover:border-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="flex-1 px-5 py-3 rounded-2xl bg-red-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDisconnecting ? 'Desvinculando...' : 'Desvincular'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleSetting({ title, desc, checked, onChange, disabled }: { title: string, desc: string, checked: boolean, onChange: (v: boolean) => void, disabled?: boolean }) {
  return (
    <div
      className={`flex justify-between items-center p-5 bg-background rounded-3xl border border-border transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-gray-300'}`}
      onClick={() => !disabled && onChange(!checked)}
    >
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
