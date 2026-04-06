import React, { useCallback, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

export default function RestaurantMenu() {
  const {
    restaurants,
    selectedRestaurantId,
    setSelectedRestaurantId,
    cartOrder,
    localCart,
    addToCart,
    removeFromCart,
    hasLocalCartItems,
  } = useData();
  const { permissions } = useAuth();

  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === selectedRestaurantId) ?? null,
    [restaurants, selectedRestaurantId]
  );

  const handleRestaurantChange = useCallback(
    (restaurantId) => {
      if (hasLocalCartItems) {
        if (window.confirm('Switching restaurants will clear your unsaved cart items. Continue?')) {
          setSelectedRestaurantId(restaurantId);
        }
      } else {
        setSelectedRestaurantId(restaurantId);
      }
    },
    [hasLocalCartItems, setSelectedRestaurantId]
  );

  if (!selectedRestaurant) {
    return (
      <section className="panel">
        {restaurants.length === 0 ? (
          <p className="muted">No restaurants available for your region.</p>
        ) : (
          <p className="muted">Select a restaurant from the menu.</p>
        )}
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Restaurants</p>
          <h2>Accessible catalog</h2>
        </div>
        <select
          value={selectedRestaurantId ?? ''}
          onChange={(e) => handleRestaurantChange(e.target.value)}
        >
          {restaurants.map((rest) => (
            <option key={rest.id} value={rest.id}>
              {rest.name} ({rest.country})
            </option>
          ))}
        </select>
      </div>

      <div className="menu-list">
        {selectedRestaurant.menuItems.map((item) => (
          <article key={item.id} className="menu-card">
            <div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
            </div>
            <div className="menu-card-footer">
              <strong>${item.price.toFixed(2)}</strong>
              {permissions?.canCreateOrder && (
                <div className="qty-control">
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                  >
                    &minus;
                  </button>
                  <span>{localCart[item.id] ?? 0}</span>
                  <button
                    type="button"
                    onClick={() => addToCart(item.id)}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {hasLocalCartItems && (
        <p className="muted" style={{ marginTop: '1rem' }}>
          You have unsaved items in your cart. Go to the Cart tab to save.
        </p>
      )}

      {cartOrder && !hasLocalCartItems && (
        <p className="muted" style={{ marginTop: '1rem' }}>
          You have a saved cart from {selectedRestaurant.name} with $
          {(cartOrder.total ?? 0).toFixed(2)} total. Go to the Cart tab to review or modify.
        </p>
      )}
    </section>
  );
}