// apps/dashboard/lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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

  // Complaints (quejas interceptadas por el filtro)
  getComplaints: (id: string, page = 1) =>
    fetchWithAuth(`/business/places/${id}/complaints?page=${page}`),
  
  markComplaintResolved: (id: string, complaintId: string) =>
    fetchWithAuth(`/business/places/${id}/complaints/${complaintId}/resolve`, {
      method: 'PATCH',
    }),

  // Google Maps Integration
  getGoogleReviews: (id: string) => fetchWithAuth(`/business/places/${id}/google-sync`, { method: 'POST' }),
  syncGoogleReviews: (id: string) => fetchWithAuth(`/business/places/${id}/google-sync`, { method: 'POST' }),
  getPersistedGoogleReviews: (id: string) => fetchWithAuth(`/business/places/${id}/google-reviews`),
};

// Public API (NO requiere JWT — para clientes que escanean el NFC)
export async function fetchPublic(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
  // Obtener perfil público del restaurante (para la pantalla de escaneo)
  getPlace: (id: string) => fetchPublic(`/places/${id}`),

  // Enviar reseña/queja pública (sin autenticación)
  submitFeedback: (data: {
    placeId: string;
    rating: number;
    comment?: string;
    customerName?: string;
    customerContact?: string;
  }) => fetchPublic('/public/feedback', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
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
  banUser: (id: string) => fetchWithAuth(`/admin/users/${id}/ban`, { method: 'PATCH' }),
  activateUser: (id: string) => fetchWithAuth(`/admin/users/${id}/activate`, { method: 'PATCH' }),

  getPlaces: (page = 1, search = '') => fetchWithAuth(`/admin/places?page=${page}&search=${search}`),
  updatePlace: (id: string, data: any) => fetchWithAuth(`/admin/places/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
};

