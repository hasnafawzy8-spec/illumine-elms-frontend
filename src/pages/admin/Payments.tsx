import { useMemo, useState } from 'react';
import { Badge, Card, PageHeader, Modal } from '../../components/ui';
import { Payment, View } from '../../types';
import { paymentsAPI, receiptsAPI } from '../../services/api';
import type { ReceiptData } from '../../types';
import ReceiptModal from '../../components/ReceiptModal';

interface Props {
  navigate: (view: View) => void;
  payments: Payment[];
  onPaymentStatusChange?: (reference: string, status: Payment['status']) => void;
}

type PaymentKind = 'Course' | 'Book Order' | 'Installment' | 'Other';
type PaymentGroup = 'course' | 'book' | 'pending' | 'all';

const statusColors: Record<string, 'green' | 'amber' | 'red' | 'blue' | 'slate'> = {
  Paid: 'green',
  Pending: 'amber',
  Processing: 'blue',
  Failed: 'red',
  Refunded: 'slate',
};

const methodLabels: Record<string, { label: string; icon: JSX.Element }> = {
  'Bank Transfer': {
    label: 'Bank Transfer',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 10h18" />
        <path d="M5 10v8" />
        <path d="M9 10v8" />
        <path d="M15 10v8" />
        <path d="M19 10v8" />
        <path d="M4 18h16" />
        <path d="m12 3 8 5H4l8-5Z" />
      </svg>
    ),
  },
  Card: {
    label: 'Card',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
  'Online Payment': {
    label: 'Online Payment',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M11 18h2" />
      </svg>
    ),
  },
  Cash: {
    label: 'Cash',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
};

const getPaymentKind = (payment: Payment): PaymentKind => {
  if (payment.paymentPlan === 'INSTALLMENT' || Number(payment.totalInstallments || 1) > 1) return 'Installment';
  const text = `${payment.description} ${payment.relatedTo}`.toLowerCase();
  if (text.includes('installment') || text.includes('instalment')) return 'Installment';
  if (payment.relatedOrderId || text.includes('book order')) return 'Book Order';
  if (text.includes('course fee') || text.includes('course')) return 'Course';
  return 'Other';
};

