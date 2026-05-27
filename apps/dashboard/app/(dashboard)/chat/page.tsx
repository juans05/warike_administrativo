'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';
import { SkeletonHeader, SkeletonListItem, SkeletonTable } from '../../../components/SkeletonLoader';

const LOYALTY_COLORS: Record<string, string> = {
  BRONCE: 'bg-amber-100 text-amber-700',
  PLATA: 'bg-slate-100 text-slate-600',
  ORO: 'bg-yellow-100 text-yellow-700',
  VIP: 'bg-purple-100 text-purple-700',
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ChatPage() {
  const { activePlaceId } = useRestaurant();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activePlaceId) { setIsLoading(false); return; }
    setIsLoading(true);
    businessApi.getConversations(activePlaceId)
      .then(res => {
        setConversations(res.data || []);
        if (res.data?.length > 0) {
          setSelectedConv(res.data[0]);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [activePlaceId]);

  useEffect(() => {
    if (!selectedConv) return;
    setIsLoadingMessages(true);
    businessApi.getConversationMessages(selectedConv.id)
      .then(res => setMessages(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setIsLoadingMessages(false));
    // Clear new message count for this conversation
    setNewMessageCount(prev => ({ ...prev, [selectedConv.id]: 0 }));
  }, [selectedConv]);

  // SSE connection for real-time message notifications
  useEffect(() => {
    if (!activePlaceId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    const eventSource = new EventSource(
      `${API_BASE_URL}/api/business/conversations/stream/${activePlaceId}?token=${token}`
    );

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        // Update or add conversation to list
        setConversations(prev => {
          const existing = prev.find(c => c.id === data.conversationId);
          if (existing) {
            return prev.map(c =>
              c.id === data.conversationId
                ? { ...c, lastMessage: data.messageBody }
                : c
            );
          }
          return prev;
        });
        // If this is the selected conversation, reload messages
        if (selectedConv?.id === data.conversationId) {
          businessApi.getConversationMessages(selectedConv.id)
            .then(res => setMessages(res.data || []))
            .catch(err => console.error(err));
        } else {
          // Increment new message count
          setNewMessageCount(prev => ({
            ...prev,
            [data.conversationId]: (prev[data.conversationId] || 0) + 1
          }));
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    eventSource.onerror = () => {
      console.warn('SSE connection error');
      eventSource.close();
    };

    return () => eventSource.close();
  }, [activePlaceId, selectedConv?.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleToggleMode = async () => {
    if (!selectedConv) return;
    const newMode = selectedConv.mode === 'bot' ? 'human' : 'bot';
    try {
      await businessApi.setConversationMode(selectedConv.id, newMode);
      setSelectedConv({ ...selectedConv, mode: newMode });
    } catch (err) {
      console.error('Error toggling conversation mode:', err);
      alert('Error al cambiar el modo de conversación');
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConv) return;
    setIsSending(true);
    try {
      await businessApi.sendManualMessage(selectedConv.id, replyText);
      setReplyText('');
      // Reload messages
      const res = await businessApi.getConversationMessages(selectedConv.id);
      setMessages(res.data || []);
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Error al enviar el mensaje');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-10 pb-32">
        <SkeletonHeader />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[70vh]">
          <div className="lg:col-span-1 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonListItem key={i} />
            ))}
          </div>
          <div className="lg:col-span-2">
            <SkeletonTable />
          </div>
          <div className="lg:col-span-1">
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-20 animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="space-y-2">
        <h1 className="text-5xl font-black text-text tracking-tight font-warike">WhatsApp Chat</h1>
        <p className="text-text-muted font-bold text-lg">Bandeja de conversaciones en tiempo real — {conversations.length} chats activos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[70vh]">
        {/* Left: Conversations List */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-border overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border">
            <h2 className="font-black text-text">Conversaciones</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-2xl mb-2">💬</p>
                <p className="text-xs font-bold text-text-muted">Sin chats aún</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full p-4 border-b border-border text-left transition-all hover:bg-gray-50 relative ${
                    selectedConv?.id === conv.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-sm font-black text-primary flex-shrink-0 relative">
                      {(conv.customerName || conv.customerPhone)[0].toUpperCase()}
                      {newMessageCount[conv.id] > 0 && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">
                          {newMessageCount[conv.id]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-text text-sm truncate">{conv.customerName || `+${conv.customerPhone}`}</p>
                      <p className="text-xs text-text-muted truncate">{conv.lastMessage}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Center: Chat Messages */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-border flex flex-col">
          {selectedConv ? (
            <>
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="font-black text-text">{selectedConv.customerName || `+${selectedConv.customerPhone}`}</h2>
                  <p className="text-xs text-text-muted">+{selectedConv.customerPhone}</p>
                </div>
                <button
                  onClick={handleToggleMode}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    selectedConv.mode === 'bot'
                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {selectedConv.mode === 'bot' ? '🤖 Bot' : '👤 Operador'}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {isLoadingMessages ? (
                  <div className="text-center text-gray-400 text-sm">Cargando mensajes...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm">Sin mensajes</div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.messageType === 'INCOMING' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-3 rounded-2xl break-words ${
                          msg.messageType === 'INCOMING'
                            ? 'bg-gray-100 text-text'
                            : 'bg-primary text-white'
                        }`}
                      >
                        <p className="text-sm">{msg.messageBody}</p>
                        {msg.isFromAi && (
                          <p className="text-xs mt-1 opacity-70">🤖 IA</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {selectedConv?.mode === 'human' && (
                <div className="border-t border-border p-4 flex gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    placeholder="Escribe tu respuesta..."
                    className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || isSending}
                    className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-sm disabled:opacity-50 hover:scale-[1.02] transition-transform active:scale-95"
                  >
                    {isSending ? '⏳' : '📤'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <p className="text-4xl">💬</p>
                <p className="font-bold text-text-muted">Selecciona una conversación</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Customer Info (Desktop only) */}
        {selectedConv && (
          <div className="hidden lg:flex lg:col-span-1 bg-white rounded-[2.5rem] border border-border p-6 flex-col">
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-2xl font-black text-primary mx-auto mb-3">
                  {(selectedConv.customerName || selectedConv.customerPhone)[0].toUpperCase()}
                </div>
                <p className="font-black text-text">{selectedConv.customerName || 'Sin nombre'}</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Teléfono</p>
                  <p className="text-sm font-bold text-text">+{selectedConv.customerPhone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Miembro desde</p>
                  <p className="text-sm font-bold text-text">
                    {new Date(selectedConv.createdAt).toLocaleDateString('es-PE')}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Programa de lealtad</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-text">Nivel</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-[9px] font-black">👑 VIP</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-text">Sellos</span>
                    <span className="font-bold text-text">8/10</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-text">Visitas</span>
                    <span className="font-bold text-text">12</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
