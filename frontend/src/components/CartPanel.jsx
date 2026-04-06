import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

export default function CartPanel() {
  const { permissions } = useAuth();
  const {
    restaurants,
    paymentMethods,
    selectedRestaurantId,
    cartOrder,
    localCart,
    saveCart,
    actionLoading,
    error,
    hasLocalCartItems,
  } = useData();

  const [selectedPayment, setSelectedPayment] = useState(() => {
    if (cartOrder?.paymentMethodId) return cartOrder.paymentMethodId;
    const defaultPM = paymentMethods.find((pm) => pm.isDefault);
    return defaultPM?.id ?? paymentMethods[0]?.id ?? '';
  });

  // Sync selected payment when cart order changes
  useEffect(() => {
    if (cartOrder?.paymentMethodId) {
      setSelectedPayment(cartOrder.paymentMethodId);
    }
  }, [cartOrder?.paymentMethodId]);

  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === selectedRestaurantId) ?? null,
    [restaurants, selectedRestaurantId]
  );

  // Merge saved cart items with local cart modifications
  const displayItems = useMemo(() => {
    const merged = {};

    // Start with saved cart items
    if (cartOrder?.items) {
      cartOrder.items.forEach((item) => {
        merged[item.menuItemId] = {
          id: item.menuItemId,
          name: item.menuItem?.name ?? 'Unknown Item',
          quantity: item.quantity,
          price: item.unitPrice,
        };
      });
    }

    // Override with local cart items (unsaved changes)
    Object.entries(localCart).forEach(([itemId, qty]) => {
      if (qty <= 0) {
        delete merged[itemId];
      } else if (merged[itemId]) {
        // Update existing item with local quantity
        merged[itemId].quantity = qty;
      } else if (selectedRestaurant) {
        // New item from local cart
        const menuItem = selectedRestaurant.menuItems.find((m) => m.id === itemId);
        if (menuItem) {
          merged[itemId] = {
            id: menuItem.id,
            name: menuItem.name,
            quantity: qty,
            price: menuItem.price,
          };
        }
      }
    });

    return Object.values(merged).filter((item) => item.quantity > 0);
  }, [cartOrder, localCart, selectedRestaurant]);

  const displayTotal = useMemo(
    () => displayItems.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [displayItems]
  );

  const isSaving = actionLoading === 'saveCart';

  const handleSaveCart = useCallback(async () => {
    if (!selectedRestaurant || !selectedPayment) return;

    const items = displayItems.map((item) => ({
      menuItemId: item.id,
      quantity: item.quantity,
    }));

    try {
      await saveCart(selectedRestaurant.id, selectedPayment, items);
    } catch {
      // Error handled by DataContext
    }
  }, [selectedRestaurant, selectedPayment, displayItems, saveCart]);

  const handleClearCart = useCallback(async () => {
    if (!selectedRestaurant || !selectedPayment) return;

    try {
      await saveCart(selectedRestaurant.id, selectedPayment, []);
    } catch {
      // Error handled by DataContext
    }
  }, [selectedRestaurant, selectedPayment, saveCart]);

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Cart</p>
          <h2>Persisted backend cart</h2>
        </div>
        <strong>${displayTotal.toFixed(2)}</strong>
      </div>

      {displayItems.length === 0 && (
        <p className="muted">Add items from the menu to prepare a draft order.</p>
      )}

      {displayItems.length > 0 && (
        <div className="stack">
          {displayItems.map((item) => (
            <div key={item.id} className="inline-row">
              <span>
                {item.name} x {item.quantity}
              </span>
              <strong>${(item.quantity * item.price).toFixed(2)}</strong>
            </div>
          ))}
        </div>
      )}

      <label>
        <span>Payment method</span>
        <select
          value={selectedPayment ?? ''}
          onChange={(e) => setSelectedPayment(e.target.value)}
        >
          {paymentMethods.length === 0 && (
            <option value="">No payment methods</option>
          )}
          {paymentMethods.map((pm) => (
            <option key={pm.id} value={pm.id}>
              {pm.type} ending in {pm.last4}
              {pm.isDefault ? ' (default)' : ''}
            </option>
          ))}
        </select>
      </label>

      {paymentMethods.length === 0 && (
        <p className="muted">
          You have no payment methods. Contact an admin to add one.
        </p>
      )}

      <div className="button-row">
        <button
          type="button"
          className="primary-button"
          onClick={handleSaveCart}
          disabled={isSaving || displayItems.length === 0 || paymentMethods.length === 0}
        >
          {isSaving ? 'Saving...' : 'Save Cart'}
        </button>
        {cartOrder && !hasLocalCartItems && (
          <button
            type="button"
            className="secondary-button"
            onClick={handleClearCart}
            disabled={isSaving}
          >
            Clear Cart
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      {!permissions?.canUpdatePayment && paymentMethods.length > 0 && (
        <p className="muted">
          Only admins can update payment methods.
        </p>
      )}
      {cartOrder && (
        <p className="muted">
          Cart persists across sessions.
        </p>
      )}
    </section>
  );
}