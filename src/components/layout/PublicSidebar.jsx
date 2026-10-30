import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MessageCircleMore,
  House,
  CircleHelp,
  LogIn,
  Store,
  UserPlus,
  Code2,
} from 'lucide-react';
import { cn } from '../ui/Button';
import HeaderBrand from './HeaderBrand';
import SidebarSocialFooter from './SidebarSocialFooter';
import sidebarLogoImage from '../../assets/lool-sidebar-logo-optimized.webp';
import LanguageSwitcher from '../ui/LanguageSwitcher';

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 shrink-0">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.4-.2-2H12z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-0.9 6.7-2.6l-3.1-2.4c-.9.6-2 1-3.6 1-2.7 0-5-1.8-5.8-4.3l-3.2 2.5C4.7 19.6 8 22 12 22z" />
    <path fill="#4A90E2" d="M6.2 13.7c-.2-.6-.3-1.1-.3-1.7s.1-1.2.3-1.7L3 7.8C2.4 9 2 10.4 2 12s.4 3 1 4.2l3.2-2.5z" />
    <path fill="#FBBC05" d="M12 5c1.5 0 2.9.5 4 1.6l3-3C17 1.8 14.7 1 12 1 8 1 4.7 3.4 3 7.8l3.2 2.5C7 6.8 9.3 5 12 5z" />
  </svg>
);

const PublicSidebar = ({ isOpen, onClose, onLogin, onHome, onAbout, onContact, onCreateAccount, onGoogleLogin, isBusy, isArabic }) => {
  const [isMobile, setIsMobile] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    {
      icon: House,
      label: isArabic ? 'الرئيسية' : 'Home',
      onClick: onHome,
      isActive: pathname === '/',
    },
    {
      icon: CircleHelp,
      label: isArabic ? 'من نحن' : 'About us',
      onClick: onAbout,
      isActive: pathname === '/about-us',
    },
    {
      icon: Code2,
      label: isArabic ? 'تم الإنشاء بواسطة' : 'Created By',
      onClick: () => navigate('/created-by'),
      isActive: pathname === '/created-by',
    },
    {
      icon: MessageCircleMore,
      label: isArabic ? 'مشاكل الحساب' : 'Account issues',
      onClick: onContact,
      isActive: pathname === '/public-contact-us',
    },
  ];

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="close menu"
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-black/40"
        />
      ) : null}

      <aside
        inert={!isOpen ? true : undefined}
        aria-hidden={!isOpen ? true : undefined}
        style={{
          width: isMobile ? 'min(292px, 100vw)' : 282,
          transform: `translateX(${isOpen ? 0 : 332}px)`,
        }}
        className="fixed inset-y-0 right-0 z-[110] block h-[100dvh] max-h-[100dvh] overflow-hidden transition-transform duration-150 ease-out motion-reduce:transition-none"
      >
        <div className={cn(
          'app-shell-sidebar-panel ka-sidebar-panel relative flex h-full flex-col overflow-hidden rounded-[32px] border'
        )}>
          <div className="relative z-10 px-4 pb-4 pt-5">
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={onHome}
                className="flex min-w-0 items-center rounded-[24px] transition-all hover:-translate-y-0.5"
              >
                <HeaderBrand
                  iconSrc={sidebarLogoImage}
                  className="justify-center"
                  iconClassName="h-[7.25rem] w-44 scale-100"
                  textClassName="text-center"
                />
              </button>

            </div>

            <div className="mt-4">
              <LanguageSwitcher showIcon variant="sidebar" className="ka-sidebar-language w-full justify-center" />
            </div>

            <div className="ka-sidebar-action-card mt-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
                <span className="ka-sidebar-icon-bubble is-active">
                  <Store className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span className="truncate">{isArabic ? 'ابدأ الآن' : 'Start now'}</span>
              </div>

              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={onLogin}
                  className="ka-sidebar-primary-button w-full"
                >
                  <LogIn className="h-4 w-4 shrink-0" />
                  {isArabic ? 'تسجيل الدخول' : 'Login'}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                  type="button"
                  onClick={onCreateAccount}
                    className="ka-sidebar-secondary-button"
                  >
                    <UserPlus className="h-4 w-4 shrink-0" />
                    <span className="truncate">{isArabic ? 'حساب جديد' : 'Sign up'}</span>
                  </button>

                  <button
                  type="button"
                  onClick={onGoogleLogin}
                  disabled={isBusy}
                    className="ka-sidebar-secondary-button ka-sidebar-google-button disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <GoogleMark />
                    <span className="truncate">Google</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-1 flex-col gap-2 overflow-y-auto p-3 scrollbar-hide">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className={cn(
                  'ka-sidebar-nav-item group relative flex w-full items-center gap-2.5 overflow-hidden px-3 py-1.5 transition-all',
                  item.isActive
                    ? 'is-active text-[var(--color-text)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                )}
              >
                <span className={cn(
                  'ka-sidebar-icon-bubble',
                  item.isActive && 'is-active'
                )}>
                  <item.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span className="truncate text-sm font-bold">{item.label}</span>
              </button>
            ))}

            <div className="mt-auto" />
          </div>
          <SidebarSocialFooter isArabic={isArabic} />
        </div>
      </aside>
    </>,
    document.body
  );
};

export default PublicSidebar;
