import { useEffect, useMemo, useState } from 'react';
import { LoginPanel } from './components/LoginPanel';
import { apiRequest } from './lib/api';

function cartStateFromOrder(order) {
  if (!order) {
    return {};
  }

  return order.items.reduce((next, item) => {
    next[item.menuItemId] = item.quantity;
    return next;
  }, {});
}

function mergeOrdersWithCart(orders, cartOrder, currentUserId) {
  const remainingOrders = orders.filter(
    (order) => !(order.status === 'DRAFT' && order.user?.id === currentUserId),
  );

  if (!cartOrder) {
    return remainingOrders;
  }

  return [cartOrder, ...remainingOrders];
}

export default function AppView() {
  const [token, setToken] = useState(() => sessionStorage.getItem('token'));
  const [email, setEmail] = useState('nick@slooze.xyz');
  const [password, setPassword] = useState('Password123!');
  const [loginError, setLoginError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [appError, setAppError] = useState(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [cart, setCart] = useState({});
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(null);
  const [selectedOrderPaymentMethodIds, setSelectedOrderPaymentMethodIds] = useState({});

  const selectedRestaurant = useMemo(
    () => dashboard?.restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? null,
    [dashboard?.restaurants, selectedRestaurantId],
  );

  function handleApiError(error, target = 'app') {
    if (error?.code === 'UNAUTHORIZED' && target !== 'login') {
      setAppError(null);
      setLoginError('Session expired. Please log in again.');
      logout();
      return;
    }

    const message = error?.message || 'Request failed.';
    if (target === 'login') {
      setLoginError(message);
      return;
    }

    setAppError(message);
  }

  async function loadDashboard(currentToken) {
    const [me, restaurants, myPaymentMethods, myOrders, cartOrder] = await Promise.all([
      apiRequest('/users/me', { token: currentToken }),
      apiRequest('/restaurants', { token: currentToken }),
      apiRequest('/payments', { token: currentToken }),
      apiRequest('/orders', { token: currentToken }),
      apiRequest('/cart', { token: currentToken }),
    ]);

    const data = { me, restaurants, myPaymentMethods, myOrders, cartOrder };
    setDashboard(data);
    setSelectedRestaurantId((previous) => cartOrder?.restaurantId ?? previous ?? restaurants[0]?.id ?? null);
    setSelectedPaymentMethodId(
      (previous) => cartOrder?.paymentMethodId ?? previous ?? myPaymentMethods.find((item) => item.isDefault)?.id ?? null,
    );
    setCart(cartStateFromOrder(cartOrder));
    setSelectedOrderPaymentMethodIds((previous) => {
      const next = { ...previous };

      for (const order of cartOrder ? mergeOrdersWithCart(myOrders, cartOrder, me.id) : myOrders) {
        if (!next[order.id]) {
          next[order.id] = order.paymentMethodId ?? order.paymentMethod?.id ?? order.user?.paymentMethods?.[0]?.id ?? null;
        }
      }

      return next;
    });
  }

  useEffect(() => {
    if (!token) {
      setDashboard(null);
      return;
    }

    loadDashboard(token).catch((error) => {
      handleApiError(error);
    });
  }, [token]);

  const cartItems = useMemo(() => {
    if (!selectedRestaurant) {
      return [];
    }

    return selectedRestaurant.menuItems
      .filter((item) => cart[item.id])
      .map((item) => ({
        ...item,
        quantity: cart[item.id],
      }));
  }, [cart, selectedRestaurant]);

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [cartItems],
  );

  async function handleLogin() {
    try {
      setLoading(true);
      setLoginError(null);
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      sessionStorage.setItem('token', data.accessToken);
      setToken(data.accessToken);
    } catch (error) {
      handleApiError(error, 'login');
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    if (!token) {
      return;
    }

    try {
      setAppError(null);
      await loadDashboard(token);
    } catch (error) {
      handleApiError(error);
    }
  }

  async function persistCart(nextCart, options = {}) {
    const restaurantId = options.restaurantId ?? selectedRestaurantId;
    const paymentMethodId = options.paymentMethodId ?? selectedPaymentMethodId;
    const restaurants = dashboard?.restaurants ?? [];
    const restaurant = restaurants.find((item) => item.id === restaurantId);

    if (!token || !restaurantId || !restaurant) {
      return;
    }

    try {
      const items = restaurant.menuItems
        .map((item) => ({
          menuItemId: item.id,
          quantity: nextCart[item.id] ?? 0,
        }))
        .filter((item) => item.quantity > 0);

      const cartOrder = await apiRequest('/cart', {
        method: 'PUT',
        token,
        body: {
          restaurantId,
          paymentMethodId,
          items,
        },
      });

      setAppError(null);
      setDashboard((current) =>
        current
          ? {
              ...current,
              cartOrder,
              myOrders: mergeOrdersWithCart(current.myOrders, cartOrder, current.me.id),
            }
          : current,
      );

      if (cartOrder) {
        setSelectedOrderPaymentMethodIds((current) => ({
          ...current,
          [cartOrder.id]:
            cartOrder.paymentMethodId ??
            cartOrder.paymentMethod?.id ??
            cartOrder.user?.paymentMethods?.[0]?.id ??
            null,
        }));
      }
    } catch (error) {
      handleApiError(error);
    }
  }

  async function createOrder() {
    if (!selectedRestaurant || cartItems.length === 0) {
      return;
    }

    await persistCart(cart, {
      restaurantId: selectedRestaurant.id,
      paymentMethodId: selectedPaymentMethodId,
    });
  }

  async function checkoutOrder(orderId) {
    const paymentMethodId = selectedOrderPaymentMethodIds[orderId];

    if (!token || !paymentMethodId) {
      return;
    }

    try {
      setAppError(null);
      await apiRequest(`/orders/${orderId}/checkout`, {
        method: 'POST',
        token,
        body: { paymentMethodId },
      });
      await refresh();
    } catch (error) {
      handleApiError(error);
    }
  }

  async function updateOrderPaymentMethod(orderId) {
    const paymentMethodId = selectedOrderPaymentMethodIds[orderId];

    if (!token || !paymentMethodId) {
      return;
    }

    try {
      setAppError(null);
      await apiRequest(`/orders/${orderId}/payment-method`, {
        method: 'PATCH',
        token,
        body: { paymentMethodId },
      });
      await refresh();
    } catch (error) {
      handleApiError(error);
    }
  }

  async function cancelOrder(orderId) {
    if (!token) {
      return;
    }

    try {
      setAppError(null);
      await apiRequest(`/orders/${orderId}/cancel`, {
        method: 'POST',
        token,
      });
      await refresh();
    } catch (error) {
      handleApiError(error);
    }
  }

  async function addPaymentMethod() {
    if (!token) {
      return;
    }

    try {
      setAppError(null);
      await apiRequest('/payments', {
        method: 'POST',
        token,
        body: {
          type: 'VISA',
          last4: '9876',
          isDefault: true,
        },
      });
      await refresh();
    } catch (error) {
      handleApiError(error);
    }
  }

  function logout() {
    sessionStorage.removeItem('token');
    setToken(null);
    setCart({});
    setDashboard(null);
    setSelectedOrderPaymentMethodIds({});
  }

  function handleRestaurantChange(event) {
    const nextRestaurantId = event.target.value;
    const hasCartItems = Object.values(cart).some((quantity) => quantity > 0);

    setSelectedRestaurantId(nextRestaurantId);

    if (hasCartItems && nextRestaurantId !== selectedRestaurantId) {
      setCart({});
      void persistCart({}, { restaurantId: nextRestaurantId, paymentMethodId: selectedPaymentMethodId });
    }
  }

  function updateCartQuantity(menuItemId, quantity) {
    const nextCart = {
      ...cart,
      [menuItemId]: Math.max(quantity, 0),
    };

    if (nextCart[menuItemId] === 0) {
      delete nextCart[menuItemId];
    }

    setCart(nextCart);
    void persistCart(nextCart);
  }

  function handleCartPaymentMethodChange(nextPaymentMethodId) {
    setSelectedPaymentMethodId(nextPaymentMethodId);

    if (Object.values(cart).some((quantity) => quantity > 0)) {
      void persistCart(cart, {
        restaurantId: selectedRestaurantId,
        paymentMethodId: nextPaymentMethodId,
      });
    }
  }

  if (!token || !dashboard) {
    return (
      <main className="app-shell login-shell">
        <LoginPanel
          email={email}
          password={password}
          loading={loading}
          error={loginError}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onLogin={handleLogin}
        />
      </main>
    );
  }

  const canCheckout = ['ADMIN', 'MANAGER'].includes(dashboard.me.role);
  const canCancel = ['ADMIN', 'MANAGER'].includes(dashboard.me.role);
  const canUpdatePayment = dashboard.me.role === 'ADMIN';

  return (
    <main className="app-shell">
      <section className="panel hero-panel">
        <div>
          <p className="eyebrow">Authenticated as</p>
          <h1>{dashboard.me.name}</h1>
          <p className="muted">
            {dashboard.me.role} {dashboard.me.country ? `| ${dashboard.me.country}` : '| Global access'}
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={logout}>
          Logout
        </button>
      </section>

      {appError ? <p className="error banner">{appError}</p> : null}

      <section className="grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Restaurants</p>
              <h2>Accessible catalog</h2>
            </div>
            <select value={selectedRestaurantId ?? ''} onChange={handleRestaurantChange}>
              {dashboard.restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name} ({restaurant.country})
                </option>
              ))}
            </select>
          </div>

          <div className="menu-list">
            {selectedRestaurant?.menuItems.map((item) => (
              <article key={item.id} className="menu-card">
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </div>
                <div className="menu-card-footer">
                  <strong>${item.price.toFixed(2)}</strong>
                  <div className="qty-control">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.id, (cart[item.id] ?? 0) - 1)}
                    >
                      -
                    </button>
                    <span>{cart[item.id] ?? 0}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.id, (cart[item.id] ?? 0) + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Cart</p>
              <h2>Persisted backend cart</h2>
            </div>
            <strong>${cartTotal.toFixed(2)}</strong>
          </div>

          <div className="stack">
            {cartItems.length === 0 ? <p className="muted">Add items from the menu to prepare a draft order.</p> : null}
            {cartItems.map((item) => (
              <div key={item.id} className="inline-row">
                <span>
                  {item.name} x {item.quantity}
                </span>
                <strong>${(item.quantity * item.price).toFixed(2)}</strong>
              </div>
            ))}
          </div>

          <label>
            <span>Payment method</span>
            <select
              value={selectedPaymentMethodId ?? ''}
              onChange={(event) => handleCartPaymentMethodChange(event.target.value)}
            >
              {dashboard.myPaymentMethods.map((paymentMethod) => (
                <option key={paymentMethod.id} value={paymentMethod.id}>
                  {paymentMethod.type} ending in {paymentMethod.last4}
                  {paymentMethod.isDefault ? ' (default)' : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="button-row">
            <button type="button" className="primary-button" onClick={createOrder}>
              Save Cart
            </button>
            <button type="button" className="secondary-button" onClick={addPaymentMethod} disabled={!canUpdatePayment}>
              Add Demo Card
            </button>
          </div>

          {!canUpdatePayment ? (
            <p className="muted">
              Only admins can update payment methods in this implementation.
            </p>
          ) : null}
          <p className="muted">Cart changes are synced to the backend draft order and survive logout/login.</p>
        </section>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Orders</p>
            <h2>Accessible orders</h2>
          </div>
          <button type="button" className="secondary-button" onClick={refresh}>
            Refresh
          </button>
        </div>

        <div className="order-list">
          {dashboard.myOrders.map((order) => (
            <article key={order.id} className="order-card">
              <div className="order-card-header">
                <div>
                  <h3>{order.restaurant.name}</h3>
                  <p>
                    {order.status} | {order.restaurant.country}
                  </p>
                  {order.user?.name ? <p className="muted">Placed by {order.user.name}</p> : null}
                </div>
                <strong>${order.total.toFixed(2)}</strong>
              </div>

              <div className="stack">
                {order.items.map((item) => (
                  <div key={item.id} className="inline-row">
                    <span>
                      {item.menuItem.name} x {item.quantity}
                    </span>
                    <span>${(item.quantity * item.unitPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <p className="muted">
                Payment: {order.paymentMethod ? `${order.paymentMethod.type} ****${order.paymentMethod.last4}` : 'Not selected'}
              </p>

              {order.status === 'DRAFT' ? (
                <label>
                  <span>Order payment method</span>
                  <select
                    value={selectedOrderPaymentMethodIds[order.id] ?? ''}
                    onChange={(event) =>
                      setSelectedOrderPaymentMethodIds((current) => ({
                        ...current,
                        [order.id]: event.target.value,
                      }))
                    }
                  >
                    {(order.user?.paymentMethods ?? []).map((paymentMethod) => (
                      <option key={paymentMethod.id} value={paymentMethod.id}>
                        {paymentMethod.type} ending in {paymentMethod.last4}
                        {paymentMethod.isDefault ? ' (default)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <div className="button-row">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => cancelOrder(order.id)}
                  disabled={!canCancel || order.status === 'CANCELLED'}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => updateOrderPaymentMethod(order.id)}
                  disabled={!canUpdatePayment || order.status !== 'DRAFT'}
                >
                  Update Payment
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => checkoutOrder(order.id)}
                  disabled={!canCheckout || order.status !== 'DRAFT'}
                >
                  Checkout
                </button>
              </div>
            </article>
          ))}

          {dashboard.myOrders.length === 0 ? <p className="muted">No orders yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
