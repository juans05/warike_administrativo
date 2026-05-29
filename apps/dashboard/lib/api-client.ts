// apps/dashboard/lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error en la petición');
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
  updateSettings: (restaurantId: string, data: any) =>
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
  getProfile: (id: string) => fetchWithAuth(`/business/places/${id}/profile`),
  updateProfile: (id: string, data: any) =>
    fetchWithAuth(`/business/places/${id}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Menu Management
  getMenu: (id: string) => fetchWithAuth(`/business/places/${id}/menu`),

  createCategory: (id: string, data: any) =>
    fetchWithAuth(`/business/places/${id}/menu/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id: string, catId: string, data: any) =>
    fetchWithAuth(`/business/places/${id}/menu/categories/${catId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string, catId: string) =>
    fetchWithAuth(`/business/places/${id}/menu/categories/${catId}`, {
      method: 'DELETE',
    }),

  createMenuItem: (id: string, data: any) =>
    fetchWithAuth(`/business/places/${id}/menu/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMenuItem: (id: string, itemId: string, data: any) =>
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
  updateBotSettings: (id: string, data: any) =>
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
  createDevice: (placeId: string, data: any) =>
    fetchWithAuth(`/business/places/${placeId}/devices`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDevice: (placeId: string, deviceId: string, data: any) =>
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

  // WhatsApp Configuration
  getWhatsappNumbers: (placeId: string) =>
    fetchWithAuth(`/business/whatsapp-numbers/${placeId}`),
  createWhatsappNumber: (data: any) =>
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

  // Conversations & Messages
  getConversations: (placeId: string, page: number = 1) =>
    fetchWithAuth(`/business/conversations/${placeId}?page=${page}&limit=20`),
  getConversationMessages: (conversationId: string) =>
    fetchWithAuth(`/business/conversations/${conversationId}/messages?limit=100`),
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

  // Broadcasts (WhatsApp)
  getBroadcasts: (placeId: string) =>
    fetchWithAuth(`/business/broadcasts/place/${placeId}`),
  createBroadcast: (data: any) =>
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
  createEmailCampaign: (data: any) =>
    fetchWithAuth('/business/email-campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  sendEmailCampaign: (campaignId: string) =>
    fetchWithAuth(`/business/email-campaigns/${campaignId}/send`, {
      method: 'POST',
    }),
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
  getPlace: (id: string) => fetchPublic(`/places/${id}`),

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
  getPlan: () => fetchWithAuth('/subscriptions/plan'),
  getMy: () => fetchWithAuth('/subscriptions/my'),
  getMyPayments: () => fetchWithAuth('/subscriptions/my/payments'),
  subscribe: (token: string) => fetchWithAuth('/subscriptions/subscribe', {
    method: 'POST',
    body: JSON.stringify({ token }),
  }),
  cancel: () => fetchWithAuth('/subscriptions/my', { method: 'DELETE' }),
  adminGetAll: (page = 1) => fetchWithAuth(`/subscriptions/admin/all?page=${page}`),
  adminGetStats: () => fetchWithAuth('/subscriptions/admin/stats'),
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

  getUsers: (page = 1, search = '') => fetchWithAuth(`/admin/users?page=${page}&search=${search}`),
  createUser: (data: any) => fetchWithAuth('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  banUser: (id: string) => fetchWithAuth(`/admin/users/${id}/ban`, { method: 'PATCH' }),
  activateUser: (id: string) => fetchWithAuth(`/admin/users/${id}/activate`, { method: 'PATCH' }),

  getPlaces: (page = 1, search = '') => fetchWithAuth(`/admin/places?page=${page}&search=${search}`),
  updatePlace: (id: string, data: any) => fetchWithAuth(`/admin/places/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
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
  connect: (data: {
    apiKey: string;
    workspaceId: string;
    agentId: string;
    placeId?: string;
    systemPrompt?: string;
    tone?: string;
  }) =>
    fetchWithAuth('/plazbot-setup/connect', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};


