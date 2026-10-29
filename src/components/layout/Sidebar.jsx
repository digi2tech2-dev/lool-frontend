import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Banknote,
  Boxes,
  ChevronLeft,
  Check,
  ClipboardCheck,
  Code2,
  Coins,
  Copy,
  Crosshair,
  Gift,
  Braces,
  CreditCard,
  MessageCircleMore,
  Heart,
  FolderKanban,
  Gauge,
  House,
  UserRound,
  Landmark,
  ShieldCheck,
  LogOut,
  MessageCircle,
  Share2,
  ShoppingBag,
  Settings,
  Target,
  Truck,
  UserCog,
  UsersRound,
  WalletCards
} from 'lucide-react';
import ConfirmDialog from '../account/ConfirmDialog';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import useFavoritesStore, { favoriteUserKey } from '../../store/useFavoritesStore';
import { cn } from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import WalletSidebarCard from './WalletSidebarCard';
import HeaderBrand from './HeaderBrand';
import SidebarSocialFooter from './SidebarSocialFooter';
import sidebarLogoImage from '../../assets/lool-sidebar-logo.webp';
import avatarSocialFrame from '../../assets/lool-avatar-social-frame.png';
import { SUPERVISOR_ROLES, getDefaultRouteForRole, hasRequiredRole } from '../../utils/authRoles';
import { PERMISSIONS, hasPermission } from '../../utils/permissions';
import { resolveUserAvatar } from '../../utils/avatar';

const ADMIN_NAV_ROLES = ['admin', 'super_admin', ...SUPERVISOR_ROLES];

const copyToClipboard = async (value) => {
  const text = String(value || '').trim();
  if (!text) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back to the hidden textarea copy path below.
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textArea);
    return copied;
  } catch {
    return false;
  }
};

