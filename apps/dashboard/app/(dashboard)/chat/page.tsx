'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi, teamApi } from '../../../lib/api-client';
import { toast } from 'sonner';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { Button, EmptyState, InboxLayout, PageHeader } from '../../../components/ui';
import { BillingAlert } from '../../../components/whatsapp/BillingAlert';
import { ConversationList, type ConversationFilter } from '../../../components/chat/ConversationList';
import { ChatThread } from '../../../components/chat/ChatThread';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const play = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    play(880, 0, 0.15);
    play(1100, 0.12, 0.2);
  } catch { }
}

// En celular el hilo se abre encima de la lista: no se abre solo al cargar.
const isDesktop = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

function sortConversations(list: any[]) {
  return [...list].sort((a, b) => {
    if (!!a.awaitingReply !== !!b.awaitingReply) return a.awaitingReply ? -1 : 1;
    return new Date(b.lastMessageTime || b.createdAt).getTime() - new Date(a.lastMessageTime || a.createdAt).getTime();
  });
}

export default function ChatPage() {
  const { activePlaceId } = useRestaurant();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSendingFile, setIsSendingFile] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filter, setFilter] = useState<ConversationFilter>('unassigned');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [newMessageCount, setNewMessageCount] = useState<Record<string, number>>({});
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadConversations = (placeId: string) => {
    return businessApi.getConversations(placeId, 1, { filter })
      .then(res => {
        setConversations(res.data || []);
        return res.data || [];
      });
  };

  useEffect(() => {
    if (!activePlaceId) { setIsLoading(false); return; }
    setIsLoading(true);
    loadConversations(activePlaceId)
      .then(data => { if (data.length > 0 && isDesktop()) setSelectedConv(data[0]); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [activePlaceId, filter]);

  useEffect(() => {
    if (!activePlaceId) return;
    teamApi.list(activePlaceId).then(res => setTeamMembers(res.data || [])).catch(() => setTeamMembers([]));
  }, [activePlaceId]);

  useEffect(() => {
    if (!selectedConv) return;
    setIsLoadingMessages(true);
    businessApi.getConversationMessages(selectedConv.id)
      .then(res => { setMessages(res.data || []); setHasMoreMessages(!!res.hasMore); })
      .catch(console.error)
      .finally(() => setIsLoadingMessages(false));
    setNewMessageCount(prev => ({ ...prev, [selectedConv.id]: 0 }));
  }, [selectedConv?.id]);

  const handleLoadMoreMessages = async () => {
    if (!selectedConv || messages.length === 0 || isLoadingMore) return;
    setIsLoadingMore(true);
    const oldest = messages[0].createdAt;
    const container = messagesContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;
    try {
      const res = await businessApi.getConversationMessages(selectedConv.id, oldest);
      setMessages(prev => [...(res.data || []), ...prev]);
      setHasMoreMessages(!!res.hasMore);
      requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight - prevScrollHeight;
      });
    } catch {
      toast.error('Error al cargar más mensajes');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Ref para leer selectedConv sin agregarlo como dependencia del SSE
  const selectedConvRef = useRef(selectedConv);
  useEffect(() => { selectedConvRef.current = selectedConv; }, [selectedConv]);

  useEffect(() => {
    if (!activePlaceId) return;

    const controller = new AbortController();
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connectSSE = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/business/conversations/stream/${activePlaceId}?token=${encodeURIComponent(token)}`,
          { signal: controller.signal }
        );
        if (!response.ok || !response.body) {
          console.error('[Chat SSE] Error de conexión:', response.status);
          retryTimeout = setTimeout(connectSSE, 5000);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));
              setConversations(prev => {
                const exists = prev.some(c => c.id === data.conversationId);
                const updated = prev.map(c =>
                  c.id === data.conversationId
                    ? {
                        ...c,
                        lastMessage: data.messageBody,
                        lastMessageTime: new Date().toISOString(),
                        awaitingReply: data.messageType === 'INCOMING',
                      }
                    : c
                );
                // Si es conversación nueva, recargar lista completa
                if (!exists && activePlaceId) {
                  businessApi.getConversations(activePlaceId)
                    .then(res => setConversations(res.data || []));
                }
                return sortConversations(updated);
              });
              const current = selectedConvRef.current;
              if (current?.id === data.conversationId) {
                businessApi.getConversationMessages(current.id)
                  .then(res => { setMessages(res.data || []); setHasMoreMessages(!!res.hasMore); });
                if (document.hidden) playNotificationSound();
              } else {
                playNotificationSound();
                setNewMessageCount(prev => ({
                  ...prev,
                  [data.conversationId]: (prev[data.conversationId] || 0) + 1,
                }));
              }
            } catch { }
          }
        }
        // Stream cerrado normalmente — reconectar
        if (!controller.signal.aborted) retryTimeout = setTimeout(connectSSE, 2000);
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          console.error('[Chat SSE] Error en stream, reconectando en 5s');
          retryTimeout = setTimeout(connectSSE, 5000);
        }
      }
    };

    connectSSE();
    return () => { controller.abort(); clearTimeout(retryTimeout); };
  }, [activePlaceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const handleToggleMode = async () => {
    if (!selectedConv) return;
    const newMode = selectedConv.mode === 'bot' ? 'human' : 'bot';
    try {
      await businessApi.setConversationMode(selectedConv.id, newMode);
      const updated = { ...selectedConv, mode: newMode };
      setSelectedConv(updated);
      setConversations(prev => prev.map(c => c.id === updated.id ? updated : c));
      if (newMode === 'human') inputRef.current?.focus();
    } catch {
      toast.error('Error al cambiar el modo de conversación');
    }
  };

  const handleClaim = async () => {
    if (!selectedConv) return;
    try {
      const updated = await businessApi.claimConversation(selectedConv.id);
      setSelectedConv(updated);
      setConversations(prev => prev.map(c => c.id === updated.id ? updated : c));
      toast.success('Conversación reclamada');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo reclamar — puede que ya la haya tomado otro agente');
      if (activePlaceId) loadConversations(activePlaceId).then(setConversations);
    }
  };

  const handleClose = async () => {
    if (!selectedConv) return;
    try {
      const updated = await businessApi.closeConversation(selectedConv.id);
      setSelectedConv(updated);
      setConversations(prev => prev.map(c => c.id === updated.id ? updated : c));
      toast.success('Conversación cerrada');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo cerrar la conversación');
    }
  };

  const handleReassign = async (userId: string) => {
    if (!selectedConv || !userId) return;
    try {
      const updated = await businessApi.reassignConversation(selectedConv.id, userId);
      setSelectedConv(updated);
      setConversations(prev => prev.map(c => c.id === updated.id ? updated : c));
      toast.success('Conversación reasignada');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo reasignar — necesitás ser Supervisor o Admin');
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConv) return;
    setIsSending(true);
    try {
      await businessApi.sendManualMessage(selectedConv.id, replyText);
      const sentText = replyText;
      setReplyText('');
      const res = await businessApi.getConversationMessages(selectedConv.id);
      setMessages(res.data || []);
      setConversations(prev => sortConversations(prev.map(c =>
        c.id === selectedConv.id
          ? { ...c, lastMessage: sentText, lastMessageTime: new Date().toISOString(), awaitingReply: false }
          : c
      )));
    } catch {
      toast.error('Error al enviar el mensaje');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo después
    if (!file || !selectedConv) return;
    if (file.size > 16 * 1024 * 1024) {
      toast.error('El archivo supera los 16MB permitidos');
      return;
    }
    setIsSendingFile(true);
    try {
      const caption = replyText.trim() || undefined;
      await businessApi.sendManualFile(selectedConv.id, file, caption);
      setReplyText('');
      const res = await businessApi.getConversationMessages(selectedConv.id);
      setMessages(res.data || []);
      setConversations(prev => sortConversations(prev.map(c =>
        c.id === selectedConv.id
          ? { ...c, lastMessage: caption || 'Archivo adjunto', lastMessageTime: new Date().toISOString(), awaitingReply: false }
          : c
      )));
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar el archivo');
    } finally {
      setIsSendingFile(false);
    }
  };

  const handleSync = async () => {
    if (!activePlaceId || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await businessApi.syncPlazbotConversations(activePlaceId);
      toast.success(`Sincronizadas ${res.synced} conversaciones de PlazBot`);
      const data = await loadConversations(activePlaceId);
      if (!selectedConv && data.length > 0 && isDesktop()) setSelectedConv(data[0]);
    } catch {
      toast.error('Error al sincronizar con PlazBot');
    } finally {
      setIsSyncing(false);
    }
  };

  const list = (
    <ConversationList
      conversations={conversations}
      loading={isLoading}
      filter={filter}
      onFilter={setFilter}
      search={search}
      onSearch={setSearch}
      selectedId={selectedConv?.id ?? null}
      unreadById={newMessageCount}
      onSelect={setSelectedConv}
      syncing={isSyncing}
      onSync={handleSync}
    />
  );

  const detail = selectedConv ? (
    <ChatThread
      conversation={selectedConv}
      messages={messages}
      loadingMessages={isLoadingMessages}
      hasMore={hasMoreMessages}
      loadingMore={isLoadingMore}
      onLoadMore={handleLoadMoreMessages}
      teamMembers={teamMembers}
      onToggleMode={handleToggleMode}
      onClaim={handleClaim}
      onClose={handleClose}
      onReassign={handleReassign}
      replyText={replyText}
      onReplyText={setReplyText}
      sending={isSending}
      sendingFile={isSendingFile}
      onSend={handleSendReply}
      onFileSelected={handleFileSelected}
      messagesContainerRef={messagesContainerRef}
      messagesEndRef={messagesEndRef}
      inputRef={inputRef}
      fileInputRef={fileInputRef}
    />
  ) : null;

  return (
    <>
      <PageHeader
        title="Chats"
        subtitle={isLoading ? 'Tus conversaciones de WhatsApp' : `${conversations.length} ${conversations.length === 1 ? 'conversación' : 'conversaciones'}`}
        action={
          <Button variant="secondary" icon={RefreshCw} loading={isSyncing} onClick={handleSync}>
            {isSyncing ? 'Sincronizando...' : 'Sincronizar PlazBot'}
          </Button>
        }
      />
      {activePlaceId && <div className="mb-4"><BillingAlert placeId={activePlaceId} /></div>}
      <InboxLayout
        list={list}
        detail={detail}
        onCloseDetail={() => setSelectedConv(null)}
        emptyDetail={
          <div className="flex h-full items-center justify-center">
            <EmptyState icon={MessageSquare} title="Selecciona una conversación" description="Aquí verás los mensajes y podrás responder." />
          </div>
        }
      />
    </>
  );
}
