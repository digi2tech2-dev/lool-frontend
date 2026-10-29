import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MotionConfig } from 'framer-motion';
import { ArrowLeft, ArrowRight, ClipboardList } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AmbientBackground from './AmbientBackground';
import { useLanguage } from '../../context/LanguageContext';
import useAuthStore from '../../store/useAuthStore';
import { isAdminRole } from '../../utils/authRoles';
import BackToTopButton from '../ui/BackToTopButton';
import SiteCopyrightFooter from './SiteCopyrightFooter';
import {
  getDashboardPathForRole,
  registerVisitedPath,
} from '../../utils/navigation';
import { isLitePerformanceMode } from '../../utils/performanceMode';

const MOBILE_SIDEBAR_QUERY = '(max-width: 1023px)';

const getInitialMobileState = () => (
  typeof window !== 'undefined' && window.matchMedia(MOBILE_SIDEBAR_QUERY).matches
);

const Layout = ({ children = null }) => {
  const [isMobile, setIsMobile] = useState(getInitialMobileState);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => !getInitialMobileState());
  const { dir, language } = useLanguage();
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const performanceLite = isLitePerformanceMode();

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_SIDEBAR_QUERY);
    const handleViewportChange = (event = mediaQuery) => {
      const mobile = event.matches;
      setIsMobile((current) => (current === mobile ? current : mobile));
      setIsSidebarOpen((current) => (current === !mobile ? current : !mobile));
    };

    handleViewportChange(mediaQuery);
    mediaQuery.addEventListener('change', handleViewportChange);
    return () => mediaQuery.removeEventListener('change', handleViewportChange);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  useEffect(() => {
    registerVisitedPath(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    document.body.dataset.sidebarOpen = String(isSidebarOpen);
    return () => {
      delete document.body.dataset.sidebarOpen;
    };
  }, [isSidebarOpen]);

  const isHomePage = [
    '/dashboard',
    '/admin/dashboard',
  ].includes(location.pathname);
  const isAdminPage = location.pathname.startsWith('/admin');
  const isAdmin = isAdminRole(user?.role);
  const isCustomerDashboard = location.pathname === '/dashboard';
  const isBuyTargetPage = location.pathname === '/buy-target';
  const isWalletTopupPage = (
    location.pathname === '/wallet/add-balance'
    || location.pathname.startsWith('/wallet/payment-details/')
  );
  const shellOffset = !isMobile ? (isSidebarOpen ? '264px' : '84px') : '0';
  const showCopyrightFooter = !isAdmin || isHomePage;
  const fixedShell = (
    <>
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isMobile={isMobile}
      />

      <div
        className="fixed z-40 max-w-full transition-all duration-150 motion-reduce:transition-none"
        style={{
          top: 0,
          [dir === 'rtl' ? 'right' : 'left']: isMobile ? '0' : shellOffset,
          [dir === 'rtl' ? 'left' : 'right']: '0',
        }}
      >
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      </div>
    </>
  );

  const handleGoBack = () => {
    if (isBuyTargetPage) {
      window.dispatchEvent(new Event('ka:buy-target-back'));
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(getDashboardPathForRole(user?.role));
  };

  return (
    <MotionConfig reducedMotion={performanceLite ? 'always' : 'user'}>
    <div className={`relative min-h-screen overflow-x-clip bg-transparent text-[var(--color-text)] ${isAdminPage ? 'layout-admin-light' : ''}`}>
      {!performanceLite ? <AmbientBackground /> : null}
      {typeof document !== 'undefined' ? createPortal(fixedShell, document.body) : fixedShell}

      <div
        className="min-h-screen min-w-0 max-w-full transition-all duration-150 motion-reduce:transition-none"
        style={{ [dir === 'rtl' ? 'marginRight' : 'marginLeft']: shellOffset }}
      >
        <div className="h-[4.9rem] sm:h-[6.5rem]" aria-hidden="true" />

        {!isHomePage && (
          <div className="mx-auto mt-4 max-w-[var(--shell-max-width)] px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleGoBack}
                className="group inline-flex h-8 items-center gap-1.5 rounded-[0.7rem] border border-amber-500/25 bg-[linear-gradient(135deg,rgb(245_158_11/0.14),rgb(var(--color-card-rgb)/0.82)_58%,rgb(var(--color-primary-rgb)/0.12))] px-1.5 pe-2.5 text-[0.68rem] font-extrabold text-amber-700 shadow-[0_10px_24px_-20px_rgb(245_158_11/0.7),inset_0_1px_0_rgb(255_255_255/0.12)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400/45 hover:bg-[linear-gradient(135deg,rgb(245_158_11/0.2),rgb(var(--color-card-rgb)/0.9)_58%,rgb(var(--color-primary-rgb)/0.16))] active:translate-y-0 active:scale-[0.98] dark:text-amber-300"
                aria-label={dir === 'rtl' ? 'رجوع' : 'Back'}
              >
                <span className="grid h-5 w-5 place-items-center rounded-md border border-amber-400/25 bg-[linear-gradient(145deg,rgb(245_158_11/0.22),rgb(var(--color-primary-rgb)/0.16))] text-amber-700 shadow-[inset_0_1px_0_rgb(255_255_255/0.16)] transition-transform duration-200 group-hover:scale-105 dark:text-amber-200">
                  {dir === 'rtl' ? <ArrowRight className="h-3 w-3" strokeWidth={2.5} /> : <ArrowLeft className="h-3 w-3" strokeWidth={2.5} />}
                </span>
                <span>{dir === 'rtl' ? 'رجوع' : 'Back'}</span>
              </button>

              {isBuyTargetPage || isWalletTopupPage ? (
                <button
                  type="button"
                  onClick={() => navigate(isBuyTargetPage ? '/target-orders' : '/wallet/topup-history')}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.26)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] px-3 text-sm font-semibold text-[var(--color-primary)] shadow-[var(--shadow-subtle)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.42)] hover:bg-[color:rgb(var(--color-primary-rgb)/0.14)]"
                  aria-label={dir === 'rtl' ? 'سجل الطلبات' : 'Order history'}
                  title={dir === 'rtl' ? 'سجل الطلبات' : 'Order history'}
                >
                  <ClipboardList className="h-4 w-4" />
                  <span className="hidden sm:inline">{dir === 'rtl' ? 'سجل الطلبات' : 'Order history'}</span>
                </button>
              ) : null}
            </div>
          </div>
        )}

        <main className={`min-w-0 overflow-x-hidden px-3 py-5 sm:px-4 md:px-6 md:py-6 lg:px-8 lg:py-8 ${isHomePage ? 'scrollbar-hide' : ''} ${isCustomerDashboard ? '!pt-0 sm:!pt-0 md:!pt-0 lg:!pt-0' : ''}`}>
          <div className="mx-auto w-full min-w-0 max-w-[var(--shell-max-width)]">
            {children || <Outlet />}
          </div>
        </main>
        {showCopyrightFooter ? (
          <SiteCopyrightFooter
            isArabic={language === 'ar' || dir === 'rtl'}
            showEngineerContact={!isAdmin}
          />
        ) : null}
      </div>
      <BackToTopButton />
    </div>
    </MotionConfig>
  );
};

export default Layout;
