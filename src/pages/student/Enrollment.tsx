import { useState } from 'react';
import { Button, Badge, Card, Input } from '../../components/ui';
import type { Course, CoursePromotion, Payment, View } from '../../types';
import { courses as initialCourses } from '../../data';
import { paymentsAPI } from '../../services/api';

interface Props {
  navigate: (view: View) => void;
  selectedCourseId: string | null;
  onConfirmEnroll: (paymentDetails: {
    paymentReference: string;
    paymentMethod: 'CARD' | 'BANK_TRANSFER';
    paymentPlan: 'FULL' | 'INSTALLMENT' | string;
    amount: number;
    totalPayable: number;
    remainingAmount: number;
    installmentNumber?: number;
    totalInstallments?: number;
    nextDueDate?: string;
    promotionId?: string;
    promotionTitle?: string;
    originalFee?: number;
    discountedFee?: number;
    discountAmount?: number;
    discountPercent?: number;
  }) => void | Promise<void>;
  success: boolean;
  enrolledCourseIds: string[];
  courses?: Course[];
  promotion?: CoursePromotion | null;
  paymentReference?: string | null;
  submittedPaymentMethod?: 'CARD' | 'BANK_TRANSFER';
  submittedPayment?: Payment | null;
}

function Icon({ name, className = '' }: { name: string; className?: string }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true };
  const strokeProps = { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (name) {
    case 'arrow-left':
      return <svg {...common}><path {...strokeProps} d="M19 12H5" /><path {...strokeProps} d="m11 6-6 6 6 6" /></svg>;
    case 'card':
      return <svg {...common}><path {...strokeProps} d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" /><path {...strokeProps} d="M2 10h20M6 15h4" /></svg>;
    case 'bank':
      return <svg {...common}><path {...strokeProps} d="m3 10 9-6 9 6" /><path {...strokeProps} d="M5 10h14M6 10v8m4-8v8m4-8v8m4-8v8M4 18h16" /></svg>;
    case 'lock':
      return <svg {...common}><path {...strokeProps} d="M7 11V8a5 5 0 0 1 10 0v3" /><path {...strokeProps} d="M6 11h12v10H6V11Z" /></svg>;
    case 'shield':
      return <svg {...common}><path {...strokeProps} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path {...strokeProps} d="m9 12 2 2 4-5" /></svg>;
    case 'upload':
      return <svg {...common}><path {...strokeProps} d="M12 16V4" /><path {...strokeProps} d="m7 9 5-5 5 5" /><path {...strokeProps} d="M5 20h14" /></svg>;
    case 'check':
      return <svg {...common}><path {...strokeProps} d="m5 12 4 4L19 6" /></svg>;
    case 'calendar':
      return <svg {...common}><path {...strokeProps} d="M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>;
    case 'clock':
      return <svg {...common}><path {...strokeProps} d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" /><path {...strokeProps} d="M12 6v6l4 2" /></svg>;
    case 'graduation':
      return <svg {...common}><path {...strokeProps} d="m3 8 9-4 9 4-9 4-9-4Z" /><path {...strokeProps} d="M7 10.5V15c0 1.7 2.2 3 5 3s5-1.3 5-3v-4.5" /></svg>;
    case 'spark':
      return <svg {...common}><path {...strokeProps} d="m12 3 1.7 4.6L18 9.3l-4.3 1.7L12 16l-1.7-5L6 9.3l4.3-1.7L12 3Z" /></svg>;
    default:
      return null;
  }
}

