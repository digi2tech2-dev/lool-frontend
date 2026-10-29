import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowUpLeft, LoaderCircle, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { useLanguage } from '../../context/LanguageContext';
import { formatWalletAmount } from '../../utils/storefront';
import { cn } from '../ui/Button';
import { getUserBillingMode, normalizeQuota } from '../../utils/billing';

const WalletSidebarCard = ({ className, isVisible = true, onNavigate }) => {
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { user, refreshProfile } = useAuthStore();
  const primedUserIdRef = useRef(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasRefreshError, setHasRefreshError] = useState(false);

  useEffect(() => {
    if (!user?.id || primedUserIdRef.current === user.id) return;
    primedUserIdRef.current = null;
    setHasRefreshError(false);
  }, [user?.id]);

  useEffect(() => {
    let isActive = true;

    const normalizedRole = String(user?.role || '').toLowerCase();
    const canUseWalletCard = normalizedRole === 'customer';

    if (!isVisible || !canUseWalletCard || !user?.id || typeof refreshProfile !== 'function') {
      return undefined;
    }

    if (primedUserIdRef.current === user.id) {
      return undefined;
    }

    primedUserIdRef.current = user.id;
    setIsRefreshing(true);
    setHasRefreshError(false);

    Promise.resolve(refreshProfile({ force: true }))
      .catch(() => {
        if (!isActive) return;
        setHasRefreshError(true);
      })
      .finally(() => {
        if (!isActive) return;
        setIsRefreshing(false);
      });

    return () => {
      isActive = false;
    };
  }, [isVisible, refreshProfile, user?.id, user?.role]);

  const walletValue = Number(user?.coins || 0);
  const walletCurrency = String(user?.currency || 'USD').toUpperCase();
  const walletDisplayValue = useMemo(
    () => formatWalletAmount(walletValue, walletCurrency, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }),
    [walletCurrency, walletValue]
  );
  const isNegativeBalance = walletValue < 0;
  const isQuantityOnly = getUserBillingMode(user) === 'quantity_only';
  const quota = normalizeQuota(user);

  const handleNavigate = (path) => {
    navigate(path);
    if (typeof onNavigate === 'function') {
      onNavigate();
    }
  };

  return (
    <section
      dir={dir === 'rtl' ? 'rtl' : 'ltr'}
      className={cn(
        'ka-sidebar-wallet relative isolate overflow-hidden rounded-[15px] border border-[color:rgb(var(--color-primary-rgb)/0.34)] bg-[linear-gradient(145deg,rgb(var(--color-primary-rgb)/0.14),rgba(147,51,234,0.12)_40%,rgb(var(--color-card-rgb)/0.92)_100%)] p-2 shadow-[0_12px_28px_-22px_rgb(var(--color-primary-rgb)/0.36)]',
        'before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(192,38,211,0.24),transparent_45%)] before:opacity-80',
        className
      )}
    >
      <div className="relative z-10 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[8px] font-bold tracking-[0.08em] text-[var(--color-primary-soft)]">
              {isQuantityOnly ? 'الحصة المتبقية' : 'رصيد المحفظة'}
            </p>
            <div className="mt-0.5 min-h-[1.35rem]">
              {(!user && isRefreshing) ? (
                <div className="space-y-1">
                  <div className="h-2.5 w-18 animate-pulse rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.22)]" />
                  <div className="h-4 w-24 animate-pulse rounded-full bg-[color:rgba(192,38,211,0.18)]" />
                </div>
              ) : (
                <p className={`sidebar-wallet-balance-value truncate text-[0.82rem] font-black tracking-[-0.01em] sm:text-[0.92rem] ${isNegativeBalance ? 'is-negative text-[var(--color-error)]' : 'text-[var(--color-text)]'}`}>
                  {isQuantityOnly ? `${quota.remaining} / ${quota.limit}` : walletDisplayValue}
                </p>
              )}
            </div>
          </div>

          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.12)] text-[var(--color-primary)]">
            <Wallet className="h-3.5 w-3.5" />
          </span>
        </div>

        {!isQuantityOnly && <div>
          <button
            type="button"
            onClick={() => handleNavigate('/wallet/add-balance')}
            className="inline-flex h-7 w-full items-center justify-center gap-1 rounded-[10px] bg-[color:rgb(var(--color-primary-rgb)/0.13)] px-1.5 text-[9px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[color:rgb(var(--color-primary-rgb)/0.2)]"
          >
            <ArrowUpLeft className="h-3 w-3" />
            <span>إضافة رصيد</span>
          </button>
        </div>}
      </div>
    </section>
  );
};

export default WalletSidebarCard;
