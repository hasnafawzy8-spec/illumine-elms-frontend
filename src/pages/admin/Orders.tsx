import { useEffect, useMemo, useState } from 'react';
import { Button, Badge, Card, Select, PageHeader, Modal } from '../../components/ui';
import { Order, Payment, ReceiptData, View } from '../../types';
import { sampleOrders } from '../../data';
import { ordersAPI, paymentsAPI, receiptsAPI } from '../../services/api';
import ReceiptModal from '../../components/ReceiptModal';

interface Props {
  navigate: (view: View) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onOrderStatusChange?: (reference: string, status: Order['status']) => void;
}

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Ready for Collection', 'Out for Delivery', 'Delivered', 'Cancelled'];

const statusColors: Record<string, 'amber' | 'blue' | 'purple' | 'green' | 'red' | 'teal' | 'slate'> = {
  Pending: 'amber',
  Confirmed: 'purple',
  'Ready for Collection': 'teal',
  'Out for Delivery': 'blue',
  Delivered: 'green',
  Cancelled: 'red',
};

const statusAccent: Record<string, string> = {
  Pending: 'border-amber-200 bg-amber-50 text-amber-700',
  Confirmed: 'border-purple-200 bg-purple-50 text-purple-700',
  'Ready for Collection': 'border-teal-200 bg-teal-50 text-teal-700',
  'Out for Delivery': 'border-blue-200 bg-blue-50 text-blue-700',
  Delivered: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Cancelled: 'border-red-200 bg-red-50 text-red-700',
};

const paymentBadgeColor = (status?: string): 'amber' | 'green' | 'red' | 'slate' => {
  if (status === 'Paid') return 'green';
  if (status === 'Failed' || status === 'Rejected') return 'red';
  if (status === 'Pending' || status === 'Processing') return 'amber';
  return 'slate';
};

const toApiStatus = (status: string) => status.toUpperCase().replace(/\s+/g, '_');

const getAutomatedStatusAfterApproval = (order: Order): Order['status'] =>
  order.deliveryMethod === 'Institute Collection' ? 'Ready for Collection' : 'Confirmed';

const getNextDeliveryStatus = (order: Order) => {
  if (order.deliveryMethod !== 'Home Delivery') return '';
  if (order.status === 'Confirmed') return 'Out for Delivery';
  if (order.status === 'Out for Delivery') return 'Delivered';
  return '';
};

