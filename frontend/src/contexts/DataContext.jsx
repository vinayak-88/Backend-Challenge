import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cartApi, ordersApi, paymentsApi, restaurantsApi } from '../services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}

export function DataProvider({ children }) {
  const { token, user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cartOrder, setCartOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Local cart state (source of truth until saved to backend)
  const [localCart, setLocalCart] = useState({});

  // Manual restaurant selection state
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);

  // Sync restaurant selection when data loads
  useEffect(() => {
    if (restaurants.length > 0) {
      setSelectedRestaurantId((prev) => {
        // If prev selection is no longer valid, pick a new one
        const isValid = restaurants.some((r) => r.id === prev);
        if (!isValid) {
          return cartOrder?.restaurantId ?? restaurants[0]?.id ?? null;
        }
        return prev;
      });
    }
  }, [restaurants, cartOrder]);

  const loadAllData = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const [fetchedRestaurants, fetchedPayments, fetchedOrders, fetchedCart] =
        await Promise.all([
          restaurantsApi.listRestaurants(token),
          paymentsApi.listPaymentMethods(token),
          ordersApi.listOrders(token),
          cartApi.getCart(token),
        ]);

      setRestaurants(fetchedRestaurants);
      setPaymentMethods(fetchedPayments);
      setOrders(fetchedOrders);
      setCartOrder(fetchedCart);

      // Populate local cart from backend cart (if exists)
      if (fetchedCart && fetchedCart.items) {
        const cartMap = {};
        fetchedCart.items.forEach((item) => {
          cartMap[item.menuItemId] = item.quantity;
        });
        setLocalCart(cartMap);
      } else {
        setLocalCart({});
      }

      // Set selected restaurant from cart or first available
      if (fetchedCart?.restaurantId) {
        setSelectedRestaurantId(fetchedCart.restaurantId);
      } else if (fetchedRestaurants.length > 0) {
        setSelectedRestaurantId(fetchedRestaurants[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Local cart actions
  const addToCart = useCallback((itemId) => {
    setLocalCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] ?? 0) + 1,
    }));
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setLocalCart((prev) => {
      const newQty = Math.max((prev[itemId] ?? 0) - 1, 0);
      if (newQty === 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: newQty };
    });
  }, []);

  const setCartQuantity = useCallback((itemId, quantity) => {
    setLocalCart((prev) => {
      if (quantity <= 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: quantity };
    });
  }, []);

  const clearLocalCart = useCallback(() => {
    setLocalCart({});
  }, []);

  const saveCart = useCallback(
    async (restaurantId, paymentMethodId, items) => {
      setActionLoading('saveCart');
      setError(null);
      try {
        const updatedCart = await cartApi.saveCart(token, {
          restaurantId,
          paymentMethodId,
          items,
        });
        setCartOrder(updatedCart);

        // Clear local cart since it's now synced
        if (!updatedCart) {
          setCartOrder(null);
          setLocalCart({});
        } else {
          const cartMap = {};
          updatedCart.items.forEach((item) => {
            cartMap[item.menuItemId] = item.quantity;
          });
          setLocalCart(cartMap);
        }
        return updatedCart;
      } catch (err) {
        setError(err.message || 'Failed to save cart.');
        throw err;
      } finally {
        setActionLoading(null);
      }
    },
    [token]
  );

  const checkoutOrder = useCallback(
    async (orderId, paymentMethodId) => {
      setActionLoading(`checkout_${orderId}`);
      setError(null);
      try {
        await ordersApi.checkout(token, orderId, paymentMethodId);
        await loadAllData();
      } catch (err) {
        setError(err.message || 'Failed to checkout order.');
        throw err;
      } finally {
        setActionLoading(null);
      }
    },
    [token, loadAllData]
  );

  const cancelOrder = useCallback(
    async (orderId) => {
      setActionLoading(`cancel_${orderId}`);
      setError(null);
      try {
        await ordersApi.cancelOrder(token, orderId);
        await loadAllData();
      } catch (err) {
        setError(err.message || 'Failed to cancel order.');
        throw err;
      } finally {
        setActionLoading(null);
      }
    },
    [token, loadAllData]
  );

  const updateOrderPayment = useCallback(
    async (orderId, paymentMethodId) => {
      setActionLoading(`payment_${orderId}`);
      setError(null);
      try {
        await ordersApi.updatePaymentMethod(token, orderId, paymentMethodId);
        await loadAllData();
      } catch (err) {
        setError(err.message || 'Failed to update payment method.');
        throw err;
      } finally {
        setActionLoading(null);
      }
    },
    [token, loadAllData]
  );

  // Build combined orders list: cart (DRAFT) first, then non-draft orders
  const allOrders = useMemo(() => {
    const result = [];
    if (cartOrder) {
      result.push(cartOrder);
    }
    result.push(...orders);
    return result;
  }, [cartOrder, orders]);

  // Check if there are unsaved local cart items
  const hasLocalCartItems = useMemo(
    () => Object.values(localCart).some((q) => q > 0),
    [localCart]
  );

  const value = useMemo(
    () => ({
      restaurants,
      paymentMethods,
      orders: allOrders,
      cartOrder,
      selectedRestaurantId,
      setSelectedRestaurantId,
      loading,
      actionLoading,
      error,
      hasLocalCartItems,
      loadAllData,
      saveCart,
      checkoutOrder,
      cancelOrder,
      updateOrderPayment,
      setError,
      // Local cart
      localCart,
      addToCart,
      removeFromCart,
      setCartQuantity,
      clearLocalCart,
    }),
    [
      restaurants,
      paymentMethods,
      allOrders,
      cartOrder,
      selectedRestaurantId,
      loading,
      actionLoading,
      error,
      hasLocalCartItems,
      loadAllData,
      saveCart,
      checkoutOrder,
      cancelOrder,
      updateOrderPayment,
      localCart,
      addToCart,
      removeFromCart,
      setCartQuantity,
      clearLocalCart,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}