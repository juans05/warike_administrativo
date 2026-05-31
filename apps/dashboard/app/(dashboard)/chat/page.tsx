'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function timeAgo(date: string) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function formatMsgDate(date: string) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function avatar(name: string) {
  return (name || '?')[0].toUpperCase();
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadConversations = (placeId: string) => {
    return businessApi.getConversations(placeId)
      .then(res => {
        setConversations(res.data || []);
        return res.data || [];
      });
  };

  useEffect(() => {
    if (!activePlaceId) { setIsLoading(false); return; }
    setIsLoading(true);
    loadConversations(activePlaceId)
      .then(data => { if (data.length > 0) setSelectedConv(data[0]); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [activePlaceId]);

  useEffect(() => {
    if (!selectedConv) return;
    setIsLoadingMessages(true);
    businessApi.getConversationMessages(selectedConv.id)
      .then(res => setMessages(res.data || []))
      .catch(console.error)
      .finally(() => setIsLoadingMessages(false));
    setNewMessageCount(prev => ({ ...prev, [selectedConv.id]: 0 }));
  }, [selectedConv?.id]);

  useEffect(() => {
    if (!activePlaceId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    const es = new EventSource(`${API_BASE_URL}/api/business/conversations/stream/${activePlaceId}?token=${token}`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setConversations(prev => prev.map(c =>
          c.id === data.conversationId ? { ...c, lastMessage: data.messageBody } : c
        ));
        if (selectedConv?.id === data.conversationId) {
          businessApi.getConversationMessages(selectedConv.id)
            .then(res => setMessages(res.data || []));
        } else {
          setNewMessageCount(prev => ({ ...prev, [data.conversationId]: (prev[data.conversationId] || 0) + 1 }));
        }
      } catch {}
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [activePlaceId, selectedConv?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConv) return;
    setIsSending(true);
    try {
      await businessApi.sendManualMessage(selectedConv.id, replyText);
      setReplyText('');
      const res = await businessApi.getConversationMessages(selectedConv.id);
      setMessages(res.data || []);
    } catch {
      toast.error('Error al enviar el mensaje');
    } finally {
      setIsSending(false);
    }
  };

  const handleSync = async () => {
    if (!activePlaceId || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await businessApi.syncPlazbotConversations(activePlaceId);
      toast.success(`Sincronizadas ${res.synced} conversaciones de PlazBot`);
      const data = await loadConversations(activePlaceId);
      if (!selectedConv && data.length > 0) setSelectedConv(data[0]);
    } catch {
      toast.error('Error al sincronizar con PlazBot');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-120px)] gap-0 bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
        <div className="w-80 border-r border-gray-100 flex flex-col">
          <div className="h-14 border-b border-gray-100 bg-gray-50" />
          {[1,2,3,4].map(i => <div key={i} className="h-20 border-b border-gray-50 bg-gray-50 m-3 rounded-xl" />)}
        </div>
        <div className="flex-1 bg-gray-50" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">WhatsApp Chat</h1>
          <p className="text-sm text-gray-500">{conversations.length} conversaciones</p>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isSyncing ? 'Sincronizando...' : 'Sincronizar PlazBot'}
        </button>
      </div>

      {/* Chat layout */}
      <div className="flex flex-1 bg-white rounded-2xl border border-gray-200 overflow-hidden min-h-0">

        {/* LEFT — Conversations sidebar */}
        <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Conversaciones</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-2">
                <svg className="w-10 h-10 text-gray-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                <p className="text-sm font-bold text-gray-400">Sin conversaciones</p>
                <button onClick={handleSync} className="text-xs text-[#F26122] font-bold hover:underline">
                  Sincronizar con PlazBot
                </button>
              </div>
            ) : (
              conversations.map(conv => {
                const isSelected = selectedConv?.id === conv.id;
                const unread = newMessageCount[conv.id] || 0;
                const name = conv.customerName || conv.customerPhone;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full text-left border-b border-gray-50 transition-all relative ${
                      isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="px-3 py-3 flex gap-3 items-start">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-sm font-black text-white flex-shrink-0">
                        {avatar(name)}
                        {unread > 0 && (
                          <span className="absolute top-2 left-8 bg-green-500 text-white text-[9px] font-black px-1 py-0.5 rounded-full min-w-[16px] text-center">
                            {unread}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-gray-800 truncate">{name}</p>
                          <p className="text-[10px] text-gray-400 flex-shrink-0 ml-1">{timeAgo(conv.lastMessageTime || conv.createdAt)}</p>
                        </div>
                        <p className="text-[11px] text-gray-400 mb-1">
                          {conv.mode === 'human' ? 'Agente humano' : 'Sin Agente Asignado'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{conv.lastMessage || '—'}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className="text-[10px]">🇵🇪</span>
                          <svg viewBox="0 0 24 24" className="w-3 h-3 text-green-500 fill-current flex-shrink-0">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          <span className="text-[10px] text-gray-400">Wuarikes</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* CENTER — Messages */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedConv ? (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white">
                <p className="font-bold text-gray-900">{selectedConv.customerName || selectedConv.customerPhone}</p>
                <div className="flex items-center gap-3">
                  {/* Bot/Human toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">
                      {selectedConv.mode === 'bot' ? 'Agente Apagado' : 'Agente Activo'}
                    </span>
                    <button
                      onClick={handleToggleMode}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        selectedConv.mode === 'human' ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                        selectedConv.mode === 'human' ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                  {/* Resolve button */}
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Solucionar
                  </button>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50/30">
                {isLoadingMessages ? (
                  <div className="text-center text-gray-400 text-sm py-8">Cargando mensajes...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-8">Sin mensajes aún</div>
                ) : (
                  messages.map((msg, i) => {
                    const isIncoming = msg.messageType === 'INCOMING';
                    const senderName = isIncoming
                      ? (selectedConv.customerName || selectedConv.customerPhone)
                      : (msg.isFromAi ? 'Bot IA' : 'Agente');
                    const showLabel = i === 0 ||
                      messages[i - 1].messageType !== msg.messageType ||
                      (new Date(msg.createdAt).getTime() - new Date(messages[i - 1].createdAt).getTime()) > 60000;

                    return (
                      <div key={msg.id} className={`flex flex-col ${isIncoming ? 'items-start' : 'items-end'}`}>
                        {showLabel && (
                          <p className="text-[10px] text-gray-400 mb-1 px-1">
                            {senderName} — {formatMsgDate(msg.createdAt)}
                          </p>
                        )}
                        <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isIncoming
                            ? 'bg-white text-gray-800 border border-gray-100 shadow-sm'
                            : 'bg-[#054640] text-white'
                        }`}>
                          {msg.messageBody}
                          {msg.isFromAi && (
                            <span className="ml-2 text-[10px] opacity-60">🤖</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-100 bg-white px-4 py-3">
                {selectedConv.mode === 'human' ? (
                  <div className="flex gap-3 items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                      placeholder="Escribe tu mensaje..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-300"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || isSending}
                      className="px-5 py-2.5 bg-green-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-green-600 transition-colors flex items-center gap-1.5"
                    >
                      {isSending ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                      Enviar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                    <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <p className="text-xs text-gray-400">El bot está respondiendo. Activa el agente humano para responder manualmente.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50/30">
              <div className="text-center space-y-2">
                <svg className="w-12 h-12 text-gray-200 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                <p className="text-sm font-bold text-gray-400">Selecciona una conversación</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
