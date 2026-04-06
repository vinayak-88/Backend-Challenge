import React, { useCallback, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

export default function OrderCard({ order }) {
  const { permissions } = useAuth();
  const { paymentMethods, checkoutOrder, cancelOrder, updateOrderPayment, actionLoading } = useData();
  const [selectedPayment, setSelectedPayment] = useState(
    order.paymentMethodId ?? order.paymentMethod?.id ?? ''
  );
  const [actionError, setActionError] = useState(null);

  const isLoading = (action) => actionLoading === `${action}_${order.id}`;

  const handleCheckout = useCallback(async () => {
    if (!selectedPayment) return;
    try {
      setActionError(null);
      await checkoutOrder(order.id, selectedPayment);
    } catch (err) {
      setActionError(err.message || 'Failed to checkout order.');
    }
  }, [order.id, selectedPayment, checkoutOrder]);

  const handleCancel = useCallback(async () => {
    try {
      setActionError(null);
      await cancelOrder(order.id);
    } catch (err) {
      setActionError(err.message || 'Failed to cancel order.');
    }
  }, [order.id, cancelOrder]);

  const handleUpdatePayment = useCallback(async () => {
    if (!selectedPayment) return;
    try {
      setActionError(null);
      await updateOrderPayment(order.id, selectedPayment);
    } catch (err) {
      setActionError(err.message || 'Failed to update payment method.');
    }
  }, [order.id, selectedPayment, updateOrderPayment]);

  const isDraft = order.status === 'DRAFT';

  return (
    <article className="order-card">
      <div className="order-card-header">
        <div>
          <h3>{order.restaurant?.name ?? 'Unknown Restaurant'}</h3>
          <p>
            {order.status} | {order.restaurant?.country ?? 'Unknown'}
          </p>
          {order.user?.name && (
            <p className="muted">Placed by {order.user.name}</p>
          )}
        </div>
        <strong>${(order.total ?? 0).toFixed(2)}</strong>
      </div>

      <div className="stack">
        {order.items?.map((item) => (
          <div key={item.id} className="inline-row">
            <span>
              {item.menuItem?.name ?? 'Unknown Item'} x {item.quantity}
            </span>
            <span>${((item.quantity ?? 0) * (item.unitPrice ?? 0)).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <p className="muted">
        Payment:{' '}
        {order.paymentMethod
          ? `${order.paymentMethod.type} ****${order.paymentMethod.last4}`
          : 'Not selected'}
      </p>

      {isDraft && paymentMethods.length > 0 && (
        <label>
          <span>Order payment method</span>
          <select
            value={selectedPayment ?? ''}
            onChange={(e) => setSelectedPayment(e.target.value)}
          >
            {paymentMethods.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.type} ending in {pm.last4}
                {pm.isDefault ? ' (default)' : ''}
              </option>
            ))}
          </select>
        </label>
      )}

      {actionError && <p className="error">{actionError}</p>}

      <div className="button-row">
        <button
          type="button"
          className="secondary-button"
          onClick={handleCancel}
          disabled={
            !permissions?.canCancelOrder ||
            order.status === 'CANCELLED' ||
            order.status === 'DRAFT' ||
            isLoading('cancel')
          }
        >
          {isLoading('cancel') ? 'Cancelling...' : 'Cancel'}
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={handleUpdatePayment}
          disabled={
            !permissions?.canUpdatePayment ||
            !isDraft ||
            isLoading('payment')
          }
        >
          {isLoading('payment') ? 'Updating...' : 'Update Payment'}
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={handleCheckout}
          disabled={
            !permissions?.canCheckout ||
            !isDraft ||
            paymentMethods.length === 0 ||
            isLoading('checkout')
          }
        >
          {isLoading('checkout') ? 'Checking out...' : 'Checkout'}
        </button>
      </div>
    </article>
  );
}