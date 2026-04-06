import React from 'react';
import { useData } from '../contexts/DataContext';
import OrderCard from './OrderCard';

export default function OrderList({ onRefresh }) {
  const { orders, loading } = useData();

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Orders</p>
          <h2>Accessible orders</h2>
        </div>
        <button type="button" className="secondary-button" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      <div className="order-list">
        {loading && <p className="muted">Loading orders...</p>}
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
        {orders.length === 0 && !loading && (
          <p className="muted">No orders yet.</p>
        )}
      </div>
    </section>
  );
}