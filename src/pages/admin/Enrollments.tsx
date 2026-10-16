import { useState, useEffect, useCallback } from 'react';
import { Badge, Card, PageHeader, EmptyState, Modal } from '../../components/ui';
import { enrollmentsAPI, paymentsAPI } from '../../services/api';
import { View } from '../../types';
import { formatColomboDisplayDate } from '../../utils/dateFormatter';

interface Props {
  navigate: (view: View) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export default function AdminEnrollments({ showToast }: Props) {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('PENDING');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [review, setReview] = useState<{ enrollment: any; payment: any } | null>(null);

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      const [data, paymentData] = await Promise.all([
        enrollmentsAPI.getAll(),
        paymentsAPI.getAll(),
      ]);
      setEnrollments(data);
      setPayments(paymentData);
    } catch (e) {
      console.error('Failed to fetch enrollments:', e);
      showToast('Failed to load enrollments.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleApprove = async (id: string, studentName: string) => {
    if (!review?.payment?.id || review.payment.status !== 'Pending') return;
    setProcessingId(id);
    try {
      await paymentsAPI.updateStatus(review.payment.id, 'PAID');
      setEnrollments(prev =>
        prev.map(e => (e._id === id || e.id === id) ? { ...e, status: 'APPROVED' } : e)
      );
      setPayments(prev => prev.map(payment => payment.id === review.payment.id ? { ...payment, status: 'Paid' } : payment));
      setReview(null);
      showToast(`✅ Enrollment approved for ${studentName}.`, 'success');
      fetchEnrollments();
    } catch (e: any) {
      showToast(e.message || 'Failed to approve enrollment.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, studentName: string) => {
    if (!window.confirm(`Reject enrollment for ${studentName}? This cannot be undone.`)) return;
    if (!review?.payment?.id || review.payment.status !== 'Pending') return;
    setProcessingId(id);
    try {
      await paymentsAPI.updateStatus(review.payment.id, 'REJECTED');
      await enrollmentsAPI.updateStatus(id, 'REJECTED');
      setEnrollments(prev =>
        prev.map(e => (e._id === id || e.id === id) ? { ...e, status: 'REJECTED' } : e)
      );
      setPayments(prev => prev.map(payment => payment.id === review.payment.id ? { ...payment, status: 'Failed' } : payment));
      setReview(null);
      showToast(`Enrollment rejected for ${studentName}.`, 'info');
    } catch (e: any) {
      showToast(e.message || 'Failed to reject enrollment.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = filter === 'ALL' ? enrollments : enrollments.filter(e => e.status === filter);

  const counts = {
    ALL: enrollments.length,
    PENDING: enrollments.filter(e => e.status === 'PENDING').length,
    APPROVED: enrollments.filter(e => e.status === 'APPROVED').length,
    REJECTED: enrollments.filter(e => e.status === 'REJECTED').length,
    CANCELLED: enrollments.filter(e => e.status === 'CANCELLED').length,
  };

  const getStudentName = (e: any) => {
    if (e.student?.user?.firstName) {
      return `${e.student.user.firstName} ${e.student.user.lastName || ''}`.trim();
    }
    if (e.student?.firstName) {
      return `${e.student.firstName} ${e.student.lastName || ''}`.trim();
    }
    return 'Unknown Student';
  };

  const getCourseName = (e: any) => {
    if (typeof e.course === 'object') return e.course?.title || e.course?.name || 'Unknown Course';
    return 'Unknown Course';
  };

  const getClassName = (e: any) => {
    if (typeof e.class === 'object') return e.class?.className || 'Unknown Class';
    return '—';
  };

  const getEnrollmentPayment = (enrollment: any) => {
    const studentId = typeof enrollment.student === 'object' ? enrollment.student?._id : enrollment.student;
    const courseId = typeof enrollment.course === 'object' ? enrollment.course?._id : enrollment.course;
    return payments.find(payment => payment.studentId === studentId && payment.courseId === courseId && payment.status === 'Pending')
      || payments.find(payment => payment.studentId === studentId && payment.courseId === courseId);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return formatColomboDisplayDate(dateStr);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':   return <Badge color="amber">⏳ Pending</Badge>;
      case 'APPROVED':  return <Badge color="green">✓ Approved</Badge>;
      case 'REJECTED':  return <Badge color="red">✕ Rejected</Badge>;
      case 'CANCELLED': return <Badge color="slate">Cancelled</Badge>;
      default:          return <Badge color="slate">{status}</Badge>;
    }
  };

  const TABS: { key: StatusFilter; label: string }[] = [
    { key: 'PENDING',   label: 'Pending' },
    { key: 'ALL',       label: 'All' },
    { key: 'APPROVED',  label: 'Approved' },
    { key: 'REJECTED',  label: 'Rejected' },
  ];

  return (
    <div className="fade-in-up space-y-6">
      <PageHeader
        title="Enrollment Requests"
        subtitle={`${counts.PENDING} pending approval · ${enrollments.length} total`}
        action={
          <button
            onClick={fetchEnrollments}
            className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium flex items-center gap-2"
          >
            🔄 Refresh
          </button>
        }
      />

      {/* Pending Alert Banner */}
      {counts.PENDING > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">
              {counts.PENDING} enrollment{counts.PENDING > 1 ? 's' : ''} awaiting your approval
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Students cannot access course content until you approve their enrollment.
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white rounded-2xl border border-slate-100 p-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              filter === tab.key
                ? 'bg-[#1E6BB8] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              filter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#1E6BB8] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500">Loading enrollments…</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<span className="text-3xl">📋</span>}
          title={filter === 'PENDING' ? 'No pending enrollments' : 'No enrollments found'}
          description={
            filter === 'PENDING'
              ? 'All enrollment requests have been reviewed.'
              : 'No enrollments match this filter.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(enrollment => {
            const id = enrollment._id || enrollment.id;
            const studentName = getStudentName(enrollment);
            const courseName = getCourseName(enrollment);
            const className = getClassName(enrollment);
            const isPending = enrollment.status === 'PENDING';
            const isProcessing = processingId === id;
            const payment = getEnrollmentPayment(enrollment);

            return (
              <Card key={id} className={`overflow-hidden transition-all ${isPending ? 'border-l-4 border-l-amber-400' : ''}`}>
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Student Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#1E6BB8]/10 flex items-center justify-center text-[#1E6BB8] font-bold text-sm flex-shrink-0">
                        {studentName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{studentName}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {enrollment.student?.user?.email || enrollment.student?.email || ''}
                        </p>
                      </div>
                    </div>

                    {/* Course & Class */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700 text-sm truncate">📚 {courseName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">🎓 Class: {className}</p>
                    </div>

                    {/* Date & Status */}
                    <div className="text-right sm:text-left flex-shrink-0">
                      <div className="mb-1">{statusBadge(enrollment.status)}</div>
                      <p className="text-xs text-slate-400">
                        {formatDate(enrollment.enrollmentDate || enrollment.createdAt)}
                      </p>
                      {enrollment.confirmedBy?.firstName && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          by {enrollment.confirmedBy.firstName} {enrollment.confirmedBy.lastName}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {isPending && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setReview({ enrollment, payment })}
                          disabled={isProcessing}
                          className="px-4 py-2 text-xs rounded-xl bg-[#1E6BB8] text-white font-semibold hover:bg-[#155a9c] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                          Review Payment
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {review && (
        <Modal title="Review Student Payment" onClose={() => setReview(null)} size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <ReviewDetail label="Student" value={getStudentName(review.enrollment)} />
              <ReviewDetail label="Course" value={getCourseName(review.enrollment)} />
              <ReviewDetail label="Payment reference" value={review.payment?.reference || 'No payment submitted'} />
              <ReviewDetail label="Payment method" value={review.payment?.method || '—'} />
              <ReviewDetail label="Amount" value={review.payment ? `Rs. ${review.payment.amount.toLocaleString()}` : '—'} />
              <ReviewDetail label="Submitted" value={review.payment?.date || '—'} />
              <div>
                <p className="text-xs text-slate-400 mb-1">Payment status</p>
                <Badge color={review.payment?.status === 'Pending' ? 'amber' : review.payment?.status === 'Paid' ? 'green' : 'red'}>{review.payment?.status || 'Not submitted'}</Badge>
              </div>
            </div>

            {review.payment?.paymentEvidence ? (
              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">Student payment receipt</p>
                {/\.(?:png|jpe?g|webp|gif)$/i.test(review.payment.paymentEvidence) && (
                  <a href={review.payment.paymentEvidence} target="_blank" rel="noreferrer">
                    <img src={review.payment.paymentEvidence} alt="Student payment receipt" className="max-h-64 max-w-full rounded-lg border border-slate-200 object-contain" />
                  </a>
                )}
                <a href={review.payment.paymentEvidence} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-semibold text-[#1E6BB8] hover:underline">Open uploaded receipt</a>
              </div>
            ) : (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">No payment receipt is attached to this enrollment.</p>
            )}

            {review.payment?.status === 'Pending' && (
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => handleReject(review.enrollment._id || review.enrollment.id, getStudentName(review.enrollment))} disabled={processingId !== null} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">Reject Payment</button>
                <button type="button" onClick={() => handleApprove(review.enrollment._id || review.enrollment.id, getStudentName(review.enrollment))} disabled={processingId !== null || (review.payment.method === 'Bank Transfer' && !review.payment.paymentEvidence)} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">Approve Payment</button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function ReviewDetail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-slate-400 mb-1">{label}</p><p className="font-medium text-slate-700 break-words">{value}</p></div>;
}