const Sidebar = ({ isOpen, setIsOpen, isMobile }) => {
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const { user, logout } = useAuthStore();
  const favoriteCount = useFavoritesStore((state) => (state.favoritesByUser[favoriteUserKey(user)] || []).length);
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  const isExpanded = isOpen || isMobile || isPreviewExpanded;
  const userId = String(user?.id || user?._id || user?.userId || '').trim();

  useEffect(() => {
    if (!copiedUserId) return undefined;
    const timer = window.setTimeout(() => setCopiedUserId(false), 1400);
    return () => window.clearTimeout(timer);
  }, [copiedUserId]);

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    closeSidebarOnMobile();
    logout();
    navigate('/auth');
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await handleLogout();
  };

  const handleOpenMyAccount = () => {
    closeSidebarOnMobile();
    navigate('/account');
  };

  const handleCopyUserId = async () => {
    if (!userId) return;

    if (await copyToClipboard(userId)) {
      setCopiedUserId(true);
      return;
    }

    setCopiedUserId(false);
  };

  const handleContactClick = () => {
    navigate('/contact-us');
    closeSidebarOnMobile();
  };

  const navItems = [
    {
      icon: House,
      label: t('header.home', { defaultValue: dir === 'rtl' ? 'الرئيسية' : 'Home' }),
      path: '/dashboard',
      roles: ['customer', 'admin', ...SUPERVISOR_ROLES]
    },
    { icon: Heart, label: dir === 'rtl' ? 'المفضلة' : 'Favorites', path: '/favorites', roles: ['customer', 'admin', ...SUPERVISOR_ROLES], count: favoriteCount },
    {
      icon: Gauge,
      label: t('sidebar.adminDashboard', { defaultValue: dir === 'rtl' ? 'لوحة التحكم' : 'Dashboard' }),
      path: '/admin/dashboard',
      roles: ['admin', 'super_admin'],
      section: 'admin',
    },
    {
      icon: Landmark,
      label: t('sidebar.adminWallet', { defaultValue: dir === 'rtl' ? 'محفظة الأدمن' : 'Admin Wallet' }),
      path: '/admin/wallet',
      roles: ADMIN_NAV_ROLES,
      permission: PERMISSIONS.ADMIN_WALLET,
      section: 'admin',
    },
    { icon: UserRound, label: t('sidebar.myAccount', { defaultValue: dir === 'rtl' ? 'حسابي' : 'My Account' }), path: '/account', roles: ['admin', 'customer', ...SUPERVISOR_ROLES] },
    { icon: ShieldCheck, label: t('sidebar.accountProtection', { defaultValue: dir === 'rtl' ? 'حماية الحساب' : 'Account Security' }), path: '/account-security', roles: ['admin', 'customer', ...SUPERVISOR_ROLES] },
    { icon: Gift, label: dir === 'rtl' ? 'رابط الإحالة اكسب واسحب' : 'Referral Link — Earn & Withdraw', path: '/referral', roles: ['customer'] },
    {
      icon: ShoppingBag,
      label: t('sidebar.myOrders', { defaultValue: dir === 'rtl' ? 'طلباتي' : 'My Orders' }),
      path: '/orders',
      roles: ['customer', 'admin', ...SUPERVISOR_ROLES]
    },
    { icon: Crosshair, label: 'بيع التارجت', path: '/buy-target', roles: ['customer'] },
    {
      icon: Code2,
      label: dir === 'rtl' ? 'للمطورين (API)' : 'Developer API',
      path: '/developers/api',
      roles: ['customer', 'admin', ...SUPERVISOR_ROLES],
      visible: (currentUser) => currentUser?.isApiEnabled === true,
    },
    { icon: Code2, label: dir === 'rtl' ? 'تم الإنشاء بواسطة' : 'Created By', path: '/created-by', roles: ['customer'] },
    { icon: UsersRound, label: t('sidebar.users'), path: '/admin/users', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_USERS, section: 'admin' },
    { icon: Share2, label: dir === 'rtl' ? 'أرباح كود الإحالة' : 'Referral Earnings', path: '/admin/referrals', roles: ADMIN_NAV_ROLES, section: 'admin' },
    { icon: UserCog, label: t('sidebar.supervisors'), path: '/admin/supervisors', roles: ['admin'], section: 'admin' },
    { icon: Activity, label: 'مراقبة المشرفين', path: '/admin/supervisor-monitoring', roles: ['admin'], section: 'admin' },
    { icon: FolderKanban, label: t('sidebar.groupsManager'), path: '/admin/groups', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_GROUPS, section: 'admin' },
    { icon: Boxes, label: t('sidebar.productsManager'), path: '/admin/products', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_PRODUCTS, section: 'admin' },
    {
      icon: ClipboardCheck,
      label: t('sidebar.ordersManager', { defaultValue: dir === 'rtl' ? 'إدارة الطلبات' : 'Orders Manager' }),
      path: '/admin/orders',
      roles: ADMIN_NAV_ROLES,
      permission: PERMISSIONS.ADMIN_ORDERS,
      section: 'admin',
    },
    { icon: Target, label: 'طلبات التارجت', path: '/admin/target-requests', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_TARGET_REQUESTS, section: 'admin' },
    { icon: Truck, label: t('sidebar.suppliersManager'), path: '/admin/suppliers', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_SUPPLIERS, section: 'admin' },
    {
      icon: Banknote,
      label: dir === 'rtl' ? 'طلبات الشحن اليدوي' : 'Manual top-up requests',
      path: '/admin/topups',
      roles: ADMIN_NAV_ROLES,
      permission: PERMISSIONS.ADMIN_PAYMENTS,
      section: 'admin',
    },
    { icon: WalletCards, label: dir === 'rtl' ? 'سجل العمليات المالية' : 'Wallet Transactions', path: '/wallet/transactions', roles: ['customer', 'admin', ...SUPERVISOR_ROLES] },
    { icon: CreditCard, label: t('sidebar.paymentMethods'), path: '/admin/payment-methods', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_PAYMENT_METHODS, section: 'admin' },
    { icon: MessageCircle, label: 'تكامل الواتساب', path: '/admin/whatsapp', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_WHATSAPP, section: 'admin' },
    { icon: Coins, label: t('sidebar.currencies'), path: '/admin/currencies', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_CURRENCIES, section: 'admin' },
    {
      icon: MessageCircleMore,
      label: t('sidebar.contactUs', { defaultValue: 'اتصل بنا' }),
      path: '/contact-us',
      roles: ['customer', ...SUPERVISOR_ROLES],
      onClick: handleContactClick,
    },
    { icon: Settings, label: t('sidebar.settings'), path: '/settings', roles: ['admin', 'customer', ...SUPERVISOR_ROLES] }
  ];

  const filteredNavItems = navItems.filter((item) => (
    hasRequiredRole(user?.role || 'customer', item.roles)
    && hasPermission(user, item.permission)
    && (typeof item.visible !== 'function' || item.visible(user))
  ));
  const accountNavItems = filteredNavItems.filter((item) => item.section !== 'admin');
  const adminNavItems = filteredNavItems.filter((item) => item.section === 'admin');
  const visibleNavItems = [...accountNavItems, ...adminNavItems];
  const showWalletCard = String(user?.role || '').toLowerCase() === 'customer' && isExpanded;
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
  const userDisplayName = user?.name || user?.email || (dir === 'rtl' ? 'حسابي' : 'My Account');
  const userAvatar = resolveUserAvatar(user, userDisplayName);
  const userRoleLabel = isAdmin
    ? (dir === 'rtl' ? 'مدير المنصة' : 'Platform Admin')
    : (dir === 'rtl' ? 'عضو المتجر' : 'Store Member');

  const renderNavItem = (item) => (
    item.isExternal ? (
      <button
        key={item.path}
        type="button"
        onClick={item.onClick}
        className={cn(
          'ka-sidebar-nav-item group relative flex w-full items-center gap-2 overflow-hidden px-2.5 py-1.5 text-[var(--color-text-secondary)] transition-all',
          !isExpanded && 'justify-center'
        )}
      >
        <span className="ka-sidebar-icon-bubble">
          <item.icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
        {isExpanded && <span className="truncate text-[0.8rem] font-semibold">{item.label}</span>}
      </button>
    ) : (
      <NavLink
        key={item.path}
        to={item.path}
        title={item.count !== undefined ? `${item.label}: ${item.count}` : item.label}
        onClick={closeSidebarOnMobile}
        className={({ isActive }) =>
          cn(
            'ka-sidebar-nav-item group relative flex items-center gap-2 overflow-hidden px-2.5 py-1.5 transition-all',
            !isExpanded && 'justify-center',
            isActive
              ? 'is-active text-[var(--color-text)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          )
        }
      >
        {({ isActive }) => (
          <>
            <span className={cn('ka-sidebar-icon-bubble', isActive && 'is-active')}>
              <item.icon className="h-5 w-5" strokeWidth={1.8} />
              {!isExpanded && item.count !== undefined && <span className="absolute -end-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-0.5 text-[0.6rem] font-bold leading-none text-white">{item.count}</span>}
            </span>
            {isExpanded && <span className="truncate text-[0.8rem] font-semibold">{item.label}</span>}
            {isExpanded && item.count !== undefined && <span className="ms-auto rounded-full bg-rose-500/12 px-2 py-0.5 text-[0.7rem] font-bold text-rose-500">{item.count}</span>}
          </>
        )}
      </NavLink>
    )
  );

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="ka-sidebar-mobile-backdrop fixed inset-0 z-[60] bg-black/72"
          onClick={() => setIsOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? 274 : isExpanded ? 264 : 84,
          x: isMobile && !isOpen ? (dir === 'rtl' ? 320 : -320) : 0
        }}
        transition={{ type: 'tween', duration: reduceMotion ? 0 : 0.12, ease: 'easeOut' }}
        inert={isMobile && !isOpen ? true : undefined}
        aria-hidden={isMobile && !isOpen ? true : undefined}
        onMouseEnter={() => {
          if (!isMobile && !isOpen) {
            setIsPreviewExpanded(true);
          }
        }}
        onMouseLeave={() => {
          if (!isMobile) {
            setIsPreviewExpanded(false);
          }
        }}
        className={cn(
          'fixed inset-y-0 z-[70] h-[100dvh] overflow-hidden will-change-transform',
          dir === 'rtl' ? 'right-0' : 'left-0',
          isMobile && 'ka-sidebar-mobile',
          isMobile && !isOpen && 'pointer-events-none'
        )}
      >
        <div className={cn(
          'app-shell-sidebar-panel ka-sidebar-panel relative flex h-full flex-col rounded-[32px] border',
          isAdmin && 'border-[color:rgb(var(--color-primary-rgb)/0.26)]'
        )}>
          <div className="relative z-10 shrink-0 px-4 pb-3 pt-5">
            <div className={cn('relative flex items-center', isExpanded ? 'justify-center' : 'justify-center')}>
              <button
                type="button"
                onClick={() => navigate(getDefaultRouteForRole(user?.role))}
                className={cn(
                  'flex items-center rounded-[24px] transition-all hover:-translate-y-0.5',
                  isExpanded ? 'bg-transparent' : 'mx-auto'
                )}
              >
                <HeaderBrand
                  iconSrc={sidebarLogoImage}
                  className={cn(
                    'transition-transform',
                    isExpanded
                      ? 'justify-center'
                      : 'max-w-12 justify-center overflow-hidden'
                  )}
                  iconClassName={isExpanded ? 'h-[7.25rem] w-44 scale-100' : 'h-8 w-12 scale-100'}
                  textClassName="shrink-0"
                />
              </button>

              {!isMobile && (
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className={cn(
                    'ka-sidebar-collapse absolute top-1 inline-flex h-9 w-9 items-center justify-center rounded-full transition-all',
                    dir === 'rtl' ? 'left-0' : 'right-0',
                    !isExpanded && 'mx-auto'
                  )}
                  aria-label={isOpen ? (dir === 'rtl' ? 'تصغير الشريط الجانبي' : 'Collapse sidebar') : (dir === 'rtl' ? 'توسيع الشريط الجانبي' : 'Expand sidebar')}
                  aria-expanded={isOpen}
                >
                  <ChevronLeft className={cn('h-4.5 w-4.5 transition-transform', (dir === 'rtl' ? isExpanded : !isExpanded) && 'rotate-180')} />
                </button>
              )}
            </div>
          </div>

          <div className="relative z-10 min-h-0 flex-1 overflow-y-auto scrollbar-hide">
          {isExpanded && (
            <div className="border-y border-[color:rgb(var(--color-primary-rgb)/0.28)] bg-[color:rgb(var(--color-primary-rgb)/0.04)] px-4 pb-2 pt-3">
              <div className="ka-sidebar-user-card ka-sidebar-profile">
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className={cn(
                    'ka-sidebar-logout-pill ka-sidebar-profile-logout is-icon-only absolute top-3 z-10',
                    dir === 'rtl' ? 'left-3' : 'right-3'
                  )}
                  aria-label={dir === 'rtl' ? 'تسجيل الخروج' : 'Logout'}
                  title={dir === 'rtl' ? 'تسجيل الخروج' : 'Logout'}
                >
                  <LogOut className="h-4 w-4" />
                </button>
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={handleOpenMyAccount}
                      className="ka-sidebar-avatar h-10 w-10"
                      aria-label={dir === 'rtl' ? 'فتح الحساب' : 'Open account'}
                    >
                      <img src={userAvatar} alt="" />
                    </button>
                    <img
                      src={avatarSocialFrame}
                      alt=""
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[4.25rem] w-[4.25rem] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
                    />
                    <span
                      className="absolute -bottom-0.5 -right-0.5 z-20 h-3.5 w-3.5 rounded-full border-2 border-[color:rgb(var(--color-card-rgb)/0.98)] bg-emerald-400"
                      role="status"
                      aria-label={dir === 'rtl' ? 'متصل الآن' : 'Online now'}
                      title={dir === 'rtl' ? 'متصل الآن' : 'Online now'}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className={cn(
                      'truncate text-[0.82rem] font-black leading-tight text-[var(--color-text)]',
                      dir === 'rtl' ? 'pl-9' : 'pr-9'
                    )} title={userDisplayName}>{userDisplayName}</div>
                    <div className="mt-0.5 truncate text-[0.64rem] font-semibold text-[var(--color-text-secondary)]">{userRoleLabel}</div>
                    {userId ? (
                      <button
                        type="button"
                        onClick={handleCopyUserId}
                        className="ka-sidebar-id-chip mt-1.5"
                        title={copiedUserId ? 'تم نسخ ID المستخدم' : 'اضغط لنسخ ID المستخدم'}
                        aria-label={copiedUserId ? 'تم نسخ ID المستخدم' : 'نسخ ID المستخدم'}
                      >
                        {copiedUserId ? <Check className="h-3 w-3 shrink-0" /> : <Copy className="h-3 w-3 shrink-0" />}
                        <span className="truncate" dir="ltr">{copiedUserId ? 'تم النسخ' : `...${userId.slice(-8)}`}</span>
                      </button>
                    ) : null}
                  </div>
                </div>

              </div>
              <div className="mt-2 flex justify-center">
                <LanguageSwitcher variant="sidebar" className="ka-sidebar-language ka-sidebar-language-compact" />
              </div>
            </div>
          )}

          <div className="px-3 py-3">
            {showWalletCard && (
              <WalletSidebarCard
                className="mb-3"
                isVisible={showWalletCard}
                onNavigate={closeSidebarOnMobile}
              />
            )}

            <div className="space-y-1.5">
              {visibleNavItems.map(renderNavItem)}
            </div>
          </div>
          </div>

          {!isExpanded && <div className="relative z-10 px-3 pb-5 pt-1">
            <button
              type="button"
              onClick={handleLogoutClick}
              className="ka-sidebar-logout-pill is-icon-only"
              aria-label={dir === 'rtl' ? 'تسجيل الخروج' : 'Logout'}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>}
          {isExpanded && (
            <SidebarSocialFooter isArabic={dir === 'rtl'} />
          )}
        </div>
      </motion.aside>
      <ConfirmDialog
        open={showLogoutConfirm}
        title={dir === 'rtl' ? 'تسجيل الخروج' : 'Logout'}
        description={dir === 'rtl' ? 'هل متأكد من تسجيل الخروج؟' : 'Are you sure you want to logout?'}
        confirmLabel={dir === 'rtl' ? 'نعم، تسجيل الخروج' : 'Yes, logout'}
        cancelLabel={dir === 'rtl' ? 'إلغاء' : 'Cancel'}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};

export default Sidebar;