const getKindStyles = (kind: PaymentKind) => {
  if (kind === 'Book Order') return 'border-teal-100 bg-teal-50 text-teal-700';
  if (kind === 'Installment') return 'border-amber-100 bg-amber-50 text-amber-700';
  if (kind === 'Course') return 'border-blue-100 bg-blue-50 text-blue-700';
  return 'border-slate-100 bg-slate-50 text-slate-600';
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'S';

export default function AdminPayments({ navigate: _navigate, payments, onPaymentStatusChange }: Props) {
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [activeGroup, setActiveGroup] = useState<PaymentGroup>('course');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('review-first');
  const [statusOverrides, setStatusOverrides] = useState<Record<string, Payment['status']>>({});
  const [selectedPayment, setSelectedPayment] = useState<(Payment & { student: string; kind: PaymentKind }) | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [decisionError, setDecisionError] = useState('');
  const [processingPaymentId, setProcessingPaymentId] = useState('');
  const [openingEvidenceId, setOpeningEvidenceId] = useState('');
  const [generatedReceipt, setGeneratedReceipt] = useState<ReceiptData | null>(null);

  const allPayments = useMemo(() => payments.map(payment => {
    const updated = {
      ...payment,
      student: payment.studentName || 'Student',
      status: statusOverrides[payment.reference] || payment.status,
      kind: getPaymentKind(payment),
    };
    return updated;
  }), [payments, statusOverrides]);

  const metrics = useMemo(() => {
    const paid = allPayments.filter(payment => payment.status === 'Paid');
    const pending = allPayments.filter(payment => payment.status === 'Pending');
    const failed = allPayments.filter(payment => payment.status === 'Failed');
    const coursePayments = allPayments.filter(payment => payment.kind === 'Course' || payment.kind === 'Installment');
    const bookPayments = allPayments.filter(payment => payment.kind === 'Book Order');
    const coursePaid = coursePayments.filter(payment => payment.status === 'Paid').reduce((sum, payment) => sum + payment.amount, 0);
    const bookPaid = bookPayments.filter(payment => payment.status === 'Paid').reduce((sum, payment) => sum + payment.amount, 0);
    return {
      total: allPayments.length,
      paid: paid.length,
      pending: pending.length,
      failed: failed.length,
      paidRevenue: paid.reduce((sum, payment) => sum + payment.amount, 0),
      pendingValue: pending.reduce((sum, payment) => sum + payment.amount, 0),
      coursePaid,
      bookPaid,
      courseCount: coursePayments.length,
      bookCount: bookPayments.length,
      coursePending: coursePayments.filter(payment => payment.status === 'Pending').length,
      bookPending: bookPayments.filter(payment => payment.status === 'Pending').length,
      courseTotal: coursePayments.reduce((sum, payment) => sum + payment.amount, 0),
      bookTotal: bookPayments.reduce((sum, payment) => sum + payment.amount, 0),
    };
  }, [allPayments]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();
    return [...allPayments]
      .filter(payment => {
        const searchable = [
          payment.reference,
          payment.student,
          payment.description,
          payment.relatedTo,
          payment.method,
          payment.status,
          payment.kind,
          payment.studentId,
          payment.transactionId,
          payment.relatedOrderId,
          payment.paymentEvidence,
          String(payment.amount),
          payment.amount.toLocaleString(),
          payment.id,
        ].join(' ').toLowerCase();
        if (statusFilter && payment.status !== statusFilter) return false;
        if (methodFilter && payment.method !== methodFilter) return false;
        if (activeGroup === 'course' && !['Course', 'Installment'].includes(payment.kind)) return false;
        if (activeGroup === 'book' && payment.kind !== 'Book Order') return false;
        if (activeGroup === 'pending' && payment.status !== 'Pending') return false;
        if (normalizedSearch && !searchable.includes(normalizedSearch)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'highest') return b.amount - a.amount;
        if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'review-first') {
          const reviewScore = (payment: Payment) => payment.status === 'Pending' ? 0 : payment.status === 'Processing' ? 1 : 2;
          return reviewScore(a) - reviewScore(b) || new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [activeGroup, allPayments, methodFilter, search, sortBy, statusFilter]);

  const reviewQueue = useMemo(() => filtered.filter(payment => payment.status === 'Pending'), [filtered]);

  const updatePayment = async (payment: Payment, status: 'PAID' | 'REJECTED') => {
    if (!payment.id) return;
    setProcessingPaymentId(payment.id);
    setDecisionError('');
    try {
      await paymentsAPI.updateStatus(payment.id, status);
      const displayStatus = status === 'PAID' ? 'Paid' : 'Failed';
      setStatusOverrides(previous => ({ ...previous, [payment.reference]: displayStatus }));
      setSelectedPayment(current => current?.id === payment.id ? { ...current, status: displayStatus } : current);
      onPaymentStatusChange?.(payment.reference, displayStatus);
    } catch (error: any) {
      const message = error?.message || 'Payment status could not be updated.';
      setDecisionError(message);
    } finally {
      setProcessingPaymentId('');
    }
  };

  const openGeneratedReceipt = async () => {
    if (!selectedPayment?.id) return;
    setDecisionError('');
    try {
      const response = await receiptsAPI.getByPaymentId(selectedPayment.id);
      setGeneratedReceipt(response.data || null);
      setShowReceiptModal(true);
    } catch (error: any) {
      setDecisionError(error?.message || 'Generated receipt could not be loaded.');
    }
  };

  const openUploadedEvidence = async () => {
    if (!selectedPayment?.id) return;

    setDecisionError('');
    setOpeningEvidenceId(selectedPayment.id);
    const proofWindow = window.open('about:blank', '_blank');
    if (proofWindow) {
      proofWindow.opener = null;
      proofWindow.document.title = 'Opening payment proof';
      proofWindow.document.body.innerHTML = '<p style="font-family: Arial, sans-serif; padding: 24px; color: #1f2937;">Opening uploaded payment proof...</p>';
    }

    try {
      const blob = await paymentsAPI.getEvidence(selectedPayment.id, selectedPayment.paymentEvidence);
      const proofUrl = URL.createObjectURL(blob);
      if (proofWindow) {
        proofWindow.location.href = proofUrl;
      } else {
        window.open(proofUrl, '_blank', 'noopener,noreferrer');
      }
      window.setTimeout(() => URL.revokeObjectURL(proofUrl), 60000);
    } catch (error: any) {
      proofWindow?.close();
      setDecisionError(error?.message || 'Uploaded payment proof could not be opened.');
    } finally {
      setOpeningEvidenceId('');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setMethodFilter('');
    setSortBy('review-first');
  };

  const sectionTitle = activeGroup === 'course'
    ? 'Course Payments'
    : activeGroup === 'book'
      ? 'Book Payments'
      : activeGroup === 'pending'
        ? 'Pending Approval'
        : 'All Payment Records';

  const sectionSubtitle = activeGroup === 'course'
    ? 'Course fees and monthly installment payments only'
    : activeGroup === 'book'
      ? 'Bookstore orders and learning material payments only'
      : activeGroup === 'pending'
        ? 'Payments waiting for admin verification'
        : 'Full payment ledger across all student transactions';

  return (
    <div className="fade-in-up space-y-4">
      <PageHeader title="Payment Operations" subtitle="Review course fees, bookstore payments, and receipts in one clear finance workspace" />

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr_0.7fr]">
        <PaymentSectionCard
          active={activeGroup === 'course'}
          title="Course Payments"
          subtitle="Course fees and installment payments"
          records={metrics.courseCount}
          pending={metrics.coursePending}
          total={`Rs. ${metrics.courseTotal.toLocaleString()}`}
          verified={`Rs. ${metrics.coursePaid.toLocaleString()} verified`}
          tone="blue"
          onClick={() => {
            setActiveGroup('course');
            setStatusFilter('');
          }}
        />
        <PaymentSectionCard
          active={activeGroup === 'book'}
          title="Book Payments"
          subtitle="Bookstore orders and learning materials"
          records={metrics.bookCount}
          pending={metrics.bookPending}
          total={`Rs. ${metrics.bookTotal.toLocaleString()}`}
          verified={`Rs. ${metrics.bookPaid.toLocaleString()} verified`}
          tone="teal"
          onClick={() => {
            setActiveGroup('book');
            setStatusFilter('');
          }}
        />

        <div className="rounded-[1.4rem] border border-amber-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">Needs Approval</p>
              <p className="mt-1 text-sm text-slate-500">Unverified receipts</p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-700">{metrics.pending}</span>
          </div>
          <p className="mt-4 text-3xl font-black text-slate-950">Rs. {metrics.pendingValue.toLocaleString()}</p>
          <button
            type="button"
            onClick={() => {
              setActiveGroup('pending');
              setStatusFilter('');
            }}
            className={`mt-5 h-11 w-full rounded-2xl text-sm font-black transition ${
              activeGroup === 'pending'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Open Pending Queue
          </button>
        </div>
      </section>

      {reviewQueue.length > 0 && activeGroup !== 'pending' && (
        <section className="rounded-[1.4rem] border border-amber-100 bg-amber-50/70 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black text-amber-900">{reviewQueue.length} payment{reviewQueue.length === 1 ? '' : 's'} need approval</p>
              <p className="text-xs text-amber-700">Open the pending queue or approve directly from the selected section.</p>
            </div>
            <button type="button" onClick={() => setActiveGroup('pending')} className="h-10 rounded-xl bg-amber-500 px-4 text-sm font-black text-white shadow-sm hover:bg-amber-600">
              Review Pending Payments
            </button>
          </div>
        </section>
      )}

      <div className="rounded-[1.4rem] border border-slate-100 bg-white p-2 shadow-sm">
        <div className="grid gap-2 md:grid-cols-4">
          {[
            { id: 'course' as PaymentGroup, label: 'Course Payments', count: metrics.courseCount },
            { id: 'book' as PaymentGroup, label: 'Book Payments', count: metrics.bookCount },
            { id: 'pending' as PaymentGroup, label: 'Pending Approval', count: metrics.pending },
            { id: 'all' as PaymentGroup, label: 'All Records', count: metrics.total },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveGroup(tab.id);
                setStatusFilter('');
              }}
              className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-black transition ${
                activeGroup === tab.id
                  ? 'bg-[#1E6BB8] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${activeGroup === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.4rem] border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1E6BB8]">Selected Section</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{sectionTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{sectionSubtitle}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 xl:w-[520px]">
            <CompactStat label="Records" value={filtered.length} />
            <CompactStat label="Pending" value={filtered.filter(payment => payment.status === 'Pending').length} tone="amber" />
            <CompactStat label="Value" value={`Rs. ${filtered.reduce((sum, payment) => sum + payment.amount, 0).toLocaleString()}`} />
          </div>
        </div>
        <div className="grid gap-3 xl:grid-cols-[1fr_170px_170px_150px_auto]">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              placeholder="Search student, ID, payment ref, transaction, course, order..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-[#1E6BB8] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#1E6BB8]">
            <option value="">All statuses</option>
            {['Paid', 'Pending', 'Processing', 'Failed', 'Refunded'].map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#1E6BB8]">
            <option value="">All methods</option>
            {['Bank Transfer', 'Card', 'Online Payment', 'Cash'].map(method => <option key={method} value={method}>{method}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#1E6BB8]">
            <option value="review-first">Review first</option>
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
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1E6BB8]">{sectionTitle}</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{sectionTitle} Ledger</h2>
            <p className="mt-1 text-sm text-slate-500">{sectionSubtitle}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Showing</p>
            <p className="text-2xl font-black text-slate-950">{filtered.length}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Payment</th>
                <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Student</th>
                <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Purpose</th>
                <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Method</th>
                <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-500">Amount</th>
                <th className="px-5 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(payment => {
                const method = methodLabels[payment.method] || methodLabels.Card;
                const needsReview = payment.status === 'Pending';
                return (
                  <tr key={payment.id || payment.reference} className="align-top transition hover:bg-blue-50/30">
                    <td className="px-5 py-4">
                      <p className="font-mono text-sm font-black text-slate-950">{payment.reference}</p>
                      <p className="mt-1 text-xs text-slate-500">{payment.date}</p>
                      <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${getKindStyles(payment.kind)}`}>
                        {payment.kind}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1E6BB8] text-xs font-black text-white">
                          {getInitials(payment.student)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-800">{payment.student}</p>
                          {payment.studentId && <p className="font-mono text-xs text-slate-400">{payment.studentId}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-[360px] font-bold leading-5 text-slate-800">{payment.description}</p>
                      <p className="mt-1 max-w-[360px] truncate text-xs text-slate-500">{payment.relatedTo}</p>
                      {payment.paymentPlan === 'INSTALLMENT' && (
                        <p className="mt-1 text-xs font-bold text-amber-700">
                          Installment {payment.installmentNumber || 1} of {payment.totalInstallments || 3} · Remaining Rs. {(payment.remainingAmount || 0).toLocaleString()}
                        </p>
                      )}
                      {payment.relatedOrderId && <p className="mt-1 text-xs font-semibold text-teal-600">Linked book order</p>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-slate-700">
                        {method.icon}
                        <span className="font-semibold">{method.label}</span>
                      </div>
                      {payment.paymentEvidence && <p className="mt-2 text-xs font-semibold text-[#1E6BB8]">Proof uploaded</p>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="text-lg font-black text-slate-950">Rs. {payment.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Badge color={statusColors[payment.status] || 'slate'}>{payment.status}</Badge>
                      {needsReview && <p className="mt-2 text-xs font-semibold text-amber-600">Needs admin approval</p>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {needsReview && (
                          <>
                            <button
                              type="button"
                              onClick={() => updatePayment(payment, 'REJECTED')}
                              disabled={processingPaymentId === payment.id}
                              className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => updatePayment(payment, 'PAID')}
                              disabled={processingPaymentId === payment.id || (payment.method === 'Bank Transfer' && !payment.paymentEvidence)}
                              className="rounded-xl bg-[#1E6BB8] px-3 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#155a9c] hover:shadow-md disabled:opacity-60"
                            >
                              {processingPaymentId === payment.id ? 'Saving...' : 'Approve'}
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setDecisionError('');
                            setSelectedPayment(payment);
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
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
            <p className="text-lg font-black text-slate-900">No payment records found</p>
            <p className="mt-2 text-sm text-slate-500">Clear filters or search another student, reference, course, or order.</p>
            <button type="button" onClick={resetFilters} className="mt-4 rounded-xl bg-[#1E6BB8] px-4 py-2 text-sm font-bold text-white">
              Clear filters
            </button>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>Showing {filtered.length} of {allPayments.length} records</span>
            <span>{metrics.pending} waiting for approval · Rs. {metrics.pendingValue.toLocaleString()} pending value</span>
          </div>
        )}
      </Card>

      {selectedPayment && (
        <Modal title={`Payment Review (${selectedPayment.reference})`} onClose={() => setSelectedPayment(null)} size="md">
          <div className="space-y-4">
            {decisionError && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{decisionError}</p>}

            <div className="grid gap-3 md:grid-cols-2">
              <Detail label="Student" value={selectedPayment.student} />
              <Detail label="Student ID" value={selectedPayment.studentId || 'Not linked'} mono />
              <Detail label="Reference" value={selectedPayment.reference} mono />
              <Detail label="Purpose" value={selectedPayment.description} />
              <Detail label="Related Record" value={selectedPayment.relatedTo} />
              <Detail label="Amount" value={`Rs. ${selectedPayment.amount.toLocaleString()}`} strong />
              <Detail label="Method" value={selectedPayment.method} />
              <Detail label="Date" value={selectedPayment.date} />
              {selectedPayment.paymentPlan === 'INSTALLMENT' && (
                <>
                  <Detail label="Payment Plan" value={`Installment ${selectedPayment.installmentNumber || 1} of ${selectedPayment.totalInstallments || 3}`} />
                  <Detail label="Remaining Balance" value={`Rs. ${(selectedPayment.remainingAmount || 0).toLocaleString()}`} strong />
                  <Detail label="Total Payable" value={`Rs. ${(selectedPayment.totalPayable || selectedPayment.amount).toLocaleString()}`} />
                  <Detail label="Next Due Date" value={selectedPayment.nextDueDate ? new Date(selectedPayment.nextDueDate).toLocaleDateString('en-LK') : 'After approval'} />
                </>
              )}
              <div>
                <p className="mb-1 text-xs text-slate-400">Status</p>
                <Badge color={statusColors[selectedPayment.status] || 'slate'}>{selectedPayment.status}</Badge>
              </div>
            </div>

            {selectedPayment.paymentEvidence ? (
              <div className="border-t border-slate-100 pt-4">
                <p className="mb-2 text-sm font-black text-slate-800">Student-submitted payment proof</p>
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Receipt file attached</p>
                    <p className="mt-1 break-all text-xs text-slate-500">{selectedPayment.paymentEvidence.split('/').pop()}</p>
                  </div>
                  <button
                    type="button"
                    onClick={openUploadedEvidence}
                    disabled={openingEvidenceId === selectedPayment.id}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#1E6BB8] shadow-sm ring-1 ring-slate-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {openingEvidenceId === selectedPayment.id ? 'Opening...' : 'View Uploaded Proof'}
                  </button>
                </div>
              </div>
            ) : (
              selectedPayment.status === 'Pending' && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Payment proof is not attached yet. Ask the student to upload a receipt before approving a bank transfer.
                </div>
              )
            )}

            <div className="border-t border-slate-100 pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-slate-800">Official receipt</p>
                  <p className="text-xs text-slate-500">Available after payment approval</p>
                </div>
                {selectedPayment.status === 'Paid' && (
                  <button onClick={openGeneratedReceipt} className="rounded-xl bg-[#1E6BB8] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#155a9c]">
                    View Receipt
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              {selectedPayment.status === 'Pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => updatePayment(selectedPayment, 'REJECTED')}
                    disabled={processingPaymentId === selectedPayment.id}
                    className="rounded-xl border border-red-200 px-4 py-2 text-sm font-black text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {processingPaymentId === selectedPayment.id ? 'Saving...' : 'Reject Payment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePayment(selectedPayment, 'PAID')}
                    disabled={processingPaymentId === selectedPayment.id || (selectedPayment.method === 'Bank Transfer' && !selectedPayment.paymentEvidence)}
                    className="rounded-xl bg-[#1E6BB8] px-4 py-2 text-sm font-black text-white hover:bg-[#155a9c] disabled:opacity-50"
                  >
                    {processingPaymentId === selectedPayment.id ? 'Saving...' : 'Approve, Receipt & Notify'}
                  </button>
                </>
              )}
              <button onClick={() => setSelectedPayment(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showReceiptModal && selectedPayment && (
        <ReceiptModal
          receipt={generatedReceipt}
          payment={selectedPayment}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
}

function MetricCard({ label, value, helper, tone }: { label: string; value: string | number; helper: string; tone: 'blue' | 'green' | 'amber' | 'teal' }) {
  const colors = {
    blue: 'bg-blue-50 text-[#1E6BB8] border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
  };

  return (
    <div className={`rounded-2xl border p-4 ${colors[tone]}`}>
      <p className="text-xs font-black uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-semibold opacity-75">{helper}</p>
    </div>
  );
}

function PaymentSectionCard({
  active,
  title,
  subtitle,
  records,
  pending,
  total,
  verified,
  tone,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  records: number;
  pending: number;
  total: string;
  verified: string;
  tone: 'blue' | 'teal';
  onClick: () => void;
}) {
  const palette = tone === 'blue'
    ? {
        border: active ? 'border-[#1E6BB8]' : 'border-blue-100',
        bg: active ? 'bg-blue-50' : 'bg-white',
        text: 'text-[#1E6BB8]',
        button: active ? 'bg-[#1E6BB8] text-white' : 'bg-blue-50 text-[#1E6BB8] border border-blue-100',
      }
    : {
        border: active ? 'border-teal-500' : 'border-teal-100',
        bg: active ? 'bg-teal-50' : 'bg-white',
        text: 'text-teal-700',
        button: active ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700 border border-teal-100',
      };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.4rem] border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${palette.border} ${palette.bg}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.18em] ${palette.text}`}>{title}</p>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${active ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-500'}`}>
          {records} records
        </span>
      </div>
      <p className="mt-5 text-3xl font-black text-slate-950">{total}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/70 bg-white/75 p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending</p>
          <p className="mt-1 text-xl font-black text-slate-900">{pending}</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/75 p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified</p>
          <p className="mt-1 text-sm font-black text-slate-900">{verified}</p>
        </div>
      </div>
      <span className={`mt-5 inline-flex h-10 items-center rounded-2xl px-4 text-sm font-black transition ${palette.button}`}>
        {active ? 'Currently Viewing' : `Open ${title}`}
      </span>
    </button>
  );
}

function CompactStat({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'slate' | 'amber' }) {
  return (
    <div className="rounded-2xl border border-white bg-white/85 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 truncate text-lg font-black ${tone === 'amber' ? 'text-amber-600' : 'text-slate-950'}`}>{value}</p>
    </div>
  );
}

function Detail({ label, value, mono = false, strong = false }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`${mono ? 'font-mono' : ''} ${strong ? 'text-lg font-black text-[#1E6BB8]' : 'font-bold text-slate-800'} break-words`}>
        {value}
      </p>
    </div>
  );
}