export default function AdminOrders({ showToast, onOrderStatusChange }: Props) {
  const [ordersList, setOrdersList] = useState<Order[]>(sampleOrders);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>('Confirmed');
  const [paymentError, setPaymentError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState('');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  const loadOrders = async () => {
    try {
      const [data, paymentData] = await Promise.all([ordersAPI.getAll(), paymentsAPI.getAll()]);
      if (data && data.length > 0) {
        setOrdersList(data);
      }
      setPayments(paymentData || []);
    } catch (e) {
      console.log('Admin orders load notice:', e);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const paymentByOrderId = useMemo(() => {
    const map = new Map<string, Payment>();
    payments.forEach(payment => {
      if (payment.relatedOrderId) map.set(payment.relatedOrderId, payment);
    });
    return map;
  }, [payments]);

  const selectedPayment = selectedOrder ? paymentByOrderId.get(selectedOrder.id) : undefined;
  const selectedOrderIsDelivery = selectedOrder?.deliveryMethod === 'Home Delivery';

  const filtered = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();
    return [...ordersList]
      .filter(order => {
        const payment = paymentByOrderId.get(order.id);
        const searchable = [
          order.reference,
          order.address,
          order.phone,
          order.deliveryMethod,
          order.status,
          ...order.items.map(item => item.book.title),
        ].join(' ').toLowerCase();

        if (statusFilter && order.status !== statusFilter) return false;
        if (paymentFilter === 'missing' && payment) return false;
        if (paymentFilter && paymentFilter !== 'missing' && payment?.status !== paymentFilter) return false;
        if (deliveryFilter && order.deliveryMethod !== deliveryFilter) return false;
        if (normalizedSearch && !searchable.includes(normalizedSearch)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'highest') return b.total - a.total;
        if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [deliveryFilter, ordersList, paymentByOrderId, paymentFilter, search, sortBy, statusFilter]);

  const metrics = useMemo(() => {
    const pendingPayments = ordersList.filter(order => paymentByOrderId.get(order.id)?.status === 'Pending').length;
    const readyForPickup = ordersList.filter(order => order.status === 'Ready for Collection').length;
    const deliveryQueue = ordersList.filter(order => ['Confirmed', 'Out for Delivery'].includes(order.status) && order.deliveryMethod === 'Home Delivery').length;
    const paidRevenue = ordersList
      .filter(order => paymentByOrderId.get(order.id)?.status === 'Paid')
      .reduce((sum, order) => sum + order.total, 0);
    return { pendingPayments, readyForPickup, deliveryQueue, paidRevenue };
  }, [ordersList, paymentByOrderId]);

  const handlePaymentDecision = async (status: 'PAID' | 'REJECTED') => {
    if (!selectedPayment || !selectedOrder) return;
    setProcessingPayment(true);
    setPaymentError('');
    try {
      await paymentsAPI.updateStatus(selectedPayment.id, status);
      const paymentStatus = status === 'PAID' ? 'Paid' : 'Failed';
      const orderStatus = status === 'PAID' ? getAutomatedStatusAfterApproval(selectedOrder) : selectedOrder.status;

      setPayments(current => current.map(payment => payment.id === selectedPayment.id ? { ...payment, status: paymentStatus } : payment));
      setOrdersList(current => current.map(order => order.id === selectedOrder.id ? { ...order, status: orderStatus } : order));
      onOrderStatusChange?.(selectedOrder.reference, orderStatus);
      setSelectedOrder({ ...selectedOrder, status: orderStatus });
      await loadOrders();

      showToast(
        status === 'PAID'
          ? `Payment approved. Order moved to ${orderStatus} automatically and the student was notified.`
          : 'Payment rejected. The student can resubmit proof from the portal.',
        status === 'PAID' ? 'success' : 'info'
      );
    } catch (error: any) {
      setPaymentError(error?.message || 'Payment could not be updated.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const openOfficialReceipt = async () => {
    if (!selectedPayment) return;
    setPaymentError('');
    try {
      const response = await receiptsAPI.getByPaymentId(selectedPayment.id);
      setReceipt(response.data || null);
      setReceiptPayment(selectedPayment);
    } catch (error: any) {
      setPaymentError(error?.message || 'Official receipt could not be loaded.');
    }
  };

  const handleOrderStatusUpdate = async (order: Order, targetStatus: string) => {
    setProcessingOrderId(order.id);
    try {
      await ordersAPI.updateStatus(order.id, toApiStatus(targetStatus));
      setOrdersList(prev => prev.map(current => current.id === order.id ? { ...current, status: targetStatus as Order['status'] } : current));
      onOrderStatusChange?.(order.reference, targetStatus as Order['status']);
      if (selectedOrder?.id === order.id) setSelectedOrder({ ...selectedOrder, status: targetStatus as Order['status'] });
      showToast(`Order ${order.reference} updated to ${targetStatus}. Student notification sent.`, 'success');
    } catch (error: any) {
      showToast(error?.message || 'Order status could not be updated.', 'error');
    } finally {
      setProcessingOrderId('');
    }
  };

  const handleManualStatusUpdate = async () => {
    if (!selectedOrder) return;
    await handleOrderStatusUpdate(selectedOrder, newStatus);
    setSelectedOrder(null);
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPaymentFilter('');
    setDeliveryFilter('');
    setSortBy('newest');
  };

  return (
    <div className="fade-in-up space-y-6">
      <PageHeader
        title="Student Book Orders"
        subtitle={`Track and fulfill ${ordersList.length} bookstore orders with automated payment handoff`}
      />

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[1.4rem] border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E6BB8]">Fulfillment Workspace</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Review payment once, then let the workflow move.</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Approving a paid order automatically confirms delivery orders or marks pickup orders ready for collection, then sends a portal notification to the student.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <p className="font-bold">Automation active</p>
              <p className="text-xs text-blue-700">Payment approval updates order status and notification records.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment Review</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{metrics.pendingPayments}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Delivery Queue</p>
              <p className="mt-2 text-3xl font-black text-[#1E6BB8]">{metrics.deliveryQueue}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Ready Pickup</p>
              <p className="mt-2 text-3xl font-black text-teal-600">{metrics.readyForPickup}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Paid Value</p>
              <p className="mt-2 text-2xl font-black text-slate-950">Rs. {metrics.paidRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Quick Actions</p>
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => {
                setPaymentFilter('Pending');
                setStatusFilter('Pending');
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-left text-sm font-bold text-amber-800 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <span>Review pending payments</span>
              <span>{metrics.pendingPayments}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('Ready for Collection');
                setDeliveryFilter('Institute Collection');
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-left text-sm font-bold text-teal-800 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <span>Pickup counter queue</span>
              <span>{metrics.readyForPickup}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('Confirmed');
                setDeliveryFilter('Home Delivery');
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-left text-sm font-bold text-blue-800 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <span>Prepare deliveries</span>
              <span>{metrics.deliveryQueue}</span>
            </button>
          </div>
        </div>
      </section>

      <div className="rounded-[1.4rem] border border-slate-100 bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1fr_180px_180px_180px_150px_auto]">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              placeholder="Search order ref, student phone, book, destination..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-[#1E6BB8] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#1E6BB8]">
            <option value="">All statuses</option>
            {ORDER_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#1E6BB8]">
            <option value="">All payments</option>
            <option value="Pending">Needs approval</option>
            <option value="Paid">Paid</option>
            <option value="Failed">Rejected</option>
            <option value="missing">Not submitted</option>
          </select>
          <select value={deliveryFilter} onChange={e => setDeliveryFilter(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#1E6BB8]">
            <option value="">All delivery</option>
            <option value="Home Delivery">Home delivery</option>
            <option value="Institute Collection">Institute pickup</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#1E6BB8]">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest">Highest value</option>
          </select>
          <button type="button" onClick={resetFilters} className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Reset
          </button>
        </div>
      </div>

      <Card className="overflow-hidden rounded-[1.4rem] border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Order</th>
                <th className="px-5 py-4">Books</th>
                <th className="px-5 py-4">Fulfillment</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Workflow</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(order => {
                const payment = paymentByOrderId.get(order.id);
                const nextDeliveryStatus = getNextDeliveryStatus(order);
                const needsPaymentReview = payment?.status === 'Pending';
                const isWaitingForPayment = !payment && order.status === 'Pending';
                return (
                  <tr key={order.id} className="group align-top transition hover:bg-blue-50/30">
                    <td className="px-5 py-4">
                      <p className="font-mono text-sm font-black text-slate-950">{order.reference}</p>
                      <p className="mt-1 text-xs text-slate-500">{order.date}</p>
                      <p className="mt-3 inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                        Rs. {order.total.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">{order.items.length} title{order.items.length === 1 ? '' : 's'}</p>
                      <div className="mt-1 max-w-[260px] space-y-1">
                        {order.items.slice(0, 2).map(item => (
                          <p key={item.book.id} className="truncate text-xs text-slate-500">
                            {item.book.title} <span className="font-semibold text-slate-700">x{item.quantity}</span>
                          </p>
                        ))}
                        {order.items.length > 2 && <p className="text-xs font-semibold text-[#1E6BB8]">+{order.items.length - 2} more item</p>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">{order.deliveryMethod}</p>
                      <p className="mt-1 max-w-[280px] text-xs leading-5 text-slate-500">{order.address}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600">{order.phone}</p>
                    </td>
                    <td className="px-5 py-4">
                      {payment ? (
                        <div className="space-y-2">
                          <Badge color={paymentBadgeColor(payment.status)}>{payment.status}</Badge>
                          <p className="text-xs text-slate-500">{payment.method}</p>
                          <p className="font-mono text-[11px] text-slate-400">{payment.reference}</p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                          Awaiting student payment
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${statusAccent[order.status] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                        {order.status}
                      </div>
                      <p className="mt-2 max-w-[230px] text-xs leading-5 text-slate-500">
                        {needsPaymentReview && `Approve payment to auto-move to ${getAutomatedStatusAfterApproval(order)}.`}
                        {isWaitingForPayment && 'Student has not uploaded payment proof yet.'}
                        {!needsPaymentReview && !isWaitingForPayment && nextDeliveryStatus && `Next: ${nextDeliveryStatus}.`}
                        {!needsPaymentReview && !isWaitingForPayment && !nextDeliveryStatus && order.status === 'Ready for Collection' && 'Pickup counter can hand over after student arrives.'}
                        {order.status === 'Delivered' && 'Completed order.'}
                        {order.status === 'Cancelled' && 'Cancelled order.'}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {needsPaymentReview && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(order);
                              setNewStatus(order.status);
                            }}
                            className="rounded-xl bg-[#1E6BB8] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#155a9c] hover:shadow-md"
                          >
                            Review Payment
                          </button>
                        )}
                        {!needsPaymentReview && nextDeliveryStatus && (
                          <button
                            type="button"
                            disabled={processingOrderId === order.id}
                            onClick={() => handleOrderStatusUpdate(order, nextDeliveryStatus)}
                            className="rounded-xl bg-[#1E6BB8] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#155a9c] hover:shadow-md disabled:opacity-60"
                          >
                            {processingOrderId === order.id ? 'Updating...' : nextDeliveryStatus === 'Out for Delivery' ? 'Send to Courier' : 'Mark Delivered'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(order);
                            setNewStatus(order.status);
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-black text-slate-900">No matching orders</p>
            <p className="mt-2 text-sm text-slate-500">Clear filters or search another order reference, phone number, or delivery location.</p>
            <button type="button" onClick={resetFilters} className="mt-4 rounded-xl bg-[#1E6BB8] px-4 py-2 text-sm font-bold text-white">
              Clear filters
            </button>
          </div>
        )}
      </Card>

      {selectedOrder && (
        <Modal title={`Order Workflow (${selectedOrder.reference})`} onClose={() => setSelectedOrder(null)}>
          <div className="space-y-4">
            {paymentError && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{paymentError}</p>}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Customer</p>
                <p className="mt-2 font-bold text-slate-900">{selectedOrder.phone}</p>
                <p className="mt-1 text-sm text-slate-500">{selectedOrder.address}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Order Value</p>
                <p className="mt-2 text-2xl font-black text-[#1E6BB8]">Rs. {selectedOrder.total.toLocaleString()}</p>
                <p className="mt-1 text-sm text-slate-500">{selectedOrder.deliveryMethod}</p>
              </div>
            </div>

            {selectedPayment?.status === 'Pending' && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-black">Smart approval workflow</p>
                <p className="mt-1 text-blue-700">
                  Approving this payment will automatically set the order to {getAutomatedStatusAfterApproval(selectedOrder)} and create a student portal notification.
                </p>
              </div>
            )}

            <section className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Payment</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedPayment
                      ? `${selectedPayment.reference} · ${selectedPayment.method} · Rs. ${selectedPayment.amount.toLocaleString()}`
                      : 'No payment has been submitted for this order.'}
                  </p>
                </div>
                {selectedPayment && <Badge color={paymentBadgeColor(selectedPayment.status)}>{selectedPayment.status}</Badge>}
              </div>

              {selectedPayment?.transactionId && <p className="mt-3 text-xs text-slate-500">Transaction ID: {selectedPayment.transactionId}</p>}
              {selectedPayment?.paymentEvidence && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-bold text-slate-600">Student-submitted payment proof</p>
                  {/\.(png|jpe?g|webp|gif)$/i.test(selectedPayment.paymentEvidence) && (
                    <a href={selectedPayment.paymentEvidence} target="_blank" rel="noreferrer">
                      <img src={selectedPayment.paymentEvidence} alt="Uploaded payment proof" className="max-h-48 max-w-full rounded-xl border border-slate-200 object-contain" />
                    </a>
                  )}
                  <a href={selectedPayment.paymentEvidence} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-bold text-[#1E6BB8] hover:underline">
                    Open uploaded proof
                  </a>
                </div>
              )}

              {selectedPayment?.status === 'Paid' && (
                <button type="button" onClick={openOfficialReceipt} className="mt-4 rounded-xl bg-[#1E6BB8] px-4 py-2 text-sm font-bold text-white hover:bg-[#155a9c]">
                  View official receipt
                </button>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-black text-slate-900">Books in this order</h3>
              <div className="mt-3 space-y-2">
                {selectedOrder.items.map(item => (
                  <div key={item.book.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-semibold text-slate-800">{item.book.title}</span>
                    <span className="text-slate-500">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            </section>

            {selectedOrder.status === 'Pending' && selectedPayment?.status === 'Pending' && (
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => handlePaymentDecision('REJECTED')} disabled={processingPayment}>
                  {processingPayment ? 'Saving...' : 'Reject Payment'}
                </Button>
                <Button onClick={() => handlePaymentDecision('PAID')} disabled={processingPayment || (selectedPayment.method === 'Bank Transfer' && !selectedPayment.paymentEvidence)}>
                  {processingPayment ? 'Saving...' : 'Approve, Update & Notify'}
                </Button>
              </div>
            )}

            {selectedOrder.status !== 'Pending' && !selectedOrderIsDelivery && (
              <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
                <p className="font-black">Institute collection order</p>
                <p className="mt-1 text-teal-800">Keep this in the pickup queue until the student collects the books at the institute counter.</p>
              </div>
            )}

            {selectedOrder.status !== 'Pending' && selectedOrderIsDelivery && (
              <>
                <Select
                  label="Fulfillment Status"
                  value={newStatus}
                  onChange={setNewStatus}
                  options={[
                    { value: 'Confirmed', label: 'Confirmed and packed' },
                    { value: 'Out for Delivery', label: 'Handed to courier' },
                    { value: 'Delivered', label: 'Delivered and completed' },
                    { value: 'Cancelled', label: 'Cancelled' },
                  ]}
                />
                <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
                  <Button onClick={handleManualStatusUpdate} disabled={processingOrderId === selectedOrder.id}>
                    {processingOrderId === selectedOrder.id ? 'Updating...' : 'Update & Notify Student'}
                  </Button>
                </div>
              </>
            )}

            {selectedOrder.status === 'Pending' && !selectedPayment && (
              <div className="flex justify-end border-t border-slate-100 pt-4">
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {receiptPayment && <ReceiptModal receipt={receipt} payment={receiptPayment} onClose={() => { setReceiptPayment(null); setReceipt(null); }} />}
    </div>
  );
}
