import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';
import { formatOrderDateTime, formatOrderMoney } from '../../utils/orders';

const CustomerOrderCard = ({ order, isArabic, currencies, onSelect }) => {
  const locale = isArabic ? 'ar-EG' : 'en-US';
  const orderNumber = order.siteOrderNumber || order.orderNumber;
  const ArrowIcon = isArabic ? ChevronLeft : ChevronRight;

  return (
    <article className="group rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-card-rgb)/0.88)] p-2.5 shadow-[var(--shadow-subtle)] transition-colors hover:border-[color:rgb(var(--color-primary-rgb)/0.38)] sm:p-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[color:rgb(var(--color-surface-rgb)/0.72)]">
          {order.productImage ? (
            <img src={order.productImage} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-lg font-black text-[var(--color-muted)]">#</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="min-w-0 truncate text-sm font-bold text-[var(--color-text)]" title={order.productName}>{order.productName}</h2>
            <strong className="shrink-0 text-xs font-black text-[var(--color-primary)]" dir="ltr">{formatOrderMoney(order, currencies, locale)}</strong>
          </div>
          <p className="mt-1 truncate text-[10px] text-[var(--color-text-secondary)]">{formatOrderDateTime(order.createdAt, locale)}</p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[color:rgb(var(--color-border-rgb)/0.55)] pt-2">
        <span className="text-[10px] font-bold text-[var(--color-text-secondary)]" dir="ltr">#{orderNumber}</span>
        <OrderStatusBadge status={order.status} isArabic={isArabic} className="px-2 py-0.5 text-[9px]" />
        <button
          type="button"
          onClick={() => onSelect(order)}
          className="ms-auto inline-flex min-h-7 items-center gap-1 rounded-lg px-2 text-[10px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[color:rgb(var(--color-primary-rgb)/0.1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          <span>{isArabic ? 'التفاصيل' : 'Details'}</span>
          <ArrowIcon className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
};

export default CustomerOrderCard;
