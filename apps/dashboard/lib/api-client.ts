// apps/dashboard/lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  [key: string]: unknown;
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
  videoUrl?: string;
  isVegetarian?: boolean;
  available?: boolean;
  displayOrder?: number;
}
export interface MenuItemUpdate extends Partial<MenuItemPayload> {}

export interface DevicePayload { name: string; type?: string; deviceType?: string; location?: string }
export interface DeviceUpdate extends Partial<DevicePayload> { isActive?: boolean; action?: string; [key: string]: unknown }

export interface DeviceRequestPayload { tapType: 'generico' | 'personalizado'; quantity: number }

export interface NewPlacePayload {
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
  segmentFilter?: { type: string; templateId?: string };
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
  role: 'admin' | 'business';
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
  source: 'whatsapp' | 'feedback' | 'import';
  tags: string[] | null;
  marketingConsent: boolean;
  createdAt: string;
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
    throw new Error(error.message || `Error ${response.status}`);
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
  claimPlace: (id: string) => fetchWithAuth(`/business/onboarding/claim/${id}`, { method: 'POST' }),
  importPlace: (googlePlaceId: string) => fetchWithAuth('/business/onboarding/import', {
    method: 'POST',
    body: JSON.stringify({ googlePlaceId }),
  }),
  createPlace: (data: { name: string; address?: string }) => fetchWithAuth('/business/onboarding/create', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Places & Profile
  getMyPlaces: () => fetchWithAuth('/business/my-places'),
  getSubscriptionTier: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/subscription-tier`),
  getProfile: (id: string) => fetchWithAuth(`/business/places/${id}/profile`),
  updateProfile: (id: string, data: ProfileUpdate) =>
    fetchWithAuth(`/business/places/${id}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

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

  // Complaints (quejas interceptadas por el filtro — rating <= 3)
  getComplaints: (id: string, page = 1) =>
    fetchWithAuth(`/business/places/${id}/complaints?page=${page}&type=complaint`),

  // Reviews (reseñas positivas — rating >= 4)
  getReviews: (id: string, page = 1) =>
    fetchWithAuth(`/business/places/${id}/complaints?page=${page}&type=review`),

  markComplaintResolved: (id: string, complaintId: string) =>
    fetchWithAuth(`/business/places/${id}/complaints/${complaintId}/resolve`, {
      method: 'PATCH',
    }),

  // Google Maps Integration (Places API — sync 5 últimas reseñas)
  syncGoogleReviews: (id: string) => fetchWithAuth(`/business/places/${id}/google-sync`, { method: 'POST' }),
  getPersistedGoogleReviews: (id: string) => fetchWithAuth(`/business/places/${id}/google-reviews`),
  findGooglePlaceId: (id: string) => fetchWithAuth(`/business/places/${id}/find-google-place-id`),

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
  getCategories: () => fetchPublic('/places/categories'),
  getPublicMenu: (id: string) => fetchPublic(`/places/${id}/menu`),
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
  loyaltyScan: (placeId: string, data: { phone: string; name?: string }) =>
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

  getOpportunities: (status?: string) => fetchWithAuth(`/admin/opportunities${status ? `?status=${status}` : ''}`),
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
  forgotPassword: (email: string) =>
    fetchPublic('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (email: string, code: string, password: string) =>
    fetchPublic('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, code, password }) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    fetchWithAuth('/users/me/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) }),
};

export const teamApi = {
  list: (placeId: string) => fetchWithAuth(`/business/places/${placeId}/team`),
  create: (placeId: string, data: { email: string; fullName: string; role: 'admin' | 'supervisor' | 'agente'; whatsappNumberIds?: string[] }) =>
    fetchWithAuth(`/business/places/${placeId}/team`, { method: 'POST', body: JSON.stringify(data) }),
  update: (placeId: string, memberId: string, data: { role?: string; whatsappNumberIds?: string[] }) =>
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

