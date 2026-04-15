const API_URL = import.meta.env.VITE_API_URL || '/graphql';

const OPERATIONS = {
  me: `
    query Me {
      me {
        id
        email
        name
        role
        country
        paymentMethods {
          id
          type
          last4
          isDefault
        }
      }
    }
  `,
  users: `
    query Users {
      users {
        id
        email
        name
        role
        country
        paymentMethods {
          id
          type
          last4
          isDefault
        }
      }
    }
  `,
  login: `
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        accessToken
        user {
          id
          email
          name
          role
          country
          paymentMethods {
            id
            type
            last4
            isDefault
          }
        }
      }
    }
  `,
  restaurants: `
    query Restaurants {
      restaurants {
        id
        name
        country
        menuItems {
          id
          name
          description
          price
        }
      }
    }
  `,
  payments: `
    query Payments {
      payments {
        id
        type
        last4
        isDefault
      }
    }
  `,
  cart: `
    query Cart {
      cart {
        id
        status
        total
        restaurantId
        paymentMethodId
        items {
          menuItemId
          quantity
          unitPrice
          menuItem {
            name
          }
        }
      }
    }
  `,
  saveCart: `
    mutation SaveCart($input: SaveCartInput!) {
      saveCart(input: $input) {
        id
        status
        total
        restaurantId
        paymentMethodId
        items {
          menuItemId
          quantity
          unitPrice
          menuItem {
            name
          }
        }
      }
    }
  `,
  orders: `
    query Orders {
      orders {
        id
        status
        total
        userId
        restaurantId
        paymentMethodId
        restaurant {
          id
          name
          country
        }
        paymentMethod {
          type
          last4
        }
        user {
          id
          name
        }
        items {
          id
          orderId
          menuItemId
          quantity
          unitPrice
          menuItem {
            id
            name
          }
        }
      }
    }
  `,
  checkoutOrder: `
    mutation CheckoutOrder($orderId: ID!, $paymentMethodId: ID!) {
      checkoutOrder(orderId: $orderId, paymentMethodId: $paymentMethodId) {
        id
        status
        total
        userId
        restaurantId
        paymentMethodId
        restaurant {
          id
          name
          country
        }
        paymentMethod {
          type
          last4
        }
        user {
          id
          name
        }
        items {
          id
          orderId
          menuItemId
          quantity
          unitPrice
          menuItem {
            id
            name
          }
        }
      }
    }
  `,
  updateOrderPaymentMethod: `
    mutation UpdateOrderPaymentMethod($orderId: ID!, $paymentMethodId: ID!) {
      updateOrderPaymentMethod(orderId: $orderId, paymentMethodId: $paymentMethodId) {
        id
        status
        total
        userId
        restaurantId
        paymentMethodId
        restaurant {
          id
          name
          country
        }
        paymentMethod {
          type
          last4
        }
        user {
          id
          name
        }
        items {
          id
          orderId
          menuItemId
          quantity
          unitPrice
          menuItem {
            id
            name
          }
        }
      }
    }
  `,
  cancelOrder: `
    mutation CancelOrder($orderId: ID!) {
      cancelOrder(orderId: $orderId) {
        id
        status
        total
        userId
        restaurantId
        paymentMethodId
        restaurant {
          id
          name
          country
        }
        paymentMethod {
          type
          last4
        }
        user {
          id
          name
        }
        items {
          id
          orderId
          menuItemId
          quantity
          unitPrice
          menuItem {
            id
            name
          }
        }
      }
    }
  `,
};

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
    const data = await this.request(OPERATIONS.me);
    return data.me;
  }

  async listUsers() {
    const data = await this.request(OPERATIONS.users);
    return data.users;
  }

  async request(query, { variables, withAuth = true, operationName } = {}) {
    const headers = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (withAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
        operationName,
      }),
    });

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error('Failed to parse response');
    }

    const firstError = data?.errors?.[0];
    const firstStatus = firstError?.extensions?.http?.status || response.status;
    const firstCode = firstError?.extensions?.code;

    if (firstStatus === 401 || firstCode === 'UNAUTHENTICATED') {
      this.clearToken();
      const error = new Error(firstError?.message || 'Unauthorized');
      error.unauthorized = true;
      error.response = response;
      error.data = data;
      throw error;
    }

    if (!response.ok || firstError) {
      const errorMessage = firstError?.message || `Request failed: ${response.status}`;
      const error = new Error(errorMessage);
      error.response = response;
      error.data = data;
      throw error;
    }

    return data.data;
  }

  // Auth
  async login(email, password) {
    const data = await this.request(OPERATIONS.login, {
      variables: { email, password },
      withAuth: false,
    });
    this.setToken(data.login.accessToken);
    return data.login;
  }

  // Restaurants
  async getRestaurants() {
    const data = await this.request(OPERATIONS.restaurants);
    return data.restaurants;
  }

  // Payments
  async getPayments() {
    const data = await this.request(OPERATIONS.payments);
    return data.payments;
  }

  // Cart
  async getCart() {
    const data = await this.request(OPERATIONS.cart);
    return data.cart;
  }

  async saveCart(cartData) {
    const data = await this.request(OPERATIONS.saveCart, {
      variables: {
        input: cartData,
      },
    });
    return data.saveCart;
  }

  // Orders
  async getOrders() {
    const data = await this.request(OPERATIONS.orders);
    return data.orders;
  }

  async checkoutOrder(orderId, paymentMethodId) {
    const data = await this.request(OPERATIONS.checkoutOrder, {
      variables: { orderId, paymentMethodId },
    });
    return data.checkoutOrder;
  }

  async updateOrderPaymentMethod(orderId, paymentMethodId) {
    const data = await this.request(OPERATIONS.updateOrderPaymentMethod, {
      variables: { orderId, paymentMethodId },
    });
    return data.updateOrderPaymentMethod;
  }

  async cancelOrder(orderId) {
    const data = await this.request(OPERATIONS.cancelOrder, {
      variables: { orderId },
    });
    return data.cancelOrder;
  }
}

export const api = new ApiClient();
