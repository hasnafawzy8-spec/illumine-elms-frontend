import { useEffect, useRef } from 'react';
import type { BookPromotion, CoursePromotion } from '../types';
import { formatColomboDisplayDate } from '../utils/dateFormatter';

type Props = {
  variant: 'course';
  promotion: CoursePromotion;
  onViewOffer: () => void;
  onDismiss: () => void;
} | {
  variant: 'book';
  promotion: BookPromotion;
  onViewOffer: () => void;
  onDismiss: () => void;
};

export default function EarlyBirdOfferModal({
  variant,
  promotion,
  onViewOffer,
  onDismiss,
}: Props) {
  const viewButtonRef = useRef<HTMLButtonElement | null>(null);
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(promotion.closingDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const deadlineLabel =
    daysLeft === 0
      ? 'Final day to claim'
      : daysLeft === 1
        ? 'Closes tomorrow'
        : `${daysLeft} days left`;
  const isBookOffer = variant === 'book';
  const featuredLabel = isBookOffer ? 'Featured book' : 'Featured course';
  const categoryLabel = isBookOffer
    ? promotion.bookCategory || 'Student book'
    : promotion.courseGrade || 'All grades';
  const itemName = isBookOffer ? promotion.bookTitle : promotion.courseName;
  const itemDescription = isBookOffer ? promotion.bookDescription : promotion.courseDescription;
  const originalAmount = isBookOffer ? promotion.originalPrice : promotion.originalFee;
  const offerAmount = isBookOffer ? promotion.discountedPrice : promotion.discountedFee;
  const priceLabel = isBookOffer ? 'Regular price' : 'Regular fee';
  const offerPriceLabel = isBookOffer ? 'Book offer price' : 'Early bird fee';
  const headline = isBookOffer
    ? 'Limited book offer for your English learning journey'
    : 'Claim your English course discount before it closes';
  const primaryActionLabel = isBookOffer ? 'View Book & Buy' : 'View Course & Enroll';
  const defaultConditions = isBookOffer
    ? 'Valid while stocks last before the offer closing date.'
    : 'Valid for eligible students before enrolling in this course.';
  const benefits = isBookOffer
    ? [
        'Useful class support',
        'Limited-time bookstore price',
        'Offer applied at checkout',
      ]
    : [
        `Built for ${categoryLabel}`,
        'Live guided lessons',
        'Enroll at the offer price',
      ];

  useEffect(() => {
    const previousActive = document.activeElement as HTMLElement | null;
    viewButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousActive?.focus?.();
    };
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-md"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onDismiss();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="early-bird-title"
        aria-describedby="early-bird-description"
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl ring-1 ring-white/30"
      >
        <button
          type="button"
          aria-label="Close early bird offer"
          onClick={onDismiss}
          className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white/95 text-2xl font-bold text-slate-500 shadow-lg shadow-slate-900/10 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-200"
        >
          ×
        </button>

        <div className="grid md:grid-cols-[0.98fr_1.02fr]">
          <div className="relative overflow-hidden bg-[#0F355D] p-7 text-white md:p-9">
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:56px_56px]" />
            <div className="absolute -right-20 top-12 h-56 w-56 rounded-full bg-[#1E6BB8]/55 blur-3xl" />
            <div className="absolute -bottom-24 left-8 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-50">
                  Early Bird Offer
                </span>
                <span className="inline-flex rounded-full bg-amber-300 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-slate-950">
                  {deadlineLabel}
                </span>
              </div>
              <h2
                id="early-bird-title"
                className="mt-7 font-display text-4xl font-black leading-tight md:text-5xl"
              >
                {headline}
              </h2>
              <p id="early-bird-description" className="mt-4 max-w-md text-base font-semibold leading-7 text-blue-50/90">
                {promotion.title}: {promotion.description}
              </p>
              <div className="mt-8 rounded-3xl border border-white/25 bg-white/12 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                  {featuredLabel}
                </p>
                <p className="mt-2 text-3xl font-black leading-tight">{itemName}</p>
                <p className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-sm font-black text-[#0F355D]">
                  {categoryLabel}
                </p>
                {itemDescription && (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-blue-50/85">
                    {itemDescription}
                  </p>
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black text-blue-50"
                  >
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-7 md:p-9">
            <div className="rounded-[1.6rem] border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-5 shadow-inner">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    {priceLabel}
                  </p>
                  <p className="mt-1 text-2xl font-black text-slate-500 line-through">
                    LKR {originalAmount.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-100 px-3 py-2 text-right text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
                  {promotion.discountPercent}% off
                </div>
              </div>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-[#1E6BB8]">
                {offerPriceLabel}
              </p>
              <p className="mt-1 font-display text-5xl font-black leading-none text-[#1E6BB8] md:text-6xl">
                LKR {offerAmount.toLocaleString()}
              </p>
              <div className="mt-5 rounded-3xl bg-white px-5 py-4 text-center shadow-lg shadow-blue-900/10 ring-1 ring-slate-100">
                <p className="text-sm font-bold text-slate-500">You save</p>
                <p className="font-display text-3xl font-black text-emerald-700">
                  LKR {promotion.discountAmount.toLocaleString()}
                </p>
              </div>
            </div>

            <dl className="mt-5 grid gap-3 text-sm">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  Offer closes
                </dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2 font-bold text-slate-900">
                  {formatColomboDisplayDate(promotion.closingDate)}
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">
                    {deadlineLabel}
                  </span>
                </dd>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  Conditions
                </dt>
                <dd className="mt-1 font-semibold leading-6 text-slate-700">
                  {promotion.conditions || defaultConditions}
                </dd>
              </div>
            </dl>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                ref={viewButtonRef}
                type="button"
                onClick={onViewOffer}
                className="rounded-2xl bg-[#1E6BB8] px-5 py-4 text-sm font-black text-white shadow-xl shadow-blue-700/25 transition hover:-translate-y-0.5 hover:bg-[#155a9c] focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                {primaryActionLabel}
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                Maybe Later
              </button>
            </div>
            <p className="mt-4 text-center text-xs font-semibold leading-5 text-slate-500">
              Offer is applied automatically at checkout if it is still valid.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
