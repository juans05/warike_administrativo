// apps/dashboard/lib/api-client.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ── Payload types ────────────────────────────────────────────────────────────

export interface ProfileUpdate {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  coverImageUrl?: string;
  menuImageUrl?: string;
  logoUrl?: string;
  showLogoOnQr?: boolean;
  categoryId?: string;
  districtId?: string | null;
  amenityIds?: string[];
  openHoursText?: string;
  latitude?: number;
  longitude?: number;
  priceMin?: number;
  countryCode?: string;
  spainCommunity?: string | null;
  spainProvince?: string | null;
  spainMunicipality?: string | null;
  businessType?: string;
  [key: string]: unknown;
}

/** `GET /places/business-types`: rubros (vertical) con sus tipos de negocio. */
export interface BusinessTypesResponse {
  verticals: { key: string; label: string; catalogLabel: string; types: { key: string; label: string }[] }[];
}

export interface BotSettingsUpdate {
  systemPrompt?: string;
  tone?: 'professional' | 'casual' | 'friendly';
  isActive?: boolean;
}

export type MenuCategoryType = 'food' | 'drink' | 'dessert' | 'other';

export interface MenuCategoryPayload { name: string; description?: string; displayOrder?: number; categoryType?: MenuCategoryType }
export interface MenuCategoryUpdate extends Partial<MenuCategoryPayload> {}

export interface MenuItemPayload {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  images?: string[];
  videoUrl?: string;
  isVegetarian?: boolean;
  available?: boolean;
  displayOrder?: number;
  /** Rubros de servicios: 'servicio' + duración en minutos (entero >= 0; null la quita). */
  kind?: 'producto' | 'servicio';
  durationMin?: number | null;
}
export interface MenuItemUpdate extends Partial<MenuItemPayload> {}

export interface DevicePayload { name: string; type?: string; deviceType?: string; location?: string }
export interface DeviceUpdate extends Partial<DevicePayload> { isActive?: boolean; action?: string; [key: string]: unknown }

export interface DeviceRequestPayload { tapType: 'generico' | 'personalizado'; quantity: number }

export interface NewPlacePayload {
  businessType?: string;
  name: string;
  categoryId: string;
  district: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

export interface AssignQrPayload {
  placeId?: string;
  newPlace?: NewPlacePayload;
  destinationType: 'REPUTATION' | 'MENU' | 'CUSTOM_URL';
  destinationUrl?: string;
  reason?: string;
}

export interface BroadcastPayload {
  placeId: string;
  whatsappNumberId: string;
  campaignName: string;
  templateBody: string;
  /** Plantilla aprobada de WhatsApp: obligatoria para escribir fuera de las 24 h. */
  templateName?: string;
  templateLanguage?: string;
  /** Valores de {{1}}, {{2}}…; admite {nombre}. */
  bodyVariables?: string[];
  segmentFilter?: { type: string; templateId?: string; levels?: string[]; days?: number };
  /** Lista de Excel (importación) a la que se envía. */
  csvImportId?: string;
  useCsvMerge?: boolean;
}

export interface EmailCampaignPayload {
  placeId: string;
  campaignName: string;
  subject: string;
  bodyHtml: string;
  scheduledAt?: string;
  audienceSources?: ('feedback' | 'contacts')[];
}

export interface AdminUserPayload {
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'business' | 'sales' | 'user';
}

export interface AdminPlaceUpdate {
  name?: string;
  isActive?: boolean;
  isVerified?: boolean;
  status?: string;
  [key: string]: unknown;
}

export interface WhatsappNumberPayload {
  placeId: string;
  phoneNumber: string;
}

export interface Contact {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  dni: string | null;
  source: 'whatsapp' | 'feedback' | 'import' | 'order' | 'loyalty';
  tags: string[] | null;
  marketingConsent: boolean;
  createdAt: string;
}

/** Tarjeta de fidelización de un cliente (tabla loyalty_cards). */
export interface LoyaltyCard {
  id: string;
  customerPhone: string;
  customerName: string | null;
  stamps: number;
  points: number;
  totalVisits: number;
  totalRedeemed: number;
  level: 'BRONCE' | 'PLATA' | 'ORO' | 'VIP';
  lastVisitAt: string | null;
  marketingConsent: boolean;
  createdAt: string;
}

export interface ContactTimelineEntry {
  at: string;
  kind: 'order' | 'conversation' | 'loyalty';
  title: string;
  /** Solo en pedidos, en céntimos. */
  amount?: number;
}

/** GET business/contacts/:id/profile — la línea de tiempo llega ordenada de la más reciente a la más antigua. */
export interface ContactProfile {
  contact: Contact;
  loyaltyCard: LoyaltyCard | null;
  timeline: ContactTimelineEntry[];
}

export interface ContactImport {
  id: string;
  filename: string;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  errorLog: { row: number; error: string }[] | null;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

/** GET business/places/:id/today — pendientes y números de la semana para Inicio. */
export interface TodaySummary {
  botChatsSince24h: number;
  pendingHumanChats: number;
  inactiveLoyalCustomers: number;
  winbackEnabled: boolean;
  winbacksSentThisWeek: number;
  newOrders: number;
  weekStats: { chats: number; returningCustomers: number; googleRating: number | null };
}

// ── Core fetch helper ────────────────────────────────────────────────────────

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const url = endpoint.startsWith('/api/') ? endpoint : `/api${endpoint}`;

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('activePlaceId');
      window.location.href = '/login?expired=1';
      throw new Error('Sesión expirada');
    }
    const text = await response.text().catch(() => '');
    let error: any = {};
    try { error = text ? JSON.parse(text) : {}; } catch { /* empty body */ }
    // `code` lets screens react to specific backend errors (e.g. Google token_expired).
    throw Object.assign(new Error(error.message || `Error ${response.status}`), { code: error.code });
  }

  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
}

export async function uploadContactsFile(placeId: string, file: File) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const fd = new FormData();
  fd.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/business/contacts/import?placeId=${placeId}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let error: any = {};
    try { error = text ? JSON.parse(text) : {}; } catch { /* empty body */ }
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