export default function Enrollment({ navigate, selectedCourseId, onConfirmEnroll, success, enrolledCourseIds, courses = initialCourses, promotion, paymentReference: submittedReference, submittedPaymentMethod = 'CARD', submittedPayment }: Props) {
  const [loading, setLoading] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    saveCard: true,
  });
  const [paymentError, setPaymentError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'BANK_TRANSFER'>('CARD');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [paymentReference, setPaymentReference] = useState('');

  const course = courses.find(c => c.id === selectedCourseId) || courses[0];
  if (!course) return <div className="p-8 text-center text-slate-400">Course not found.</div>;

  const isAlreadyEnrolled = enrolledCourseIds.includes(course.id) && !success;

  // Live Sanitizers
  const handleCardNameChange = (val: string) => {
    // Only alphabetic letters and spaces
    const clean = val.replace(/[^A-Za-z\s]/g, '');
    setCardForm(f => ({ ...f, cardName: clean }));
  };

  const handleCardNumberChange = (val: string) => {
    // Only numbers, max 16 digits
    const clean = val.replace(/\D/g, '').slice(0, 16);
    setCardForm(f => ({ ...f, cardNumber: clean }));
  };

  const handleExpiryChange = (val: string) => {
    // Only digits and '/'
    let clean = val.replace(/[^\d/]/g, '');
    // Auto-insert slash after 2 digits if typing month
    if (clean.length === 2 && !clean.includes('/')) {
      clean = clean + '/';
    }
    if (clean.length > 5) clean = clean.slice(0, 5);
    setCardForm(f => ({ ...f, expiry: clean }));
  };

  const handleCvvChange = (val: string) => {
    // Only digits, max 3 digits
    const clean = val.replace(/\D/g, '').slice(0, 3);
    setCardForm(f => ({ ...f, cvv: clean }));
  };

  const [paymentType, setPaymentType] = useState<'FULL' | 'INSTALLMENT'>('FULL');

  const offerApplies = Boolean(promotion && promotion.courseId === course.id);
  const regularFee = course.monthlyFee;
  const fullFee = offerApplies ? Number(promotion?.discountedFee || regularFee) : regularFee;
  const installmentServiceFee = 1500;
  const installmentTotal = fullFee + installmentServiceFee;
  const monthlyInstallment = Math.round(installmentTotal / 3);

  const selectedAmount = paymentType === 'FULL' ? fullFee : monthlyInstallment;

  const handleProcessPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (paymentMethod === 'CARD') {
      const nameTrimmed = cardForm.cardName.trim();
      if (!nameTrimmed || !/^[A-Za-z\s]+$/.test(nameTrimmed)) {
        setPaymentError('Please enter a valid Cardholder Name.');
        return;
      }
      if (cardForm.cardNumber.length !== 16 || !/^\d{16}$/.test(cardForm.cardNumber)) {
        setPaymentError('Card Number must contain exactly 16 digits.');
        return;
      }

      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
      if (!expiryRegex.test(cardForm.expiry)) {
        setPaymentError('Expiration Date must be in valid MM/YY format (Month 01-12).');
        return;
      }
      const [mStr, yStr] = cardForm.expiry.split('/');
      const expMonth = parseInt(mStr, 10);
      const expYear = 2000 + parseInt(yStr, 10);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        setPaymentError('Card has expired. Please enter a valid future expiry date.');
        return;
      }
      if (cardForm.cvv.length !== 3 || !/^\d{3}$/.test(cardForm.cvv)) {
        setPaymentError('CVV must contain exactly 3 digits.');
        return;
      }
    } else if (!receiptFile) {
      setPaymentError('Upload your bank transfer receipt before continuing.');
      return;
    }

    setPaymentError('');
    setLoading(true);

    try {
      let paymentPayload: FormData | Record<string, string>;
      if (paymentMethod === 'BANK_TRANSFER') {
        const formData = new FormData();
        formData.append('purpose', 'COURSE_FEE');
        formData.append('relatedCourse', course.id);
        formData.append('paymentMethod', 'BANK_TRANSFER');
        formData.append('paymentPlan', paymentType);
        formData.append('installmentNumber', '1');
        formData.append('totalInstallments', '3');
        formData.append('installmentServiceFee', String(installmentServiceFee));
        if (offerApplies && promotion?.id) {
          formData.append('promotionId', promotion.id);
        }
        formData.append('notes', `${paymentType === 'INSTALLMENT' ? 'Installment 1 of 3' : 'Full payment'} bank transfer for ${course.name}`);
        formData.append('receiptImage', receiptFile as File);
        paymentPayload = formData;
      } else {
        paymentPayload = {
          purpose: 'COURSE_FEE',
          relatedCourse: course.id,
          paymentMethod: 'CARD',
          paymentPlan: paymentType,
          installmentNumber: '1',
          totalInstallments: '3',
          installmentServiceFee: String(installmentServiceFee),
          promotionId: offerApplies && promotion?.id ? promotion.id : undefined,
          notes: `${paymentType === 'INSTALLMENT' ? 'Installment 1 of 3' : 'Full payment'} card payment for ${course.name}`,
        };
      }

      const payment = await paymentsAPI.create(paymentPayload);
      const reference = payment?.reference || 'Pending';
      setPaymentReference(reference);
      await onConfirmEnroll({
        paymentReference: reference,
        paymentMethod,
        paymentPlan: payment?.paymentPlan || paymentType,
        amount: payment?.amount || selectedAmount,
        totalPayable: payment?.totalPayable || (paymentType === 'INSTALLMENT' ? installmentTotal : fullFee),
        remainingAmount: payment?.remainingAmount ?? (paymentType === 'INSTALLMENT' ? installmentTotal - selectedAmount : 0),
        installmentNumber: payment?.installmentNumber || (paymentType === 'INSTALLMENT' ? 1 : undefined),
        totalInstallments: payment?.totalInstallments || (paymentType === 'INSTALLMENT' ? 3 : undefined),
        nextDueDate: payment?.nextDueDate || '',
        promotionId: payment?.promotionId || (offerApplies ? promotion?.id : undefined),
        promotionTitle: payment?.promotionTitle || (offerApplies ? promotion?.title : undefined),
        originalFee: payment?.originalFee || (offerApplies ? regularFee : undefined),
        discountedFee: payment?.discountedFee || (offerApplies ? fullFee : undefined),
        discountAmount: payment?.discountAmount || (offerApplies ? promotion?.discountAmount : undefined),
        discountPercent: payment?.discountPercent || (offerApplies ? promotion?.discountPercent : undefined),
      });
    } catch (error: any) {
      setPaymentError(error?.message || 'Payment could not be submitted. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const confirmationPlan = submittedPayment?.paymentPlan || paymentType;
    const isInstallmentConfirmation = confirmationPlan === 'INSTALLMENT';
    const confirmationAmount = submittedPayment?.amount || selectedAmount;
    const confirmationTotalPayable =
      submittedPayment?.totalPayable ||
      (isInstallmentConfirmation ? installmentTotal : fullFee);
    const confirmationRemaining =
      submittedPayment?.remainingAmount ??
      (isInstallmentConfirmation ? Math.max(confirmationTotalPayable - confirmationAmount, 0) : 0);
    const confirmationInstallmentNumber = submittedPayment?.installmentNumber || 1;
    const confirmationTotalInstallments = submittedPayment?.totalInstallments || 3;
    const confirmationReference = paymentReference || submittedPayment?.reference || submittedReference || 'Pending';
    const confirmationMethod =
      submittedPayment?.method === 'Bank Transfer'
        ? 'BANK_TRANSFER'
        : submittedPayment?.method === 'Card'
          ? 'CARD'
          : submittedPaymentMethod;

    return (
      <div className="flex items-center justify-center min-h-[80vh] fade-in-up">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-5xl mx-auto mb-6">⏳</div>
          <h2 className="text-2xl font-bold text-slate-900 font-display mb-2">Payment Pending Approval</h2>
          <p className="text-slate-500 text-sm mb-4">Your enrollment request and payment for <strong>{course.name}</strong> were submitted successfully.</p>
          <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs mb-4">The institute administration will review and approve your payment. Your enrollment will become active after approval.</p>

          <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Payment Ref</span>
              <span className="font-mono font-bold text-slate-800">{confirmationReference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Course</span>
              <span className="font-medium text-slate-700">{course.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Payment Method</span>
              <span className="font-medium text-slate-700">{confirmationMethod === 'CARD' ? 'Credit / Debit Card' : 'Bank Transfer'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Amount Submitted</span>
              <span className="font-bold text-[#1E6BB8]">Rs. {confirmationAmount.toLocaleString()}</span>
            </div>
            {isInstallmentConfirmation && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Payment Plan</span>
                  <span className="font-medium text-slate-700">Installment {confirmationInstallmentNumber} of {confirmationTotalInstallments}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Payable</span>
                  <span className="font-medium text-slate-700">Rs. {confirmationTotalPayable.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Remaining Balance</span>
                  <span className="font-bold text-amber-700">Rs. {confirmationRemaining.toLocaleString()}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Status</span>
              <Badge color="amber">Pending Admin Approval</Badge>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button fullWidth onClick={() => navigate('student-my-courses')}>View Enrollment Status</Button>
            <Button fullWidth variant="outline" onClick={() => navigate('student-schedule')}>View Class Schedule</Button>
          </div>
        </div>
      </div>
    );
  }

  if (isAlreadyEnrolled) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] fade-in-up">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl mx-auto mb-6">ℹ️</div>
          <h2 className="text-xl font-bold text-slate-900 font-display mb-2">Already Enrolled</h2>
          <p className="text-slate-500 text-sm mb-6">You are already enrolled in <strong>{course.name}</strong>. Duplicate enrollments are not allowed.</p>
          <div className="flex flex-col gap-2">
            <Button fullWidth onClick={() => navigate('student-my-courses')}>View My Courses</Button>
            <Button fullWidth variant="outline" onClick={() => navigate('student-courses')}>Browse Other Courses</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('student-courses')} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-600 shadow-sm hover:border-[#1E6BB8]/30 hover:bg-blue-50 hover:text-[#1E6BB8]">
            <Icon name="arrow-left" className="h-4 w-4" /> Back
          </button>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-slate-950">Enrollment & Payment</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Complete your course enrollment in one secure checkout.</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-5 rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Amount due now</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-[#1E6BB8]">Rs. {selectedAmount.toLocaleString()}</p>
          </div>
          <Badge color={paymentType === 'FULL' ? 'blue' : 'amber'}>{paymentType === 'FULL' ? 'Full Payment' : 'Installment'}</Badge>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        {/* Course Summary */}
        <div className="space-y-4">
          <Card className="overflow-hidden rounded-[1.75rem] border-slate-200">
            <div className="payment-course-image relative h-32 overflow-hidden bg-slate-100">
              <img src={course.image} alt={course.name} className="h-full w-full object-cover" />
            </div>
            <div className="p-4">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge color={course.classType === 'Online' ? 'blue' : 'amber'}>{course.classType}</Badge>
                <Badge color="slate">{course.grade}</Badge>
              </div>
              <h3 className="font-display text-lg font-extrabold leading-tight text-slate-950">{course.name}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">{course.teacher}</p>

              <div className="mt-4 grid gap-2">
                {[
                  ['Class Mode', course.classType, 'calendar'],
                  ['Duration', course.duration, 'clock'],
                  ['Target Grade', course.grade, 'graduation'],
                ].map(([label, value, icon]) => (
                  <div key={label} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#1E6BB8] shadow-sm">
                      <Icon name={icon} className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{label}</p>
                      <p className="text-sm font-extrabold text-slate-900">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                {offerApplies && promotion && (
                  <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                        Early Bird Offer
                      </span>
                      <span className="text-xs font-black text-emerald-700">
                        Save Rs. {promotion.discountAmount.toLocaleString()} ({promotion.discountPercent}%)
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-800">{promotion.title}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Regular fee <span className="line-through">Rs. {regularFee.toLocaleString()}</span> · Offer fee <span className="font-black text-[#1E6BB8]">Rs. {fullFee.toLocaleString()}</span>
                    </p>
                  </div>
                )}
                <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Select Payment Option</p>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('FULL')}
                    className={`payment-plan-card rounded-2xl border p-3 text-left ${paymentType === 'FULL' ? 'border-[#1E6BB8] bg-blue-50/70 ring-4 ring-blue-100' : 'border-slate-200 bg-white hover:border-[#1E6BB8]/30'}`}
                  >
                    <div className="flex justify-between gap-3">
                      <span className="font-extrabold text-slate-900">Full Course Payment</span>
                      <span className="text-right">
                        {offerApplies && (
                          <span className="block text-xs font-bold text-slate-400 line-through">Rs. {regularFee.toLocaleString()}</span>
                        )}
                        <span className="block font-display text-lg font-extrabold text-[#1E6BB8]">Rs. {fullFee.toLocaleString()}</span>
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Pay the course fee in full without surcharge.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('INSTALLMENT')}
                    className={`payment-plan-card rounded-2xl border p-3 text-left ${paymentType === 'INSTALLMENT' ? 'border-[#1E6BB8] bg-blue-50/70 ring-4 ring-blue-100' : 'border-slate-200 bg-white hover:border-[#1E6BB8]/30'}`}
                  >
                    <div className="flex justify-between gap-3">
                      <span className="font-extrabold text-slate-900">3-Month Installment</span>
                      <span className="font-display text-lg font-extrabold text-[#1E6BB8]">Rs. {monthlyInstallment.toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Total: Rs. {installmentTotal.toLocaleString()}. Includes Rs. {installmentServiceFee.toLocaleString()} service fee.</p>
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between rounded-2xl bg-slate-950 p-4 text-white">
                <span className="text-sm font-bold text-slate-300">Payment Due Now</span>
                <span className="font-display text-2xl font-extrabold">Rs. {selectedAmount.toLocaleString()}</span>
              </div>
            </div>
          </Card>

        </div>

        {/* Payment Form */}
        <div>
          <Card className="overflow-hidden rounded-[1.75rem] border-slate-200">
            <div className="border-b border-slate-100 bg-white p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#1E6BB8]">
                    <Icon name={paymentMethod === 'CARD' ? 'card' : 'bank'} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E6BB8]">Payment method</p>
                    <h3 className="font-display text-xl font-extrabold text-slate-950">{paymentMethod === 'CARD' ? 'Credit / Debit Card' : 'Bank Transfer'}</h3>
                  </div>
                </div>
                {paymentMethod === 'CARD' && <div className="flex gap-2 text-xs font-extrabold text-slate-500">
                  <span className="rounded-xl bg-slate-100 px-3 py-2">VISA</span>
                  <span className="rounded-xl bg-slate-100 px-3 py-2">Mastercard</span>
                  <span className="rounded-xl bg-slate-100 px-3 py-2">Amex</span>
                </div>}
              </div>
            </div>
            <div className="p-5">

            {paymentError && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                {paymentError}
              </div>
            )}

            <form onSubmit={handleProcessPayment} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3" role="group" aria-label="Payment method">
                <button
                  type="button"
                  aria-pressed={paymentMethod === 'CARD'}
                  onClick={() => setPaymentMethod('CARD')}
                  className={`payment-method-card rounded-2xl border-2 p-3.5 text-left ${paymentMethod === 'CARD' ? 'border-[#1E6BB8] bg-blue-50 ring-4 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <Icon name="card" className="mb-3 h-6 w-6 text-[#1E6BB8]" />
                  <span className="block text-sm font-extrabold text-slate-900">Card</span>
                  <span className="mt-1 block text-xs font-semibold text-slate-500">Pay using card details</span>
                </button>
                <button
                  type="button"
                  aria-pressed={paymentMethod === 'BANK_TRANSFER'}
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`payment-method-card rounded-2xl border-2 p-3.5 text-left ${paymentMethod === 'BANK_TRANSFER' ? 'border-[#1E6BB8] bg-blue-50 ring-4 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <Icon name="bank" className="mb-3 h-6 w-6 text-[#1E6BB8]" />
                  <span className="block text-sm font-extrabold text-slate-900">Bank Transfer</span>
                  <span className="mt-1 block text-xs font-semibold text-slate-500">Upload receipt for approval</span>
                </button>
              </div>

              {paymentMethod === 'CARD' ? <>
              <Input
                label="Cardholder Name"
                placeholder="e.g. Kasun Perera"
                value={cardForm.cardName}
                onChange={handleCardNameChange}
                required
              />

              <Input
                label="Card Number"
                placeholder="16 digits (e.g. 4532000000008892)"
                value={cardForm.cardNumber}
                onChange={handleCardNumberChange}
                maxLength={16}
                icon={<span>💳</span>}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Expiration Date"
                  placeholder="MM/YY"
                  value={cardForm.expiry}
                  onChange={handleExpiryChange}
                  maxLength={5}
                  required
                />
                <Input
                  label="Security Code (CVV)"
                  type="password"
                  placeholder="3 digits (e.g. 123)"
                  value={cardForm.cvv}
                  onChange={handleCvvChange}
                  maxLength={3}
                  icon={<span>🔒</span>}
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="saveCard"
                  checked={cardForm.saveCard}
                  onChange={e => setCardForm(f => ({ ...f, saveCard: e.target.checked }))}
                  className="rounded text-[#1E6BB8] focus:ring-[#1E6BB8]"
                />
                <label htmlFor="saveCard" className="text-xs text-slate-600 cursor-pointer">
                  Save card securely for monthly recurring fee payments
                </label>
              </div>
              </> : <div>
                <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E6BB8]">Bank transfer account details</p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">Transfer the selected amount, then upload your receipt below.</p>
                    </div>
                    <span className="rounded-xl bg-white px-3 py-1 text-xs font-extrabold text-[#1E6BB8] shadow-sm">Demo</span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Bank</p>
                      <p className="mt-1 text-sm font-extrabold text-slate-900">BOC</p>
                    </div>
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Account Number</p>
                      <p className="mt-1 font-mono text-sm font-extrabold text-slate-900">767821626</p>
                    </div>
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Account Name</p>
                      <p className="mt-1 text-sm font-extrabold text-slate-900">Thaniya Kariyawasam</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-500">Use your student name or payment reference as the transfer remark.</p>
                </div>
                <label className="mb-2 block text-sm font-extrabold text-slate-700" htmlFor="bank-transfer-receipt">Bank transfer receipt <span className="text-red-500">*</span></label>
                <label htmlFor="bank-transfer-receipt" className="payment-upload-zone block cursor-pointer rounded-[1.5rem] border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center hover:border-[#1E6BB8] hover:bg-blue-50/50">
                  <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#1E6BB8] shadow-sm">
                    <Icon name="upload" className="h-7 w-7" />
                  </span>
                  <span className="text-sm font-extrabold text-[#1E6BB8]">{receiptFile ? 'Choose a different receipt' : 'Choose receipt file'}</span>
                  <span className="mt-1 block text-xs font-semibold text-slate-400">JPG, PNG, WEBP, or PDF up to 5MB</span>
                  {receiptFile && <span className="mt-3 block truncate rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">{receiptFile.name}</span>}
                  <input
                    id="bank-transfer-receipt"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="sr-only"
                    onChange={event => {
                      const file = event.target.files?.[0];
                      event.target.value = '';
                      if (!file) return;
                      if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
                        setPaymentError('Choose a JPG, PNG, WEBP, or PDF receipt.');
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        setPaymentError('Receipt must be smaller than 5MB.');
                        return;
                      }
                      setReceiptFile(file);
                      setPaymentError('');
                    }}
                  />
                </label>
                <p className="mt-3 text-xs font-semibold text-slate-500">Your payment will stay pending until the institute verifies the uploaded receipt.</p>
              </div>}

              <div className="border-t border-slate-100 pt-5">
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  disabled={loading}
                  className="bg-[#1E6BB8] hover:bg-[#155a9c] shadow-lg shadow-[#1E6BB8]/20"
                >
                  {loading ? 'Submitting Payment...' : paymentMethod === 'CARD' ? `Pay Rs. ${selectedAmount.toLocaleString()} & Complete Enrollment` : `Submit Receipt & Complete Enrollment`}
                </Button>
                <p className="text-center text-xs text-slate-400 mt-3">
                  {paymentMethod === 'CARD' ? 'By clicking Pay, you authorize Illumine English Institute to charge your card.' : 'By submitting, you confirm the uploaded file is proof of your bank transfer.'}
                </p>
              </div>
            </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
