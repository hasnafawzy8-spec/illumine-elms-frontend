import { useEffect, useState } from 'react';
import { Badge, Card, PageHeader, EmptyState } from '../../components/ui';
import { Payment, View, ReceiptData } from '../../types';
import ReceiptModal from '../../components/ReceiptModal';
import { paymentsAPI, receiptsAPI } from '../../services/api';
import { formatColomboDisplayDate } from '../../utils/dateFormatter';

interface Props {
  navigate: (view: View) => void;
  payments: Payment[];
}

const statusColors: Record<string, 'green' | 'amber' | 'red' | 'blue' | 'slate'> = {
  Paid: 'green', Pending: 'amber', Processing: 'blue', Failed: 'red', Refunded: 'slate',
};

const methodIcons: Record<string, string> = {
  'Bank Transfer': 'BT', 'Card': 'CD', 'Online Payment': 'OP', 'Cash': 'CA',
};

export default function PaymentHistory({ navigate: _navigate, payments }: Props) {
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'course' | 'book' | 'installment'>('all');
  const [search, setSearch] = useState('');
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [latestPayments, setLatestPayments] = useState(payments);

  useEffect(() => {
    let active = true;
    const refreshPayments = async () => {
      try {
        const currentPayments = await paymentsAPI.getMy();
        if (active) setLatestPayments(currentPayments);
      } catch {
        // Keep the last successfully loaded payment history visible.
      }
    };

    refreshPayments();
    const intervalId = window.setInterval(refreshPayments, 15000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const openReceipt = async (payment: Payment) => {
    setSelectedReceiptPayment(payment);
    setReceiptData(null);
    try {
      const res = await receiptsAPI.getByPaymentId(payment.id);
      if (res?.data) {
        setReceiptData(res.data);
      }
      const currentPayments = await paymentsAPI.getMy();
      setLatestPayments(currentPayments);
    } catch {
      // Fallback if receipt endpoint fails or returns null
      setReceiptData(null);
    }
  };

  const allPayments = latestPayments;

  const isInstallmentPayment = (payment: Payment) =>
    payment.paymentPlan === 'INSTALLMENT' ||
    Number(payment.totalInstallments || 1) > 1 ||
    Number(payment.remainingAmount || 0) > 0;

  const getPaymentType = (payment: Payment) => {
    if (isInstallmentPayment(payment)) return 'installment';
    if (/book order/i.test(payment.description)) return 'book';
    return 'course';
  };

  const filtered = allPayments.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (typeFilter !== 'all' && getPaymentType(p) !== typeFilter) return false;
    if (search) {
      const haystack = [
        p.reference,
        p.description,
        p.relatedTo,
        p.studentId,
        p.transactionId,
      ].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const totalPaid = allPayments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = allPayments.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
  const installmentBalance = allPayments.reduce((sum, payment) => sum + Number(payment.remainingAmount || 0), 0);
  const paidCount = allPayments.filter(p => p.status === 'Paid').length;
  const filters = [
    { value: 'all', label: 'All records', count: allPayments.length },
    { value: 'course', label: 'Course payments', count: allPayments.filter(p => getPaymentType(p) === 'course').length },
    { value: 'installment', label: 'Installments', count: allPayments.filter(p => getPaymentType(p) === 'installment').length },
    { value: 'book', label: 'Book payments', count: allPayments.filter(p => getPaymentType(p) === 'book').length },
  ] as const;

  return (
    <div className="fade-in-up space-y-6">
      <PageHeader
        title="Payment History"
        subtitle="Track and review all your course enrollment and book purchase transactions"
      />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Paid total', value: `Rs. ${totalPaid.toLocaleString()}`, detail: `${paidCount} verified payments` },
          { label: 'Installment balance', value: `Rs. ${installmentBalance.toLocaleString()}`, detail: 'Remaining course payments' },
          { label: 'Pending review', value: `Rs. ${totalPending.toLocaleString()}`, detail: `${allPayments.filter(p => p.status === 'Pending').length} waiting` },
          { label: 'All records', value: allPayments.length, detail: 'Course and book payments' },
        ].map(item => (
          <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
            <p className="mt-2 font-display text-2xl font-extrabold text-slate-950">{item.value}</p>
            <p className="mt-1 text-sm font-medium text-slate-500">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {filters.map(filter => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setTypeFilter(filter.value)}
              className={`rounded-2xl px-4 py-2 text-sm font-extrabold transition ${
                typeFilter === filter.value
                  ? 'bg-[#1E6BB8] text-white shadow-md shadow-blue-200'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {filter.label} <span className={typeFilter === filter.value ? 'text-blue-100' : 'text-slate-400'}>{filter.count}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">⌕</span>
            <input
              placeholder="Search reference, course, order, transaction..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#1E6BB8] focus:bg-white"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#1E6BB8]">
            <option value="">All Statuses</option>
            {['Paid', 'Pending', 'Processing', 'Failed', 'Refunded'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Payment list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<span className="text-2xl">💳</span>}
          title="No payment records available"
          description="Your payment history will appear here after you enroll in a course or purchase a book."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(payment => {
            const isInstallment = isInstallmentPayment(payment);
            const paymentType = getPaymentType(payment);
            const installmentNumber = payment.installmentNumber || 1;
            const totalInstallments = payment.totalInstallments || 3;

            return (
              <Card key={payment.id} className="overflow-hidden p-0">
                <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-blue-50 text-sm font-black text-[#1E6BB8]">
                      {methodIcons[payment.method] || '💳'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-black text-slate-900">{payment.reference}</span>
                        <Badge color={statusColors[payment.status] || 'slate'}>{payment.status}</Badge>
                        {isInstallment && <Badge color="amber">Installment</Badge>}
                        {!isInstallment && <Badge color={paymentType === 'book' ? 'teal' : 'blue'}>{paymentType === 'book' ? 'Book' : 'Course'}</Badge>}
                      </div>
                      <p className="mt-1 text-base font-bold text-slate-800">{payment.description}</p>
                      <div className="mt-3 grid gap-2 text-sm text-slate-500 sm:grid-cols-3">
                        <span className="rounded-xl bg-slate-50 px-3 py-2">Date: <strong className="text-slate-700">{payment.date}</strong></span>
                        <span className="rounded-xl bg-slate-50 px-3 py-2">Method: <strong className="text-slate-700">{payment.method}</strong></span>
                        <span className="rounded-xl bg-slate-50 px-3 py-2 truncate">For: <strong className="text-slate-700">{payment.relatedTo}</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 lg:block lg:border-t-0 lg:pt-0 lg:text-right">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Paid amount</p>
                      <p className="mt-1 font-display text-2xl font-extrabold text-slate-950">Rs. {payment.amount.toLocaleString()}</p>
                    </div>
                    {payment.status === 'Paid' && (
                      <button
                        onClick={() => openReceipt(payment)}
                        className="mt-0 inline-flex rounded-xl bg-green-50 px-3 py-2 text-xs font-extrabold text-green-700 transition-colors hover:bg-green-100 lg:mt-3"
                      >
                        Receipt
                      </button>
                    )}
                  </div>
                </div>

                {isInstallment && (
                  <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Plan</p>
                        <p className="mt-1 font-bold text-slate-900">Installment {installmentNumber} of {totalInstallments}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Remaining</p>
                        <p className="mt-1 font-bold text-amber-700">Rs. {Number(payment.remainingAmount || 0).toLocaleString()}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Next due</p>
                        <p className="mt-1 font-bold text-slate-900">{payment.nextDueDate ? formatColomboDisplayDate(payment.nextDueDate) : 'After approval'}</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[#1E6BB8]"
                        style={{ width: `${Math.min(100, Math.round((installmentNumber / totalInstallments) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}

                {payment.status === 'Pending' && (
                  <div className="border-t border-amber-100 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800">
                    Payment is pending institute verification.
                  </div>
                )}
                {payment.status === 'Failed' && (
                  <div className="border-t border-red-100 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">
                    Payment was rejected. Please contact the institute office or submit a valid payment.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {selectedReceiptPayment && (
        <ReceiptModal
          receipt={receiptData}
          payment={selectedReceiptPayment}
          onClose={() => {
            setSelectedReceiptPayment(null);
            setReceiptData(null);
          }}
        />
      )}
    </div>
  );
}
