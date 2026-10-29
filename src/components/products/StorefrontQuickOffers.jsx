import React from 'react';
import { ChevronLeft, ChevronRight, Wallet } from 'lucide-react';

const StorefrontQuickOffers = ({ language = 'ar', onSellTarget }) => {
  const isArabic = language === 'ar';
  const Arrow = isArabic ? ChevronLeft : ChevronRight;

  return (
    <section
      className="relative isolate overflow-hidden rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.28)] bg-[linear-gradient(105deg,rgb(var(--color-card-rgb)/0.98),rgb(var(--color-primary-rgb)/0.12),rgb(var(--color-secondary-rgb)/0.1))] px-3 py-2 shadow-[0_12px_30px_-24px_rgb(var(--color-primary-rgb)/0.65)] sm:px-4 sm:py-2.5"
      aria-label={isArabic ? 'بيع Target' : 'Sell Target'}
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 end-0 w-32 bg-[radial-gradient(circle_at_100%_50%,rgb(var(--color-primary-rgb)/0.13),transparent_70%)]" />
      <div className="relative flex items-center gap-2.5 sm:gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[color:rgb(var(--color-primary-rgb)/0.22)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] text-[var(--color-primary)] sm:h-10 sm:w-10">
          <Wallet className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black leading-5 text-[var(--color-text)] sm:text-sm">{isArabic ? 'عندك Target؟ حوّله لرصيد' : 'Have Target? Turn it into balance'}</p>
          <p className="text-[10px] font-medium leading-4 text-[var(--color-text-secondary)] sm:text-xs">{isArabic ? 'قدّم طلب البيع بخطوات بسيطة وسريعة.' : 'Submit your sale request in a few simple steps.'}</p>
        </div>
        <button
          type="button"
          onClick={onSellTarget}
          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[linear-gradient(120deg,#7027b9,#087aa8)] px-2.5 text-[10px] font-black text-white shadow-[0_8px_18px_-10px_rgb(var(--color-primary-rgb)/0.75)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] sm:px-3.5 sm:text-xs"
        >
          <span>{isArabic ? 'ابدأ بيع Target' : 'Sell Target'}</span>
          <Arrow className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};

export default React.memo(StorefrontQuickOffers);
