import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import ErrorBanner from '../components/ErrorBanner';
import RestaurantMenu from '../components/RestaurantMenu';
import CartPanel from '../components/CartPanel';
import OrderList from '../components/OrderList';

export default function DashboardPage() {
  const { user, logout, permissions } = useAuth();
  const { error, loadAllData } = useData();
  const [activeTab, setActiveTab] = useState('menu');

  return (
    <main className="app-shell">
      <section className="panel hero-panel">
        <div>
          <p className="eyebrow">Authenticated as</p>
          <h1>{user?.name}</h1>
          <p className="muted">
            {user?.role}{user?.country ? ` | ${user.country}` : ' | Global access'}
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={logout}>
          Logout
        </button>
      </section>

      <ErrorBanner message={error} />

      <nav className="tab-bar">
        <button
          className={activeTab === 'menu' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('menu')}
        >
          Restaurants & Menu
        </button>
        {permissions?.canCreateOrder && (
          <button
            className={activeTab === 'cart' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('cart')}
          >
            Cart
          </button>
        )}
        <button
          className={activeTab === 'orders' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
      </nav>

      {activeTab === 'menu' && <RestaurantMenu />}
      {activeTab === 'cart' && permissions?.canCreateOrder && <CartPanel />}
      {activeTab === 'orders' && <OrderList onRefresh={loadAllData} />}
    </main>
  );
}