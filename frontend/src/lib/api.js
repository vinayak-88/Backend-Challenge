const API_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  constructor() {
    this.baseURL = API_URL;
  }

  getToken() {
    return sessionStorage.getItem('token');
  }

  setToken(token) {
    sessionStorage.setItem('token', token);
  }

  clearToken() {
    sessionStorage.removeItem('token');
  }

  async getMe() {
    return this.request('/users/me');
  }

  async listUsers() {
    return this.request('/users');
  }

  async request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      const error = new Error('Unauthorized');
      error.unauthorized = true;
      throw error;
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error('Failed to parse response');
    }

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `Request failed: ${response.status}`;
      const error = new Error(errorMessage);
      error.response = response;
      error.data = data;
      throw error;
    }

    return data;
  }

  // Auth
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.accessToken);
    return data;
  }

  // Restaurants
  async getRestaurants() {
    return this.request('/restaurants');
  }

  // Payments
  async getPayments() {
    return this.request('/payments');
  }

  // Cart
  async getCart() {
    return this.request('/cart');
  }

  async saveCart(cartData) {
    return this.request('/cart', {
      method: 'PUT',
      body: JSON.stringify(cartData),
    });
  }

  // Orders
  async getOrders() {
    return this.request('/orders');
  }

  async checkoutOrder(orderId, paymentMethodId) {
    return this.request(`/orders/${orderId}/checkout`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethodId }),
    });
  }

  async updateOrderPaymentMethod(orderId, paymentMethodId) {
    return this.request(`/orders/${orderId}/payment-method`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentMethodId }),
    });
  }

  async cancelOrder(orderId) {
    return this.request(`/orders/${orderId}/cancel`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();