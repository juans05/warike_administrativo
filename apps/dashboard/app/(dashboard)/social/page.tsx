'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Instagram, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useRestaurant } from '../../../context/RestaurantContext';
import { Button, Card, EmptyState, PageHeader, Skeleton, Tabs } from '../../../components/ui';
import { socialApi, type SocialAccountInfo, type SocialRules } from '../../../components/social/api';
import { AccountsCard } from '../../../components/social/AccountsCard';
import { CommentsList } from '../../../components/social/CommentsList';
import { DirectMessages } from '../../../components/social/DirectMessages';
import { AiRulesPanel } from '../../../components/social/AiRulesPanel';
import { PlatformModal, DisconnectModal } from '../../../components/social/AccountModals';
import { useCustomerLabels } from '../../../hooks/useCustomerLabels';

type Tab = 'comments' | 'messages' | 'rules';

const TABS = [
  { key: 'comments', label: 'Comentarios' },
  { key: 'messages', label: 'Mensajes directos' },
  { key: 'rules', label: 'Reglas de la IA' },
];

export default function SocialPage() {
  const { activePlaceId } = useRestaurant();
  const { customers } = useCustomerLabels();
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

  // Direct Messages
  const [activeTab, setActiveTab] = useState<Tab>('comments');
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [activeConversation, setActiveConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Bot Rules
  const [rules, setRules] = useState<SocialRules>({
    isActive: true,
    dmBotEnabled: false,
    replyToQuestions: true,
    replyToCompliments: true,
    redirectComplaints: true,
    revealPrices: false,
    personality: 'friendly',
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

  const handleReply = async (commentId: string, text: string): Promise<boolean> => {
    if (!activePlaceId) return false;
    try {
      await socialApi.reply(activePlaceId, commentId, text);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, isReplied: true, manualReply: text } : c));
      return true;
    } catch {
      toast.error('No se pudo enviar la respuesta. Intenta de nuevo.');
      return false;
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
      toast.success('Reglas de IA guardadas');
    } catch {
      toast.error('No se pudieron guardar las reglas. Intenta de nuevo.');
    }
    setIsSavingRules(false);
  };

  const header = (
    <PageHeader
      title="Instagram IA"
      subtitle="Gestiona los comentarios y mensajes de Instagram y deja que la IA responda por ti."
      action={
        accounts.length > 0 ? (
          <Button icon={Plus} loading={isConnecting} onClick={() => setIsPickingPlatform(true)}>
            {isConnecting ? 'Conectando...' : 'Vincular cuenta'}
          </Button>
        ) : undefined
      }
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <div role="status" aria-label="Cargando" className="space-y-4">
          <Card><Skeleton className="w-1/3" /><Skeleton className="mt-4 h-12 w-2/3" /></Card>
          <Card><Skeleton className="w-1/2" /><Skeleton className="mt-3 w-3/4" /><Skeleton className="mt-3 w-2/3" /></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {header}

      {accounts.length === 0 ? (
        <Card padding="lg" className="mx-auto max-w-2xl">
          <EmptyState
            icon={Instagram}
            title="Conecta tu Instagram profesional"
            description={`Autoriza a Wuarike para leer y responder los comentarios de tus ${customers} las 24 horas. Puedes vincular varias cuentas si tu negocio tiene varias sedes o marcas.`}
            action={
              <div className="space-y-3">
                <Button loading={isConnecting} onClick={() => setIsPickingPlatform(true)}>
                  {isConnecting ? 'Conectando...' : 'Vincular primera cuenta'}
                </Button>
                <p className="text-sm text-text-muted">Requiere una cuenta de empresa vinculada a Facebook.</p>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          <AccountsCard
            accounts={accounts}
            activeAccountId={activeAccountFilter}
            onToggleFilter={(id) => setActiveAccountFilter(activeAccountFilter === id ? null : id)}
            onDisconnect={setAccountPendingDisconnect}
          />

          <Tabs aria-label="Instagram IA" tabs={TABS} value={activeTab} onChange={(key) => setActiveTab(key as Tab)} />

          {activeTab === 'comments' && (
            <CommentsList
              comments={comments}
              accounts={accounts}
              filterUsername={accounts.find(a => a.id === activeAccountFilter)?.username}
              onReply={handleReply}
            />
          )}

          {activeTab === 'messages' && (
            <DirectMessages
              conversations={conversations}
              loadingConversations={isLoadingConversations}
              active={activeConversation}
              onOpen={openConversation}
              onClose={() => setActiveConversation(null)}
              messages={messages}
              loadingMessages={isLoadingMessages}
              text={messageText}
              onTextChange={setMessageText}
              sending={isSendingMessage}
              onSend={handleSendMessage}
            />
          )}

          {activeTab === 'rules' && (
            <AiRulesPanel rules={rules} onChange={setRules} onSave={handleSaveRules} saving={isSavingRules} accountCount={accounts.length} />
          )}
        </>
      )}

      <PlatformModal open={isPickingPlatform} accounts={accounts} onClose={() => setIsPickingPlatform(false)} onPick={handleConnect} />
      <DisconnectModal account={accountPendingDisconnect} busy={isDisconnecting} onClose={() => setAccountPendingDisconnect(null)} onConfirm={handleDisconnect} />
    </div>
  );
}