export async function sendConversationFile(conversationId: string, file: File, caption?: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const fd = new FormData();
  fd.append('file', file);
  if (caption) fd.append('caption', caption);

  const response = await fetch(`${API_BASE_URL}/api/business/conversations/${conversationId}/messages/file`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let error: any = {};
    try { error = text ? JSON.parse(text) : {}; } catch { /* empty body */ }
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

// Carta Methods
export const cartaApi = {
  getMenu: (restaurantId: string) => fetchWithAuth(`/carta/${restaurantId}`),
  updateItemAvailability: (itemId: string, available: boolean) =>
    fetchWithAuth(`/carta/item/${itemId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ available }),
    }),
};

// Bot Methods
export const botApi = {
  getSettings: (restaurantId: string) => fetchWithAuth(`/bot/${restaurantId}`),
  updateSettings: (restaurantId: string, data: BotSettingsUpdate) =>
    fetchWithAuth(`/bot/${restaurantId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Business Methods (Unified fachada for owners)
export const businessApi = {
  // Onboarding (registration)
  searchOnboarding: (q: string) => fetchWithAuth(`/business/onboarding/search?q=${encodeURIComponent(q)}`),
  getBusinessTypes: () => fetchPublic('/places/business-types') as Promise<BusinessTypesResponse>,
  claimPlace: (id: string, businessType: string) => fetchWithAuth(`/business/onboarding/claim/${id}`, {
    method: 'POST',
    body: JSON.stringify({ businessType }),
  }),
  importPlace: (googlePlaceId: string, businessType: string) => fetchWithAuth('/business/onboarding/import', {
    method: 'POST',
    body: JSON.stringify({ googlePlaceId, businessType }),
  }),
  createPlace: (data: { name: string; address?: string; businessType: string }) => fetchWithAuth('/business/onboarding/create', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Places & Profile
  getMyPlaces: () => fetchWithAuth('/business/my-places'),
  getSubscriptionTier: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/subscription-tier`),
  getToday: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/today`) as Promise<TodaySummary>,
  // Aparte de getToday: consulta a Google (con caché), puede tardar.
  getTodayReviews: (placeId: string) =>
    fetchWithAuth(`/business/places/${placeId}/today/reviews`) as Promise<{ connected: boolean; unanswered: number }>,
  getProfile: (id: string) => fetchWithAuth(`/business/places/${id}/profile`),
  updateProfile: (id: string, data: ProfileUpdate) =>
    fetchWithAuth(`/business/places/${id}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Alertas de reseñas bajas y respuesta automática a las de 4 y 5 estrellas
  getReviewAuto: (id: string) => fetchWithAuth(`/business/places/${id}/review-auto`),
  setReviewAuto: (id: string, settings: { alerts: boolean }) =>
    fetchWithAuth(`/business/places/${id}/review-auto`, { method: 'PATCH', body: JSON.stringify(settings) }),

  // Opiniones y escaneos por dispositivo (ranking del equipo)
  getDeviceRanking: (placeId: string, days = 30) =>
    fetchWithAuth(`/business/places/${placeId}/devices/ranking?days=${days}`),

  // Promoción que se ofrece a cambio del WhatsApp en la pantalla de calificación
  getScanPromo: (id: string) => fetchWithAuth(`/business/places/${id}/scan-promo`),
  setScanPromo: (id: string, promo: { enabled: boolean; text: string }) =>
    fetchWithAuth(`/business/places/${id}/scan-promo`, { method: 'PATCH', body: JSON.stringify(promo) }),

  // Diseño de la carta pública (colores y textos adicionales)
  getMenuTheme: (id: string) => fetchWithAuth(`/business/places/${id}/menu-theme`),
  setMenuTheme: (id: string, theme: unknown) =>
    fetchWithAuth(`/business/places/${id}/menu-theme`, { method: 'PATCH', body: JSON.stringify(theme) }),

  // Menu Management
  getMenu: (id: string) => fetchWithAuth(`/business/places/${id}/menu`),

  createCategory: (id: string, data: MenuCategoryPayload) =>
    fetchWithAuth(`/business/places/${id}/menu/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id: string, catId: string, data: MenuCategoryUpdate) =>
    fetchWithAuth(`/business/places/${id}/menu/categories/${catId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string, catId: string) =>
    fetchWithAuth(`/business/places/${id}/menu/categories/${catId}`, {
      method: 'DELETE',
    }),

  createMenuItem: (id: string, data: MenuItemPayload) =>
    fetchWithAuth(`/business/places/${id}/menu/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMenuItem: (id: string, itemId: string, data: MenuItemUpdate) =>
    fetchWithAuth(`/business/places/${id}/menu/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteMenuItem: (id: string, itemId: string) =>
    fetchWithAuth(`/business/places/${id}/menu/items/${itemId}`, {
      method: 'DELETE',
    }),

  // Importar carta: 1) lee foto/PDF con IA (vista previa, no guarda) 2) guarda en bloque lo revisado.
  parseMenuFile: (id: string, fileUrl: string) =>
    fetchWithAuth(`/business/places/${id}/menu/import/ai`, {
      method: 'POST',
      body: JSON.stringify({ fileUrl }),
    }),
  importMenu: (id: string, categories: unknown[]) =>
    fetchWithAuth(`/business/places/${id}/menu/import`, {
      method: 'POST',
      body: JSON.stringify({ categories }),
    }),

  // Analytics & Feedback
  getAnalytics: (id: string, range: string = 'month') =>
    fetchWithAuth(`/business/places/${id}/analytics?range=${range}`),

  // Bot Management
  getBotSettings: (id: string) => fetchWithAuth(`/business/places/${id}/bot`),
  updateBotSettings: (id: string, data: BotSettingsUpdate) =>
    fetchWithAuth(`/business/places/${id}/bot`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Complaints (comentarios privados con rating <= 3)
  getComplaints: (id: string, page = 1) =>
    fetchWithAuth(`/business/places/${id}/complaints?page=${page}&type=complaint`),

  // Reviews (reseñas positivas — rating >= 4)
  getReviews: (id: string, page = 1) =>
    fetchWithAuth(`/business/places/${id}/complaints?page=${page}&type=review`),

  // Todas las opiniones del escaneo (reseñas + quejas), más recientes primero
  getFeedback: (id: string, page = 1) =>
    fetchWithAuth(`/business/places/${id}/complaints?page=${page}`),

  suggestFeedbackReply: (id: string, feedbackId: string) =>
    fetchWithAuth(`/business/places/${id}/feedback/${feedbackId}/suggest-reply`, { method: 'POST' }),

  // Guarda la respuesta; la envía por correo o devuelve whatsappUrl para que la mande el dueño
  replyFeedback: (id: string, feedbackId: string, reply: string) =>
    fetchWithAuth(`/business/places/${id}/feedback/${feedbackId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply }),
    }),

  markComplaintResolved: (id: string, complaintId: string) =>
    fetchWithAuth(`/business/places/${id}/complaints/${complaintId}/resolve`, {
      method: 'PATCH',
    }),

  // Google Maps Integration (Places API — sync 5 últimas reseñas)
  syncGoogleReviews: (id: string) => fetchWithAuth(`/business/places/${id}/google-sync`, { method: 'POST' }),
  getPersistedGoogleReviews: (id: string) => fetchWithAuth(`/business/places/${id}/google-reviews`),

  // AI Bot Prompt Suggestion
  suggestBotPrompt: (id: string) => fetchWithAuth(`/business/places/${id}/suggest-bot-prompt`, { method: 'POST' }),

  // Google Business Profile OAuth (todas las reseñas)
  getGoogleAuthUrl: (placeId: string) => fetchWithAuth(`/business/google/auth-url?placeId=${placeId}`),
  getGoogleLocations: (id: string) => fetchWithAuth(`/business/places/${id}/google-locations`),
  setGoogleLocation: (id: string, locationName: string) =>
    fetchWithAuth(`/business/places/${id}/google-location`, {
      method: 'POST',
      body: JSON.stringify({ locationName }),
    }),
  getAllGoogleReviews: (id: string) => fetchWithAuth(`/business/places/${id}/all-google-reviews`),
  replyGoogleReview: (id: string, reviewName: string, comment: string) =>
    fetchWithAuth(`/business/places/${id}/google-reviews/reply`, {
      method: 'PUT',
      body: JSON.stringify({ reviewName, comment }),
    }),
  suggestGoogleReply: (id: string, review: { comment?: string; stars: number; reviewerName?: string }) =>
    fetchWithAuth(`/business/places/${id}/google-reviews/suggest-reply`, {
      method: 'POST',
      body: JSON.stringify(review),
    }),

  // Devices Management
  getDevices: (placeId: string) =>
    fetchWithAuth(`/business/places/${placeId}/devices`),
  createDevice: (placeId: string, data: DevicePayload) =>
    fetchWithAuth(`/business/places/${placeId}/devices`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDevice: (placeId: string, deviceId: string, data: DeviceUpdate) =>
    fetchWithAuth(`/business/places/${placeId}/devices/${deviceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteDevice: (placeId: string, deviceId: string) =>
    fetchWithAuth(`/business/places/${placeId}/devices/${deviceId}`, {
      method: 'DELETE',
    }),
  syncDevice: (placeId: string, deviceId: string) =>
    fetchWithAuth(`/business/places/${placeId}/devices/${deviceId}/sync`, {
      method: 'PATCH',
    }),

  // Device Requests (pedir nuevos taps genéricos/personalizados)
  getDeviceRequests: (placeId: string) =>
    fetchWithAuth(`/business/places/${placeId}/device-requests`),
  createDeviceRequest: (placeId: string, data: DeviceRequestPayload) =>
    fetchWithAuth(`/business/places/${placeId}/device-requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // WhatsApp Configuration
  getWhatsappNumbers: (placeId: string) =>
    fetchWithAuth(`/business/whatsapp-numbers/${placeId}`),
  createWhatsappNumber: (data: WhatsappNumberPayload) =>
    fetchWithAuth('/business/whatsapp-numbers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  // Conexión directa con Facebook (Embedded Signup): config para abrir el flujo y cierre con el código de Meta.
  getWhatsappConnectConfig: () =>
    fetchWithAuth('/business/whatsapp/connect/config') as Promise<{ configured: boolean; appId: string; configId: string; graphVersion: string }>,
  // Estado de cada paso del asistente "Conecta tu WhatsApp en 4 pasos".
  getWhatsappConnectStatus: (placeId: string) =>
    fetchWithAuth(`/business/whatsapp/connect/status?placeId=${placeId}`) as Promise<{
      metaEnabled: boolean;
      serverConfigured: boolean;
      number: { id: string; phoneNumber: string; isActive: boolean } | null;
      testReceived: boolean;
      botReplied: boolean;
      botConfigured: boolean;
      hasMenuOrKnowledge: boolean;
    }>,
  // Checkbox por local: activa/desactiva el canal de Facebook. Mientras esté apagado todo sigue por PlazBot.
  getWhatsappChannel: (placeId: string) =>
    fetchWithAuth(`/business/whatsapp/connect/channel?placeId=${placeId}`) as Promise<{ metaEnabled: boolean }>,
  setWhatsappChannel: (placeId: string, metaEnabled: boolean) =>
    fetchWithAuth('/business/whatsapp/connect/channel', {
      method: 'PATCH',
      body: JSON.stringify({ placeId, metaEnabled }),
    }) as Promise<{ metaEnabled: boolean }>,
  completeWhatsappConnect: (data: { placeId: string; code: string; wabaId: string; phoneNumberId: string }) =>
    fetchWithAuth('/business/whatsapp/connect/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    }) as Promise<{ id: string; phoneNumber: string; verifiedName: string | null }>,
  deleteWhatsappNumber: (numberId: string) =>
    fetchWithAuth(`/business/whatsapp-numbers/${numberId}`, {
      method: 'DELETE',
    }),

  // Knowledge Base / AI
  getKnowledgeBases: (placeId: string) =>
    fetchWithAuth(`/business/knowledge-bases/${placeId}`),
  uploadKnowledgeBase: (placeId: string, file: File, fileName: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', fileName);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return fetch(`${API_BASE_URL}/api/business/knowledge-bases/${placeId}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error('Error uploading knowledge base');
      return res.json();
    });
  },
  deleteKnowledgeBase: (kbId: string) =>
    fetchWithAuth(`/business/knowledge-bases/${kbId}`, {
      method: 'DELETE',
    }),
  indexKnowledgeBaseUrl: (placeId: string, url: string, fileName: string) =>
    fetchWithAuth(`/business/knowledge-bases/${placeId}/url`, {
      method: 'POST',
      body: JSON.stringify({ url, fileName }),
    }),

  // Conversations & Messages
  getConversations: (placeId: string, page: number = 1, opts?: { status?: string; filter?: 'mine' | 'unassigned' | 'all' }) => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (opts?.status) params.set('status', opts.status);
    if (opts?.filter) params.set('filter', opts.filter);
    return fetchWithAuth(`/business/conversations/${placeId}?${params.toString()}`);
  },
  claimConversation: (conversationId: string) =>
    fetchWithAuth(`/business/conversations/${conversationId}/claim`, { method: 'POST' }),
  releaseConversation: (conversationId: string) =>
    fetchWithAuth(`/business/conversations/${conversationId}/release`, { method: 'POST' }),
  reassignConversation: (conversationId: string, userId: string) =>
    fetchWithAuth(`/business/conversations/${conversationId}/reassign`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  closeConversation: (conversationId: string) =>
    fetchWithAuth(`/business/conversations/${conversationId}/close`, { method: 'POST' }),
  syncPlazbotConversations: (placeId: string) =>
    fetchWithAuth(`/business/conversations/sync-plazbot/${placeId}`, { method: 'POST' }),
  getConversationMessages: (conversationId: string, before?: string) =>
    fetchWithAuth(`/business/conversations/${conversationId}/messages?limit=50${before ? `&before=${encodeURIComponent(before)}` : ''}`),
  setConversationMode: (conversationId: string, mode: 'bot' | 'human') =>
    fetchWithAuth(`/business/conversations/${conversationId}/mode`, {
      method: 'PATCH',
      body: JSON.stringify({ mode }),
    }),
  sendManualMessage: (conversationId: string, text: string) =>
    fetchWithAuth(`/business/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  sendManualFile: (conversationId: string, file: File, caption?: string) =>
    sendConversationFile(conversationId, file, caption),

  // Plantillas de la cuenta de WhatsApp del local (API de Meta)
  getMetaTemplates: (placeId: string) =>
    fetchWithAuth(`/business/whatsapp/templates?placeId=${placeId}`) as Promise<{
      data: { id: string; name: string; language: string; category: string; status: string; body: string; variableCount: number }[];
    }>,
  createMetaTemplate: (data: { placeId: string; name: string; language: string; category: 'MARKETING' | 'UTILITY'; body: string; footer?: string; bodyExamples?: string[] }) =>
    fetchWithAuth('/business/whatsapp/templates', { method: 'POST', body: JSON.stringify(data) }),

  // Broadcasts (WhatsApp)
  getBroadcasts: (placeId: string) =>
    fetchWithAuth(`/business/broadcasts/place/${placeId}`),
  createBroadcast: (data: BroadcastPayload) =>
    fetchWithAuth('/business/broadcasts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  sendBroadcast: (broadcastId: string) =>
    fetchWithAuth(`/business/broadcasts/${broadcastId}/send`, {
      method: 'POST',
    }),

  // Email Campaigns
  getEmailCampaigns: (placeId: string) =>
    fetchWithAuth(`/business/email-campaigns/place/${placeId}`),
  getEmailAudienceCount: (placeId: string, sources?: ('feedback' | 'contacts')[]) =>
    fetchWithAuth(`/business/email-campaigns/place/${placeId}/audience-count${sources?.length ? `?sources=${sources.join(',')}` : ''}`),
  createEmailCampaign: (data: EmailCampaignPayload) =>
    fetchWithAuth('/business/email-campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateEmailCampaign: (campaignId: string, data: Partial<Pick<EmailCampaignPayload, 'campaignName' | 'subject' | 'bodyHtml' | 'audienceSources'>>) =>
    fetchWithAuth(`/business/email-campaigns/${campaignId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteEmailCampaign: (campaignId: string) =>
    fetchWithAuth(`/business/email-campaigns/${campaignId}`, {
      method: 'DELETE',
    }),
  sendEmailCampaign: (campaignId: string) =>
    fetchWithAuth(`/business/email-campaigns/${campaignId}/send`, {
      method: 'POST',
    }),
  completeEmailCampaign: (campaignId: string) =>
    fetchWithAuth(`/business/email-campaigns/${campaignId}/complete`, {
      method: 'PATCH',
    }),
  unscheduleEmailCampaign: (campaignId: string) =>
    fetchWithAuth(`/business/email-campaigns/${campaignId}/unschedule`, {
      method: 'POST',
    }),

  // Contactos (CRM de marketing)
  getContacts: (placeId: string, page = 1, search = '') =>
    fetchWithAuth(`/business/contacts?placeId=${placeId}&page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  getContactImports: (placeId: string) =>
    fetchWithAuth(`/business/contacts/imports/list?placeId=${placeId}`),
  getContactProfile: (placeId: string, contactId: string) =>
    fetchWithAuth(`/business/contacts/${contactId}/profile?placeId=${placeId}`) as Promise<ContactProfile>,
  uploadContacts: (placeId: string, file: File) => uploadContactsFile(placeId, file),
  syncContacts: (placeId: string) =>
    fetchWithAuth(`/business/contacts/sync?placeId=${placeId}`, { method: 'POST' }),
};

// Public API (NO requiere JWT — para clientes que escanean el NFC)
export async function fetchPublic(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('/api/') ? endpoint : `/api${endpoint}`;
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de red' }));
    throw new Error(error.message || 'Error en la petición');
  }

  return response.json();
}

export const publicApi = {
  getPlatformSettings: () => fetchPublic('/platform-settings'),
  getPlace: (id: string) => fetchPublic(`/places/${id}`),
  /** Carta pública (categorías con platos): la usa el mozo para tomar pedidos. */
  getPlaceMenu: (id: string) => fetchPublic(`/places/${id}/menu`),
  getScanPromo: (id: string) => fetchPublic(`/places/${id}/scan-promo`),
  /** Sin `vertical` el backend devuelve solo gastronomía; con `vertical` (o `all`) las del rubro pedido. */
  getCategories: (vertical?: string) => fetchPublic(`/places/categories${vertical ? `?vertical=${encodeURIComponent(vertical)}` : ''}`),
  getPublicMenu: (id: string) => fetchPublic(`/places/${id}/menu`),
  recommendDish: (id: string, message: string, history: { role: 'user' | 'assistant'; content: string }[]) =>
    fetchPublic(`/places/${id}/menu/recommend`, { method: 'POST', body: JSON.stringify({ message, history }) }),
  recordScan: (data: { placeId: string; deviceId?: string; source?: 'nfc' | 'qr' | 'direct' }) =>
    fetchPublic('/public/scan', { method: 'POST', body: JSON.stringify(data) }),
  getDevice: (deviceId: string) => fetchPublic(`/public/device/${deviceId}`),
  resolveQr: (token: string) => fetchPublic(`/qr/${token}/resolve`),

  submitFeedback: (data: {
    placeId: string;
    rating: number;
    comment?: string;
    customerName?: string;
    customerContact?: string;
    deviceId?: string;
    marketingConsent?: boolean;
  }) => fetchPublic('/public/feedback', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Libro de Reclamaciones — público, sin JWT
  submitComplaint: (data: {
    type: 'reclamo' | 'queja';
    consumerFullName: string;
    consumerDocumentType: 'DNI' | 'CE' | 'Pasaporte' | 'RUC';
    consumerDocumentNumber: string;
    consumerAddress: string;
    consumerEmail: string;
    consumerPhone?: string;
    contractedGood: string;
    claimedAmount?: number;
    detail: string;
    consumerRequest: string;
  }) => fetchPublic('/complaint-book', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Loyalty (fidelización) — público, sin JWT
  getLoyaltyProgram: (placeId: string) => fetchPublic(`/public/loyalty/${placeId}/program`),
  loyaltyScan: (placeId: string, data: { phone: string; name?: string; marketingConsent?: boolean }) =>
    fetchPublic(`/public/loyalty/${placeId}/scan`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getLoyaltyCard: (placeId: string, phone: string) =>
    fetchPublic(`/public/loyalty/${placeId}/card/${phone}`),
  getLoyaltyHistory: (cardId: string) =>
    fetchPublic(`/public/loyalty/card/${cardId}/history`),
};

export const subscriptionApi = {
  getPlans: () => fetchWithAuth('/subscriptions/plans'),
  adminGetAll: (page = 1) => fetchWithAuth(`/subscriptions/admin/all?page=${page}`),
  adminGetStats: () => fetchWithAuth('/subscriptions/admin/stats'),
};

export const hardwareApi = {
  getProducts: () => fetchWithAuth('/subscriptions/hardware'),
  checkout: (order: { token: string; productId: string; quantity: number; fullName: string; phone: string; address: string; district: string }) =>
    fetchWithAuth('/subscriptions/hardware/checkout', { method: 'POST', body: JSON.stringify(order) }),
};

// La suscripción es de la sede, no de la cuenta que llama — solo un Admin de
// esa sede la gestiona.
export const placeSubscriptionApi = {
  get: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/subscription`),
  getPayments: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/subscription/payments`),
  subscribe: (placeId: string, token: string, tier: string) =>
    fetchWithAuth(`/business/places/${placeId}/subscription/subscribe`, {
      method: 'POST',
      body: JSON.stringify({ token, tier }),
    }),
  cancel: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/subscription`, { method: 'DELETE' }),
};

export const adminApi = {
  getStats: () => fetchWithAuth('/admin/stats'),
  getPendingSubmissions: () => fetchWithAuth('/admin/submissions'),
  approveSubmission: (id: string) => fetchWithAuth(`/admin/submissions/${id}/approve`, { method: 'POST' }),
  rejectSubmission: (id: string, reason: string) => fetchWithAuth(`/admin/submissions/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  }),

  getPendingClaims: () => fetchWithAuth('/admin/claims'),
  verifyClaim: (id: string) => fetchWithAuth(`/admin/claims/${id}/verify`, { method: 'POST' }),
  rejectClaim: (id: string) => fetchWithAuth(`/admin/claims/${id}/reject`, { method: 'POST' }),

  getComplaints: () => fetchWithAuth('/admin/complaints'),
  resolveComplaint: (id: string, response: string) => fetchWithAuth(`/admin/complaints/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ response }),
  }),

  getPlatformSettings: () => fetchWithAuth('/platform-settings'),
  updatePlatformSettings: (data: {
    contactEmail?: string;
    contactPhone?: string;
    contactAddress?: string;
    socialInstagram?: string;
    socialFacebook?: string;
    socialTiktok?: string;
    socialX?: string;
  }) => fetchWithAuth('/platform-settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  getUsers: (page = 1, search = '') => fetchWithAuth(`/admin/users?page=${page}&search=${encodeURIComponent(search)}`),
  createUser: (data: AdminUserPayload) => fetchWithAuth('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  banUser: (id: string) => fetchWithAuth(`/admin/users/${id}/ban`, { method: 'PATCH' }),
  activateUser: (id: string) => fetchWithAuth(`/admin/users/${id}/activate`, { method: 'PATCH' }),
  sendAccessEmail: (id: string) => fetchWithAuth(`/admin/users/${id}/send-access-email`, { method: 'POST' }),

  getOpportunities: (status?: string) => fetchWithAuth(`/admin/opportunities${status ? `?status=${status}` : ''}`),
  listSalesUsers: () => fetchWithAuth('/admin/sales-users'),
  assignSalesUser: (placeId: string, salesUserId: string | null) =>
    fetchWithAuth(`/admin/places/${placeId}/sales-user`, { method: 'PATCH', body: JSON.stringify({ salesUserId }) }),
  updateOpportunityStatus: (placeId: string, status: string) => fetchWithAuth(`/admin/opportunities/${placeId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  getWuarikesHereRequests: (status?: string) => fetchWithAuth(`/admin/wuarikes-here-requests${status ? `?status=${status}` : ''}`),
  updateWuarikesHereRequestStatus: (id: string, status: string) => fetchWithAuth(`/admin/wuarikes-here-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  getPlaces: (page = 1, search = '') => fetchWithAuth(`/admin/places?page=${page}&search=${encodeURIComponent(search)}`),
  updatePlace: (id: string, data: AdminPlaceUpdate) => fetchWithAuth(`/admin/places/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  /** Fija el tipo de negocio de un local; si cambia de rubro, el backend le quita la categoría de otro rubro. */
  setPlaceBusinessType: (id: string, businessType: string) => fetchWithAuth(`/admin/places/${id}/business-type`, {
    method: 'PATCH',
    body: JSON.stringify({ businessType }),
  }) as Promise<{ message: string; businessType: string }>,

  getDeviceRequests: () => fetchWithAuth('/admin/device-requests'),
  updateDeviceRequestStatus: (id: string, status: 'pending' | 'fulfilled' | 'rejected') =>
    fetchWithAuth(`/admin/device-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // WhatsApp bot — configuración por local (superAdmin gestiona la de cualquier local)
  getWhatsappNumbers: (placeId: string) =>
    fetchWithAuth(`/admin/whatsapp-numbers/${placeId}`),
  createWhatsappNumber: (data: WhatsappNumberPayload) =>
    fetchWithAuth('/admin/whatsapp-numbers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  // Conecta directo con Meta un número que ya existe en la API (con token de usuario del sistema).
  connectExistingWhatsappNumber: (data: { placeId: string; phoneNumberId: string; wabaId: string; token: string }) =>
    fetchWithAuth('/admin/whatsapp-numbers/connect-existing', {
      method: 'POST',
      body: JSON.stringify(data),
    }) as Promise<{ id: string; phoneNumber: string; verifiedName: string | null }>,
  // Qué proveedor entrega los mensajes del número: API de WhatsApp Cloud (Meta) o PlazBot (legado).
  setWhatsappProvider: (numberId: string, provider: 'meta' | 'plazbot') =>
    fetchWithAuth(`/admin/whatsapp-numbers/${numberId}/provider`, {
      method: 'PATCH',
      body: JSON.stringify({ provider }),
    }),
  // Mensaje de prueba por la API de Meta (también sirve para el video de revisión de la app).
  sendWhatsappTestMessage: (data: { to: string; text: string; whatsappNumberId?: string }) =>
    fetchWithAuth('/admin/whatsapp-numbers/test-message', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteWhatsappNumber: (numberId: string) =>
    fetchWithAuth(`/admin/whatsapp-numbers/${numberId}`, {
      method: 'DELETE',
    }),
};

// Banco de QR (SuperAdmin) — generar, asignar/reasignar, historial
export const qrApi = {
  getStats: () => fetchWithAuth('/admin/qr-codes/stats'),
  list: (status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    const qs = params.toString();
    return fetchWithAuth(`/admin/qr-codes${qs ? `?${qs}` : ''}`);
  },
  getOne: (id: string) => fetchWithAuth(`/admin/qr-codes/${id}`),
  generateBatch: (count: number, physicalType?: 'QR' | 'NFC' | 'TABLET') =>
    fetchWithAuth('/admin/qr-codes/batch', {
      method: 'POST',
      body: JSON.stringify({ count, physicalType }),
    }),
  assign: (id: string, data: AssignQrPayload) =>
    fetchWithAuth(`/admin/qr-codes/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  reassign: (id: string, data: AssignQrPayload) =>
    fetchWithAuth(`/admin/qr-codes/${id}/reassign`, { method: 'POST', body: JSON.stringify(data) }),
  unassign: (id: string, reason?: string) =>
    fetchWithAuth(`/admin/qr-codes/${id}/unassign`, { method: 'POST', body: JSON.stringify({ reason }) }),
  suspend: (id: string) => fetchWithAuth(`/admin/qr-codes/${id}/suspend`, { method: 'PATCH' }),
  disable: (id: string) => fetchWithAuth(`/admin/qr-codes/${id}/disable`, { method: 'PATCH' }),
  activate: (id: string) => fetchWithAuth(`/admin/qr-codes/${id}/activate`, { method: 'PATCH' }),
};

// Ubigeo API (Departamentos, Provincias, Distritos)
export const ubigeoApi = {
  getDepartments: () => fetchPublic('/ubigeo/departments'),
  getProvinces: (department: string) => fetchPublic(`/ubigeo/provinces?department=${department}`),
  getDistricts: (department: string, province: string) => fetchPublic(`/ubigeo/districts?department=${department}&province=${province}`),
};

// Meta Ads API Integration
export const metaAdsApi = {
  getStatus: (placeId: string) => fetchWithAuth(`/business/meta-ads/place/${placeId}/status`),
  connect: (placeId: string, data: { accessToken: string; adAccountId: string }) =>
    fetchWithAuth(`/business/meta-ads/place/${placeId}/connect`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  disconnect: (placeId: string) =>
    fetchWithAuth(`/business/meta-ads/place/${placeId}/disconnect`, {
      method: 'POST',
    }),
  getAdAccounts: (accessToken: string) =>
    fetchWithAuth('/business/meta-ads/accounts', {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
    }),
  syncAudience: (placeId: string) =>
    fetchWithAuth(`/business/meta-ads/place/${placeId}/sync`, {
      method: 'POST',
    }),
};

// PlazBot API Integration
export const plazbotApi = {
  getStatus: () => fetchWithAuth('/plazbot-setup/status'),

  getConfig: (placeId: string) => fetchWithAuth(`/plazbot-setup/config?placeId=${placeId}`),
  configure: (data: {
    placeId: string;
    botName?: string;
    restaurantName?: string;
    systemPrompt?: string;
    tone?: string;
    responseMode?: 'ai' | 'menu';
  }) =>
    fetchWithAuth('/plazbot-setup/configure', { method: 'POST', body: JSON.stringify(data) }),

  getMenuOptions: (placeId: string) => fetchWithAuth(`/plazbot-setup/menu-options?placeId=${placeId}`),
  saveMenuOptions: (data: {
    placeId: string;
    options: { label: string; actionType: 'file' | 'text' | 'human'; actionValue?: string }[];
  }) =>
    fetchWithAuth('/plazbot-setup/menu-options', { method: 'POST', body: JSON.stringify(data) }),

  demoChat: (data: { placeId: string; message: string; history?: { role: 'user' | 'assistant'; content: string }[] }) =>
    fetchWithAuth('/plazbot-setup/demo-chat', { method: 'POST', body: JSON.stringify(data) }),

  getMetrics: () => fetchWithAuth('/plazbot-setup/metrics'),

  // Templates guardados en DB con estado (PENDING/SUBMITTED/APPROVED/REJECTED/FAILED)
  getTemplates: () => fetchWithAuth('/plazbot-setup/templates'),
  createTemplate: (data: any) =>
    fetchWithAuth('/plazbot-setup/template', { method: 'POST', body: JSON.stringify(data) }),
  resendTemplate: (id: string) =>
    fetchWithAuth(`/plazbot-setup/templates/${id}/resend`, { method: 'POST' }),
  syncTemplates: () =>
    fetchWithAuth('/plazbot-setup/templates/sync', { method: 'POST' }),

  deleteTemplate: (id: string) =>
    fetchWithAuth(`/plazbot-setup/templates/${id}`, { method: 'DELETE' }),
  toggleTemplate: (id: string) =>
    fetchWithAuth(`/plazbot-setup/templates/${id}/toggle`, { method: 'POST' }),
  updateTemplate: (id: string, data: any) =>
    fetchWithAuth(`/plazbot-setup/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  createCampaign: (data: { name: string; templateId: string; contacts: string[] }) =>
    fetchWithAuth('/plazbot-setup/campaign', { method: 'POST', body: JSON.stringify(data) }),
  sendTemplate: (data: { template: string; destination: string; variablesBody?: { variable: string; value: string }[] }) =>
    fetchWithAuth('/plazbot-setup/send-template', { method: 'POST', body: JSON.stringify(data) }),
};

export const authApi = {
  verifyEmail: (email: string, code: string) =>
    fetchPublic('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, code }) }),
  forgotPassword: (email: string) =>
    fetchPublic('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (email: string, code: string, password: string) =>
    fetchPublic('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, code, password }) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    fetchWithAuth('/users/me/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) }),
};

export interface TeamProfile { id: string; name: string; baseRole: 'cocina' | 'mozo' | 'agente' | 'supervisor'; modules: string[] }
type TeamProfileInput = Omit<TeamProfile, 'id'>;
export const teamApi = {
  list: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/team`),
  create: (placeId: string, data: { email: string; fullName: string; role: 'admin' | 'supervisor' | 'agente' | 'mozo' | 'cocina'; profileId?: string | null; whatsappNumberIds?: string[] }) =>
    fetchWithAuth(`/business/places/${placeId}/team`, { method: 'POST', body: JSON.stringify(data) }),
  profiles: (placeId: string): Promise<TeamProfile[]> => fetchWithAuth(`/business/places/${placeId}/team/profiles`),
  createProfile: (placeId: string, data: TeamProfileInput) =>
    fetchWithAuth(`/business/places/${placeId}/team/profiles`, { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (placeId: string, id: string, data: TeamProfileInput) =>
    fetchWithAuth(`/business/places/${placeId}/team/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProfile: (placeId: string, id: string) => fetchWithAuth(`/business/places/${placeId}/team/profiles/${id}`, { method: 'DELETE' }),
  update: (placeId: string, memberId: string, data: { role?: string; profileId?: string | null; whatsappNumberIds?: string[] }) =>
    fetchWithAuth(`/business/places/${placeId}/team/${memberId}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (placeId: string, memberId: string) =>
    fetchWithAuth(`/business/places/${placeId}/team/${memberId}`, { method: 'DELETE' }),
};

export const reportsApi = {
  get: (placeId: string, from: string, to: string, statuses?: string[], agentId?: string) => {
    const params = new URLSearchParams({ from, to });
    if (statuses?.length) params.set('statuses', statuses.join(','));
    if (agentId) params.set('agentId', agentId);
    return fetchWithAuth(`/business/reports/place/${placeId}?${params.toString()}`);
  },
};


// ── Comisiones (admin) ───────────────────────────────────────────────────────
export const adminCommissionsApi = {
  getSettings: () => fetchWithAuth('/admin/commissions/settings'),
  updateSettings: (patch: Partial<{ firstMonthRate: number; recurringRate: number; recurringMonths: number; clawbackDays: number }>) =>
    fetchWithAuth('/admin/commissions/settings', { method: 'PATCH', body: JSON.stringify(patch) }),
  generate: (period: string) => fetchWithAuth('/admin/commissions/payouts', { method: 'POST', body: JSON.stringify({ period }) }),
  listPayouts: (period?: string) => fetchWithAuth(`/admin/commissions/payouts${period ? `?period=${period}` : ''}`),
  payout: (id: string) => fetchWithAuth(`/admin/commissions/payouts/${id}`),
  pay: (id: string, note?: string) => fetchWithAuth(`/admin/commissions/payouts/${id}/pay`, { method: 'PATCH', body: JSON.stringify({ note }) }),
  cancel: (id: string) => fetchWithAuth(`/admin/commissions/payouts/${id}`, { method: 'DELETE' }),
  mine: (period?: string) => fetchWithAuth(`/admin/commissions/mine${period ? `?period=${period}` : ''}`),
  minePayout: (id: string) => fetchWithAuth(`/admin/commissions/mine/${id}`),
};

// ── Perfiles, permisos y equipo de Wuarikes ─────────────────────────────
export interface PlatformProfile { id: string; name: string; description: string | null; permissions: string[]; isSystem: boolean; usersCount: number }
export interface PlatformStaff { id: string; fullName: string; email: string; role: 'admin' | 'sales'; isBanned: boolean; isVerified: boolean; profileId: string | null; profileName: string; createdAt: string }
export interface SalesClient { id: string; name: string; address: string | null; commercialStatus: string | null; claimed: boolean; salesUserName: string | null; tier: string | null; subscriptionStatus: string | null; periodEnd: string | null }
type ProfileInput = { name: string; description?: string | null; permissions: string[] };
export const platformAccessApi = {
  catalog: (): Promise<{ key: string; group: string; label: string }[]> => fetchWithAuth('/admin/access/catalog'),
  profiles: (): Promise<PlatformProfile[]> => fetchWithAuth('/admin/access/profiles'),
  createProfile: (body: ProfileInput) => fetchWithAuth('/admin/access/profiles', { method: 'POST', body: JSON.stringify(body) }),
  updateProfile: (id: string, body: ProfileInput) => fetchWithAuth(`/admin/access/profiles/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProfile: (id: string) => fetchWithAuth(`/admin/access/profiles/${id}`, { method: 'DELETE' }),
  staff: (): Promise<PlatformStaff[]> => fetchWithAuth('/admin/access/staff'),
  createStaff: (body: { fullName: string; email: string; profileId: string }) => fetchWithAuth('/admin/access/staff', { method: 'POST', body: JSON.stringify(body) }),
  assignProfile: (id: string, profileId: string) => fetchWithAuth(`/admin/access/staff/${id}/profile`, { method: 'PATCH', body: JSON.stringify({ profileId }) }),
  myClients: (): Promise<SalesClient[]> => fetchWithAuth('/admin/my-clients'),
};

// ── Agenda de citas por profesional ─────────────────────────────────────
export type DayHours = { day: string; open: string; close: string };
export interface Professional {
  id: string; name: string; photoUrl: string | null; station: string | null; serviceIds: string[];
  schedule: DayHours[] | null; daysOff: string[]; active: boolean; displayOrder: number;
}
export interface BookingInput {
  serviceId: string; professionalId?: string | null; date: string; time: string; customerName: string; customerPhone?: string; notes?: string;
  /** Ficha existente del cliente, o una nueva por nombre/placa. */
  assetId?: string; assetName?: string; assetData?: Record<string, string>;
}
export interface CustomerAsset { id: string; kind: 'PET' | 'VEHICLE'; name: string; data: Record<string, string | null>; notes: string | null; customerPhone: string; customerName: string | null }
const agendaBase = (placeId: string) => `/business/places/${placeId}/agenda`;
export const agendaApi = {
  day: (placeId: string, date: string) => fetchWithAuth(`${agendaBase(placeId)}/day?date=${date}`),
  services: (placeId: string) => fetchWithAuth(`${agendaBase(placeId)}/services`),
  availability: (placeId: string, serviceId: string, date: string, professionalId?: string | null) =>
    fetchWithAuth(`${agendaBase(placeId)}/availability?serviceId=${serviceId}&date=${date}${professionalId ? `&professionalId=${professionalId}` : ''}`),
  book: (placeId: string, body: BookingInput) => fetchWithAuth(`${agendaBase(placeId)}/appointments`, { method: 'POST', body: JSON.stringify(body) }),
  update: (placeId: string, id: string, body: Record<string, unknown>) =>
    fetchWithAuth(`${agendaBase(placeId)}/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  reminders: (placeId: string) => fetchWithAuth(`${agendaBase(placeId)}/reminders`),
  createReminderTemplate: (placeId: string) => fetchWithAuth(`${agendaBase(placeId)}/reminders/template`, { method: 'POST' }),
  setReminders: (placeId: string, enabled: boolean) => fetchWithAuth(`${agendaBase(placeId)}/reminders`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
  professionals: (placeId: string) => fetchWithAuth(`${agendaBase(placeId)}/professionals`) as Promise<Professional[]>,
  assets: (placeId: string, phone: string): Promise<CustomerAsset[]> => fetchWithAuth(`${agendaBase(placeId)}/assets?phone=${encodeURIComponent(phone)}`),
  saveAsset: (placeId: string, id: string | null, body: { customerPhone: string; customerName?: string; name: string; data?: Record<string, string>; notes?: string | null }) =>
    fetchWithAuth(`${agendaBase(placeId)}/assets${id ? `/${id}` : ''}`, { method: id ? 'PATCH' : 'POST', body: JSON.stringify(body) }),
  saveProfessional: (placeId: string, id: string | null, body: Record<string, unknown>) =>
    fetchWithAuth(`${agendaBase(placeId)}/professionals${id ? `/${id}` : ''}`, { method: id ? 'PATCH' : 'POST', body: JSON.stringify(body) }),
};
export const publicAgendaApi = {
  info: (placeId: string) => fetchPublic(`/public/agenda/${placeId}`),
  availability: (placeId: string, serviceId: string, date: string, professionalId?: string | null) =>
    fetchPublic(`/public/agenda/${placeId}/availability?serviceId=${serviceId}&date=${date}${professionalId ? `&professionalId=${professionalId}` : ''}`),
  book: (placeId: string, body: BookingInput) => fetchPublic(`/public/agenda/${placeId}/book`, { method: 'POST', body: JSON.stringify(body) }),
  byToken: (token: string) => fetchPublic(`/public/agenda/cita/${token}`),
  cancel: (token: string) => fetchPublic(`/public/agenda/cita/${token}/cancel`, { method: 'POST' }),
};

// ── Inventario: insumos/productos, kardex, mermas, proveedores y recetas ─────
const invBase = (placeId: string) => `/business/places/${placeId}/inventory`;
export const MERMA_REASONS: Record<string, string> = {
  QUEMADO: 'Producto quemado / dañado', VENCIDO: 'Vencimiento / descomposición', DERRAME: 'Derrame / caída',
  DEVOLUCION: 'Devolución de cliente', ERROR_COMANDA: 'Error de comanda', CONTAMINACION: 'Contaminación cruzada', OTRO: 'Otro',
};
export const inventoryApi = {
  overview: (placeId: string) => fetchWithAuth(invBase(placeId)),
  saveItem: (placeId: string, id: string | null, body: Record<string, unknown>) =>
    fetchWithAuth(`${invBase(placeId)}/items${id ? `/${id}` : ''}`, { method: id ? 'PATCH' : 'POST', body: JSON.stringify(body) }),
  ingreso: (placeId: string, body: { itemId: string; quantity: number; unitCost?: number; reason?: string }) =>
    fetchWithAuth(`${invBase(placeId)}/ingresos`, { method: 'POST', body: JSON.stringify(body) }),
  ajuste: (placeId: string, body: { itemId: string; counted: number; reason?: string }) =>
    fetchWithAuth(`${invBase(placeId)}/ajustes`, { method: 'POST', body: JSON.stringify(body) }),
  merma: (placeId: string, body: { itemId?: string; dishId?: string; quantity: number; mermaReason: string; reason?: string }) =>
    fetchWithAuth(`${invBase(placeId)}/mermas`, { method: 'POST', body: JSON.stringify(body) }),
  kardex: (placeId: string, type?: string) => fetchWithAuth(`${invBase(placeId)}/kardex${type ? `?type=${type}` : ''}`),
  suppliers: (placeId: string) => fetchWithAuth(`${invBase(placeId)}/suppliers`),
  saveSupplier: (placeId: string, id: string | null, body: Record<string, unknown>) =>
    fetchWithAuth(`${invBase(placeId)}/suppliers${id ? `/${id}` : ''}`, { method: id ? 'PATCH' : 'POST', body: JSON.stringify(body) }),
  recipes: (placeId: string) => fetchWithAuth(`${invBase(placeId)}/recipes`),
  setRecipe: (placeId: string, dishId: string, lines: { itemId: string; quantity: number }[]) =>
    fetchWithAuth(`${invBase(placeId)}/recipes/${dishId}`, { method: 'PUT', body: JSON.stringify({ lines }) }),
};

export type ReceiptDocType = 'TICKET' | 'BOLETA' | 'FACTURA';
export type CashMethod = 'EFECTIVO' | 'TARJETA' | 'YAPE_PLIN';
/** Datos del comprobante: los pide el mozo con la precuenta y caja los confirma al cobrar. */
export interface ReceiptRequest {
  docType: ReceiptDocType;
  customerDocType?: string;
  customerDocNumber?: string;
  customerName?: string;
  customerAddress?: string;
}

export const ordersApi = {
  me: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/orders/me`),
  list: (placeId: string, params: { status?: string; channel?: string; q?: string; page?: number } = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]));
    return fetchWithAuth(`/business/places/${placeId}/orders?${qs}`);
  },
  kds: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/orders/kds`),
  changeStatus: (placeId: string, orderId: string, status: string, reason?: string) =>
    fetchWithAuth(`/business/places/${placeId}/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }),
  tablesBoard: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/orders/tables-board`),
  closeTab: (placeId: string, tabId: string) => fetchWithAuth(`/business/places/${placeId}/orders/tabs/${tabId}/close`, { method: 'POST' }),
  manualPayment: (placeId: string, body: { tabId?: string; orderId?: string; method: 'EFECTIVO' | 'POS' }) =>
    fetchWithAuth(`/business/places/${placeId}/orders/payments/manual`, { method: 'POST', body: JSON.stringify(body) }),
  // Mozo en sala: detalle de mesa, comanda del mozo (platos y otro ítem) y mozo asignado.
  waiters: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/orders/waiters`),
  tableDetail: (placeId: string, tableId: string) => fetchWithAuth(`/business/places/${placeId}/orders/tables/${tableId}/detail`),
  staffOrder: (placeId: string, tableId: string, body: { items?: { dishId: string; quantity: number }[]; customItems?: { name: string; unitPrice: number; quantity: number }[]; notes?: string }) =>
    fetchWithAuth(`/business/places/${placeId}/orders/tables/${tableId}/orders`, { method: 'POST', body: JSON.stringify(body) }),
  assignWaiter: (placeId: string, tabId: string, waiterUserId: string | null) =>
    fetchWithAuth(`/business/places/${placeId}/orders/tabs/${tabId}/waiter`, { method: 'PATCH', body: JSON.stringify({ waiterUserId }) }),
  // Caja: precuenta del mozo, apertura, cobro con comprobante y cierre de turno.
  precuenta: (placeId: string, tabId: string, body: ReceiptRequest) =>
    fetchWithAuth(`/business/places/${placeId}/orders/tabs/${tabId}/precuenta`, { method: 'POST', body: JSON.stringify(body) }),
  cash: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/orders/cash`),
  cashOpen: (placeId: string, openingAmount: number) =>
    fetchWithAuth(`/business/places/${placeId}/orders/cash/open`, { method: 'POST', body: JSON.stringify({ openingAmount }) }),
  cashCharge: (placeId: string, body: ReceiptRequest & { tabId: string; method: CashMethod }) =>
    fetchWithAuth(`/business/places/${placeId}/orders/cash/charge`, { method: 'POST', body: JSON.stringify(body) }),
  /** Venta directa (mostrador) o cobro de una cita (appointmentId agrega su servicio). */
  cashSale: (placeId: string, body: ReceiptRequest & { method: CashMethod; appointmentId?: string; items?: { dishId?: string; name?: string; unitPrice?: number; quantity: number }[] }) =>
    fetchWithAuth(`/business/places/${placeId}/orders/cash/sale`, { method: 'POST', body: JSON.stringify(body) }),
  cashClose: (placeId: string, countedCash?: number) =>
    fetchWithAuth(`/business/places/${placeId}/orders/cash/close`, { method: 'POST', body: JSON.stringify(countedCash == null ? {} : { countedCash }) }),
  getSettings: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/orders/settings`),
  updateSettings: (placeId: string, body: Record<string, unknown>) =>
    fetchWithAuth(`/business/places/${placeId}/orders/settings`, { method: 'PATCH', body: JSON.stringify(body) }),
  testCulqi: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/orders/settings/test-culqi`, { method: 'POST' }),
  tables: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/orders/tables`),
  createTable: (placeId: string, body: { name: string; capacity?: number }) =>
    fetchWithAuth(`/business/places/${placeId}/orders/tables`, { method: 'POST', body: JSON.stringify(body) }),
  updateTable: (placeId: string, tableId: string, body: Record<string, unknown>) =>
    fetchWithAuth(`/business/places/${placeId}/orders/tables/${tableId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  regenerateQr: (placeId: string, tableId: string) =>
    fetchWithAuth(`/business/places/${placeId}/orders/tables/${tableId}/regenerate-qr`, { method: 'POST' }),
  adminPayouts: (period?: string) => fetchWithAuth(`/admin/order-payouts${period ? `?period=${period}` : ''}`),
  adminGeneratePayouts: (period: string) => fetchWithAuth('/admin/order-payouts/generate', { method: 'POST', body: JSON.stringify({ period }) }),
  adminPayPayout: (id: string, reference: string) => fetchWithAuth(`/admin/order-payouts/${id}/pay`, { method: 'POST', body: JSON.stringify({ reference }) }),
  adminSetCommission: (placeId: string, wuarikesCommissionPct: number) =>
    fetchWithAuth(`/admin/order-payouts/commission/${placeId}`, { method: 'PATCH', body: JSON.stringify({ wuarikesCommissionPct }) }),
};

export const publicOrdersApi = {
  table: (qrToken: string) => fetchPublic(`/public/tables/${qrToken}`),
  verifyPin: (qrToken: string, pin: string) =>
    fetchPublic(`/public/tables/${qrToken}/verify-pin`, { method: 'POST', body: JSON.stringify({ pin }) }),
  createOrder: (body: { qrToken: string; pin: string; items: { dishId: string; quantity: number; note?: string }[]; customerName?: string; customerPhone?: string; notes?: string }) =>
    fetchPublic('/public/orders', { method: 'POST', body: JSON.stringify(body) }),
  order: (token: string) => fetchPublic(`/public/orders/${token}`),
  tab: (token: string) => fetchPublic(`/public/tabs/${token}`),
  requestBill: (token: string) => fetchPublic(`/public/tabs/${token}/request-bill`, { method: 'POST' }),
  paymentIntent: (body: { orderToken?: string; tabToken?: string; email: string; name?: string; phone?: string }) =>
    fetchPublic('/public/payments/intent', { method: 'POST', body: JSON.stringify(body) }),
  payWithToken: (paymentId: string, token: string) =>
    fetchPublic(`/public/payments/${paymentId}/token`, { method: 'POST', body: JSON.stringify({ token }) }),
  paymentStatus: (paymentId: string) => fetchPublic(`/public/payments/${paymentId}`),
};
