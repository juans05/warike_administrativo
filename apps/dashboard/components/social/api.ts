import { fetchWithAuth } from '../../lib/api-client';

// API helpers for social module
export const socialApi = {
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

export interface SocialAccountInfo {
  id: string;
  platform: string;
  username: string;
  connectedAt: string;
}

export interface SocialRules {
  isActive: boolean;
  dmBotEnabled: boolean;
  replyToQuestions: boolean;
  replyToCompliments: boolean;
  redirectComplaints: boolean;
  revealPrices: boolean;
  personality: 'friendly' | 'formal' | 'casual';
}
