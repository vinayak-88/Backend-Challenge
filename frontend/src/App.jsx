import React, { useState, useEffect, useCallback } from 'react'
import { api } from './lib/api'
import LoginComponent from './components/Login'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [restaurants, setRestaurants] = useState([])
  const [payments, setPayments] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [cart, setCart] = useState(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [cartItems, setCartItems] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [pendingAction, setPendingAction] = useState(null)

  const clearSuccess = useCallback(() => {
    setTimeout(() => setSuccessMessage(''), 3000)
  }, [])

  const resetViewState = useCallback(() => {
    setUser(null)
    setRestaurants([])
    setPayments([])
    setOrders([])
    setUsers([])
    setCart(null)
    setCartItems({})
    setSelectedRestaurant(null)
    setSuccessMessage('')
    setPendingAction(null)
  }, [])

  const handleLogout = useCallback(() => {
    api.clearToken()
    resetViewState()
  }, [resetViewState])

  const loadDashboard = useCallback(async () => {
    try {
      setError(null)
      const me = await api.getMe()
      const canViewUsers = me.role === 'ADMIN' || me.role === 'MANAGER'
      const [restaurantsData, paymentsData, ordersData, cartData, usersData] = await Promise.all([
        api.getRestaurants(),
        api.getPayments(),
        api.getOrders(),
        api.getCart().catch(() => null),
        canViewUsers ? api.listUsers() : Promise.resolve([]),
      ])

      const normalizedRestaurants = restaurantsData || []

      setUser(me)
      setRestaurants(normalizedRestaurants)
      setPayments(paymentsData || [])
      setOrders(ordersData || [])
      setUsers(usersData || [])
      setCart(cartData || null)

      if (cartData?.items) {
        const items = {}
        cartData.items.forEach((item) => {
          items[item.menuItemId] = item.quantity
        })
        setCartItems(items)

        const cartRestaurant =
          normalizedRestaurants.find((restaurant) => restaurant.id === cartData.restaurantId) ||
          null
        if (cartRestaurant) {
          setSelectedRestaurant(cartRestaurant)
        }
      } else {
        setCartItems({})
      }
    } catch (err) {
      if (err?.unauthorized) {
        handleLogout()
        setError('Session expired. Please log in again.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [handleLogout])

  useEffect(() => {
    if (api.getToken()) {
      loadDashboard()
    } else {
      setLoading(false)
    }
  }, [loadDashboard])

  const handleLogin = async (email, password) => {
    try {
      setError(null)
      setLoading(true)
      await api.login(email, password)
      await loadDashboard()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleSelectRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant)
    const newItems = {}
    restaurant.menuItems?.forEach((item) => {
      newItems[item.id] = cartItems[item.id] || 0
    })
    setCartItems(newItems)
  }

  const handleAddToCart = (menuItemId) => {
    setCartItems((prev) => ({
      ...prev,
      [menuItemId]: (prev[menuItemId] || 0) + 1,
    }))
  }

  const handleRemoveFromCart = (menuItemId) => {
    setCartItems((prev) => {
      const qty = (prev[menuItemId] || 0) - 1
      return { ...prev, [menuItemId]: qty < 0 ? 0 : qty }
    })
  }

  const handleSaveCart = async () => {
    if (!selectedRestaurant) return
    try {
      setError(null)
      const items = Object.entries(cartItems)
        .filter(([, qty]) => qty > 0)
        .map(([menuItemId, quantity]) => ({ menuItemId, quantity }))

      if (items.length === 0) {
        setError('Cart must have at least one item. Use Clear Cart to remove the draft order.')
        return
      }

      setPendingAction({ key: 'save-cart', message: 'Saving your cart...' })
      const defaultPayment = payments.find((p) => p.isDefault)
      const cartData = await api.saveCart({
        restaurantId: selectedRestaurant.id,
        paymentMethodId: defaultPayment?.id,
        items,
      })
      setCart(cartData)
      setSuccessMessage('Cart saved successfully!')
      clearSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setPendingAction(null)
    }
  }

  const handleClearCart = async () => {
    const restaurantId = selectedRestaurant?.id || cart?.restaurantId
    if (!restaurantId) {
      return
    }

    try {
      setError(null)
      setPendingAction({ key: 'clear-cart', message: 'Clearing your cart...' })
      await api.saveCart({
        restaurantId,
        items: [],
      })
      setCart(null)
      setCartItems({})
      setSuccessMessage('Cart cleared successfully!')
      clearSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setPendingAction(null)
    }
  }

  const handleCheckout = async (orderId, paymentMethodId) => {
    try {
      setError(null)
      setPendingAction({ key: `checkout-${orderId}`, message: 'Placing your order...' })
      const order = await api.checkoutOrder(orderId, paymentMethodId)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)))
      setCart(null)
      setCartItems({})
      await loadDashboard()
      setPendingAction(null)
      setSuccessMessage('Order placed successfully!')
      clearSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setPendingAction(null)
    }
  }

  const handleCancelOrder = async (orderId) => {
    try {
      setError(null)
      setPendingAction({ key: `cancel-${orderId}`, message: 'Cancelling order...' })
      const order = await api.cancelOrder(orderId)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)))
      setSuccessMessage('Order cancelled successfully!')
      clearSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setPendingAction(null)
    }
  }

  const handleUpdatePaymentMethod = async (orderId, paymentMethodId) => {
    try {
      setError(null)
      setPendingAction({ key: `payment-${orderId}`, message: 'Updating payment method...' })
      const order = await api.updateOrderPaymentMethod(orderId, paymentMethodId)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)))
      await loadDashboard()
      setPendingAction(null)
      setSuccessMessage('Payment method updated successfully!')
      clearSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setPendingAction(null)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader">Loading...</div>
      </div>
    )
  }

  return (
    <div className="app">
      {error && (
        <div className="error-banner">
          <span>Error: {error}</span>
          <button className="error-close" onClick={() => setError(null)}>
            X
          </button>
        </div>
      )}
      {successMessage && !pendingAction && (
        <div className="success-banner">{successMessage}</div>
      )}
      {pendingAction && (
        <div className="pending-banner" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <span>{pendingAction.message}</span>
        </div>
      )}
      {!user ? (
        <LoginComponent onLogin={handleLogin} error={error} />
      ) : (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          restaurants={restaurants}
          payments={payments}
          orders={orders}
          users={users}
          cart={cart}
          selectedRestaurant={selectedRestaurant}
          cartItems={cartItems}
          onSelectRestaurant={handleSelectRestaurant}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          onSaveCart={handleSaveCart}
          onClearCart={handleClearCart}
          onCheckout={handleCheckout}
          onCancelOrder={handleCancelOrder}
          onUpdatePaymentMethod={handleUpdatePaymentMethod}
          pendingAction={pendingAction}
        />
      )}
    </div>
  )
}

export default App
