import React, { useMemo, useState } from 'react'

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`

export default function Dashboard({
  user,
  onLogout,
  restaurants,
  payments,
  orders,
  users,
  cart,
  selectedRestaurant,
  cartItems,
  onSelectRestaurant,
  onAddToCart,
  onRemoveFromCart,
  onSaveCart,
  onClearCart,
  onCheckout,
  onCancelOrder,
  onUpdatePaymentMethod,
  pendingAction,
}) {
  const [activeTab, setActiveTab] = useState('restaurants')
  const [selectedPayment, setSelectedPayment] = useState({})

  const canCheckout = user.role === 'ADMIN' || user.role === 'MANAGER'
  const canCancel = user.role === 'ADMIN' || user.role === 'MANAGER'
  const canUpdatePayment = user.role === 'ADMIN'
  const canViewUsers = user.role === 'ADMIN' || user.role === 'MANAGER'
  const isAdmin = user.role === 'ADMIN'
  const isBusy = Boolean(pendingAction)

  const isActionPending = (key) => pendingAction?.key === key
  const getOrderActionKey = (action, orderId) => `${action}-${orderId}`

  const selectedCartItems = useMemo(() => {
    if (!selectedRestaurant?.menuItems) {
      return []
    }

    return selectedRestaurant.menuItems
      .filter((item) => (cartItems[item.id] || 0) > 0)
      .map((item) => ({
        ...item,
        quantity: cartItems[item.id],
      }))
  }, [selectedRestaurant, cartItems])

  const selectedCartTotal = useMemo(
    () =>
      selectedCartItems.reduce(
        (total, item) => total + Number(item.price || 0) * Number(item.quantity || 0),
        0,
      ),
    [selectedCartItems],
  )

  const cartRestaurantName = useMemo(() => {
    if (!cart?.restaurantId) {
      return null
    }

    return restaurants.find((restaurant) => restaurant.id === cart.restaurantId)?.name || null
  }, [cart?.restaurantId, restaurants])

  const getPaymentOptions = (order) => {
    const options = payments.map((payment) => ({
      id: payment.id,
      label: `${payment.type} ***${payment.last4}${payment.isDefault ? ' (Default)' : ''}`,
    }))

    if (order.paymentMethodId && !options.some((option) => option.id === order.paymentMethodId)) {
      const ownerLabel = order.paymentMethod
        ? `${order.paymentMethod.type} ***${order.paymentMethod.last4} (Order Owner)`
        : 'Current order payment method'

      options.unshift({
        id: order.paymentMethodId,
        label: ownerLabel,
      })
    }

    return options
  }

  const getSelectedPaymentId = (order) => {
    const fallbackPayment = payments.find((payment) => payment.isDefault) || payments[0]
    return selectedPayment[order.id] || order.paymentMethodId || fallbackPayment?.id || ''
  }

  const handlePaymentSelection = (orderId, paymentMethodId) => {
    setSelectedPayment((prev) => ({
      ...prev,
      [orderId]: paymentMethodId,
    }))
  }

  const handleMenuAction = (restaurant, menuItemId, action) => {
    if (selectedRestaurant?.id !== restaurant.id) {
      onSelectRestaurant(restaurant)
    }

    if (action === 'add') {
      onAddToCart(menuItemId)
      return
    }

    onRemoveFromCart(menuItemId)
  }

  return (
    <>
      <header className="app-header">
        <h1>Slooze Food Ordering</h1>
        <div className="header-info">
          <div className="user-badge">
            <strong>{user.name}</strong>
            <span className="role-badge">{user.role}</span>
            {user.country && <span className="country-badge">{user.country}</span>}
          </div>
          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'restaurants' ? 'active' : ''}`}
          onClick={() => setActiveTab('restaurants')}
        >
          Restaurants
        </button>
        <button className={`nav-tab ${activeTab === 'cart' ? 'active' : ''}`} onClick={() => setActiveTab('cart')}>
          Cart
        </button>
        <button className={`nav-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          Orders
        </button>
        <button
          className={`nav-tab ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Payments
        </button>
        {canViewUsers && (
          <button className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            Users
          </button>
        )}
      </nav>

      <main className="main-content">
        {activeTab === 'restaurants' && (
          <section>
            {restaurants.length === 0 ? (
              <div className="empty-state">
                <h3>No restaurants available for your scope.</h3>
              </div>
            ) : (
              <div className="restaurant-grid">
                {restaurants.map((restaurant) => {
                  const isSelected = selectedRestaurant?.id === restaurant.id

                  return (
                    <article
                      key={restaurant.id}
                      className="restaurant-card"
                      style={isSelected ? { outline: '2px solid #3b82f6' } : undefined}
                    >
                      <div className="restaurant-header">
                        <h3>{restaurant.name}</h3>
                        <span className="country-tag">{restaurant.country}</span>
                      </div>
                      <div className="menu-items">
                        {restaurant.menuItems?.map((item) => {
                          const quantity = isSelected ? cartItems[item.id] || 0 : 0

                          return (
                            <div key={item.id} className="menu-item">
                              <div className="menu-item-info">
                                <h4>{item.name}</h4>
                                <p>{item.description}</p>
                              </div>
                              <div>
                                <div className="menu-item-price">{formatCurrency(item.price)}</div>
                                <div className="menu-item-actions">
                                  <button
                                    className="qty-btn"
                                    onClick={() => handleMenuAction(restaurant, item.id, 'remove')}
                                    disabled={isBusy}
                                  >
                                    -
                                  </button>
                                  <span className="qty-display">{quantity}</span>
                                  <button
                                    className="qty-btn"
                                    onClick={() => handleMenuAction(restaurant, item.id, 'add')}
                                    disabled={isBusy}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}

                        {!isSelected && (
                          <button
                            className="secondary-button"
                            onClick={() => onSelectRestaurant(restaurant)}
                            disabled={isBusy}
                          >
                            Build Cart Here
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            <div className="cart-summary">
              <h3>
                {selectedRestaurant
                  ? `Current cart draft: ${selectedRestaurant.name}`
                  : 'Select a restaurant to start your cart.'}
              </h3>

              {selectedCartItems.length === 0 ? (
                <div className="empty-state">
                  <h3>No items in the local cart draft.</h3>
                </div>
              ) : (
                <>
                  <div className="cart-items-list">
                    {selectedCartItems.map((item) => (
                      <div key={item.id} className="cart-item">
                        <span>
                          {item.name} x {item.quantity}
                        </span>
                        <span>{formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</span>
                      </div>
                    ))}
                  </div>
                  <div className="cart-total">Total: {formatCurrency(selectedCartTotal)}</div>
                </>
              )}

              <div className="order-actions">
                <button
                  className="primary-button"
                  onClick={onSaveCart}
                  disabled={isBusy || !selectedRestaurant || selectedCartItems.length === 0}
                >
                  {isActionPending('save-cart') ? 'Saving...' : 'Save Cart'}
                </button>
                <button
                  className="secondary-button"
                  onClick={onClearCart}
                  disabled={isBusy || (!selectedRestaurant && !cart?.restaurantId)}
                >
                  {isActionPending('clear-cart') ? 'Clearing...' : 'Clear Cart'}
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'cart' && (
          <section>
            {!cart ? (
              <div className="empty-state">
                <h3>No persisted cart found.</h3>
                <p>Go to Restaurants, add items, and click Save Cart.</p>
              </div>
            ) : (
              <div className="cart-summary">
                <h2>Saved Cart</h2>
                <p>
                  <strong>Restaurant:</strong> {cartRestaurantName || cart.restaurantId}
                </p>
                <div className="cart-items-list">
                  {cart.items?.map((item) => (
                    <div key={item.menuItemId} className="cart-item">
                      <span>
                        {item.menuItem?.name || item.menuItemId} x {item.quantity}
                      </span>
                      <span>{formatCurrency(Number(item.unitPrice || 0) * Number(item.quantity || 0))}</span>
                    </div>
                  ))}
                </div>
                <div className="cart-total">Total: {formatCurrency(cart.total)}</div>

                <div className="order-actions">
                  {(canCheckout || canUpdatePayment) && (
                    <select
                      value={getSelectedPaymentId(cart)}
                      onChange={(event) => handlePaymentSelection(cart.id, event.target.value)}
                      disabled={isBusy}
                    >
                      {payments.length === 0 ? (
                        <option value="">No payment methods available</option>
                      ) : (
                        getPaymentOptions(cart).map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))
                      )}
                    </select>
                  )}
                  <button className="secondary-button" onClick={onClearCart} disabled={isBusy}>
                    {isActionPending('clear-cart') ? 'Clearing...' : 'Clear Cart'}
                  </button>
                  <button className="primary-button" onClick={() => setActiveTab('restaurants')} disabled={isBusy}>
                    Edit Cart
                  </button>
                  {canUpdatePayment && (
                    <button
                      className="primary-button"
                      onClick={() => onUpdatePaymentMethod(cart.id, getSelectedPaymentId(cart))}
                      disabled={isBusy || !getSelectedPaymentId(cart)}
                    >
                      {isActionPending(getOrderActionKey('payment', cart.id)) ? 'Updating...' : 'Update Payment'}
                    </button>
                  )}
                  {canCheckout && (
                    <button
                      className="success-button"
                      onClick={() => onCheckout(cart.id, getSelectedPaymentId(cart))}
                      disabled={isBusy || !getSelectedPaymentId(cart)}
                    >
                      {isActionPending(getOrderActionKey('checkout', cart.id)) ? 'Placing...' : 'Checkout'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'orders' && (
          <section className="orders-section">
            <h2>Orders</h2>
            {orders.length === 0 ? (
              <div className="empty-state">
                <h3>No orders found.</h3>
              </div>
            ) : (
              orders.map((order) => {
                const paymentOptions = getPaymentOptions(order)
                const selectedPaymentId = getSelectedPaymentId(order)

                return (
                  <article key={order.id} className="order-card">
                    <div className="order-header">
                      <span className="order-id">Order #{order.id.slice(-8)}</span>
                      <span className={`order-status ${order.status}`}>{order.status}</span>
                    </div>

                    <div className="order-details">
                      <div className="order-detail-item">
                        <label>Restaurant</label>
                        <span>{order.restaurant?.name || order.restaurantId}</span>
                      </div>
                      <div className="order-detail-item">
                        <label>Total</label>
                        <span>{formatCurrency(order.total)}</span>
                      </div>
                      <div className="order-detail-item">
                        <label>Payment</label>
                        <span>
                          {order.paymentMethod
                            ? `${order.paymentMethod.type} ***${order.paymentMethod.last4}`
                            : 'Not selected'}
                        </span>
                      </div>
                      {isAdmin && (
                        <div className="order-detail-item">
                          <label>Owner</label>
                          <span>{order.user?.name || order.userId}</span>
                        </div>
                      )}
                    </div>

                    <div className="order-items">
                      <ul>
                        {order.items?.map((item) => (
                          <li key={item.id}>
                            {item.menuItem?.name || item.menuItemId} x {item.quantity} @{' '}
                            {formatCurrency(item.unitPrice)}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {order.status === 'DRAFT' && (canCheckout || canUpdatePayment) && (
                      <div className="order-actions">
                        <select
                          value={selectedPaymentId}
                          onChange={(event) => handlePaymentSelection(order.id, event.target.value)}
                          disabled={isBusy}
                        >
                          <option value="">Select payment method</option>
                          {paymentOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        {canCheckout && (
                          <button
                            className="success-button"
                            onClick={() => onCheckout(order.id, selectedPaymentId)}
                            disabled={isBusy || !selectedPaymentId}
                          >
                            {isActionPending(getOrderActionKey('checkout', order.id)) ? 'Placing...' : 'Checkout'}
                          </button>
                        )}

                        {canUpdatePayment && (
                          <button
                            className="primary-button"
                            onClick={() => onUpdatePaymentMethod(order.id, selectedPaymentId)}
                            disabled={isBusy || !selectedPaymentId}
                          >
                            {isActionPending(getOrderActionKey('payment', order.id)) ? 'Updating...' : 'Update Payment'}
                          </button>
                        )}
                      </div>
                    )}

                    {order.status === 'PLACED' && canCancel && (
                      <div className="order-actions">
                        <button
                          className="danger-button"
                          onClick={() => onCancelOrder(order.id)}
                          disabled={isBusy}
                        >
                          {isActionPending(getOrderActionKey('cancel', order.id)) ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      </div>
                    )}
                  </article>
                )
              })
            )}
          </section>
        )}

        {activeTab === 'payments' && (
          <section className="orders-section">
            <h2>Payment Methods</h2>
            {payments.length === 0 ? (
              <div className="empty-state">
                <h3>No payment methods available.</h3>
              </div>
            ) : (
              payments.map((payment) => (
                <article key={payment.id} className="order-card">
                  <div className="order-details">
                    <div className="order-detail-item">
                      <label>Type</label>
                      <span>{payment.type}</span>
                    </div>
                    <div className="order-detail-item">
                      <label>Last 4</label>
                      <span>***{payment.last4}</span>
                    </div>
                    <div className="order-detail-item">
                      <label>Default</label>
                      <span>{payment.isDefault ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {activeTab === 'users' && canViewUsers && (
          <section className="orders-section">
            <h2>{isAdmin ? 'All Users' : `${user.country} Users`}</h2>
            {users.length === 0 ? (
              <div className="empty-state">
                <h3>No users found.</h3>
              </div>
            ) : (
              <div className="users-grid">
                {users.map((managedUser) => {
                  return (
                    <article key={managedUser.id} className="user-card">
                      <div className="user-card-header">
                        <div>
                          <h3>{managedUser.name}</h3>
                          <p>{managedUser.email}</p>
                        </div>
                        <div className="user-card-badges">
                          <span className="role-badge">{managedUser.role}</span>
                          {managedUser.country && <span className="country-badge">{managedUser.country}</span>}
                        </div>
                      </div>

                      <div className="order-details">
                        <div className="order-detail-item">
                          <label>Payment Methods</label>
                          <span>{managedUser.paymentMethods?.length || 0}</span>
                        </div>
                      </div>

                      {managedUser.paymentMethods?.length > 0 && (
                        <div className="user-section">
                          <h4>Payment Details</h4>
                          <div className="cart-items-list">
                            {managedUser.paymentMethods.map((paymentMethod) => (
                              <div key={paymentMethod.id} className="cart-item">
                                <span>{paymentMethod.type} ***{paymentMethod.last4}</span>
                                <span>{paymentMethod.isDefault ? 'Default' : 'Backup'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </>
  )
}
