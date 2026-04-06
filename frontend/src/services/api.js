const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  constructor(message, code = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export async function apiRequest(path, options = {}) {
  const { token, body, headers, ...restOptions } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (response.status === 401) {
    const error = new ApiError(
      payload?.message || 'Session expired. Please log in again.',
      'UNAUTHORIZED'
    );
    throw error;
  }

  if (!response.ok) {
    throw new ApiError(payload?.message || 'Request failed.');
  }

  return payload;
}

// Auth API
export const authApi = {
  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
};

// Users API
export const usersApi = {
  getMe: (token) => apiRequest('/users/me', { token }),
  listUsers: (token) => apiRequest('/users', { token }),
};

// Restaurants API
export const restaurantsApi = {
  listRestaurants: (token) => apiRequest('/restaurants', { token }),
};

// Payments API
export const paymentsApi = {
  listPaymentMethods: (token) => apiRequest('/payments', { token }),
};

// Cart API
export const cartApi = {
  getCart: (token) => apiRequest('/cart', { token }),
  saveCart: (token, body) =>
    apiRequest('/cart', { method: 'PUT', token, body }),
};

// Orders API
export const ordersApi = {
  listOrders: (token) => apiRequest('/orders', { token }),
  checkout: (token, orderId, paymentMethodId) =>
    apiRequest(`/orders/${orderId}/checkout`, {
      method: 'POST',
      token,
      body: { paymentMethodId },
    }),
  updatePaymentMethod: (token, orderId, paymentMethodId) =>
    apiRequest(`/orders/${orderId}/payment-method`, {
      method: 'PATCH',
      token,
      body: { paymentMethodId },
    }),
  cancelOrder: (token, orderId) =>
    apiRequest(`/orders/${orderId}/cancel`, {
      method: 'POST',
      token,
    }),
};