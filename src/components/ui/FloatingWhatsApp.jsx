import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import { isAdminRole } from '../../utils/authRoles';
import WhatsAppContactChooser from './WhatsAppContactChooser';
import floatingPromoTwo from '../../assets/floating-promo-optimized.webp';
import supportRobot from '../../assets/lool-support-robot.webp';
import { isLitePerformanceMode } from '../../utils/performanceMode';

const FloatingWhatsApp = () => {
  const [showContactChooser, setShowContactChooser] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const { i18n } = useTranslation();
  const location = useLocation();
  const { user } = useAuthStore();
  const shouldHideForRole = isAdminRole(user?.role);
  const isAuthPage = location.pathname === '/auth';
  const isApiDocsPage = location.pathname === '/api-docs';

  useEffect(() => {
    if (isLitePerformanceMode()) return undefined;

    const revealPromo = () => setShowPromo(true);
    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(revealPromo, { timeout: 2500 });
      return () => window.cancelIdleCallback?.(idleId);
    }

    const timerId = window.setTimeout(revealPromo, 1800);
    return () => window.clearTimeout(timerId);
  }, []);

  if (shouldHideForRole || isAuthPage || isApiDocsPage) {
    return null;
  }

  const isArabic = String(i18n.resolvedLanguage || i18n.language || 'ar')
    .toLowerCase()
    .startsWith('ar');

  const message = isArabic
    ? 'مرحباً، أحتاج مساعدة من فريق Lool Store'
    : 'Hello, I need help from the Lool Store team';
  const tooltipText = isArabic ? 'تواصل معنا' : 'Chat with us';

  return (
    <>
      {showPromo ? <span className="floating-whatsapp-promos">
        <Link
          to="/referral"
          className="floating-whatsapp-promo"
          aria-label={isArabic ? 'افتح رابط الإحالة اكسب واسحب' : 'Open referrals, earn and withdraw'}
        >
          <img
            src={floatingPromoTwo}
            alt=""
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            width="256"
            height="256"
            className="floating-whatsapp-promo-image"
          />
        </Link>
      </span> : null}
      <div className="floating-whatsapp">
      <button
        type="button"
        onClick={() => setShowContactChooser(true)}
        aria-label={isArabic ? 'واتساب الدعم' : 'WhatsApp Support'}
        className="floating-whatsapp-action"
      >
        <span className="floating-whatsapp-tooltip" aria-hidden="true">{tooltipText}</span>
        <span className="floating-whatsapp-button">
          <img className="floating-whatsapp-robot" src={supportRobot} alt="" width="512" height="512" />
        </span>
      </button>
      </div>
      <WhatsAppContactChooser
        isOpen={showContactChooser}
        onClose={() => setShowContactChooser(false)}
        message={message}
        isArabic={isArabic}
      />
    </>
  );
};

export default FloatingWhatsApp;
