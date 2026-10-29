import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import welcomeRobot from '../../assets/lool-welcome-robot.webp';
import { useBodyScrollLock } from '../../utils/bodyScrollLock';
import './WelcomeIntro.css';

const WELCOME_STORAGE_PREFIX = 'lool:welcome-seen:';

const hasSeenWelcome = (accountKeys) => {
  if (!accountKeys.length || typeof window === 'undefined') return true;
  try {
    return accountKeys.some((key) => window.localStorage.getItem(`${WELCOME_STORAGE_PREFIX}${key}`) === 'true');
  } catch {
    return false;
  }
};

const WelcomeIntro = ({ user, language = 'ar' }) => {
  const accountKeys = [...new Set([user?.id, user?._id, user?.email]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean))];
  const isArabic = language === 'ar';
  const buttonRef = useRef(null);
  const [isVisible, setIsVisible] = useState(() => accountKeys.length > 0 && !hasSeenWelcome(accountKeys));

  useBodyScrollLock(isVisible);

  useEffect(() => {
    if (isVisible) buttonRef.current?.focus();
  }, [isVisible]);

  const dismiss = () => {
    try {
      accountKeys.forEach((key) => window.localStorage.setItem(`${WELCOME_STORAGE_PREFIX}${key}`, 'true'));
    } catch {
      // The welcome screen can still be dismissed when storage is unavailable.
    }
    setIsVisible(false);
  };

  if (!isVisible || typeof document === 'undefined') return null;

  return createPortal(
    <button
      ref={buttonRef}
      type="button"
      className="lool-welcome"
      dir={isArabic ? 'rtl' : 'ltr'}
      onClick={dismiss}
      aria-label={isArabic ? 'مرحبًا بك في LOOL Store. اضغط في أي مكان للمتابعة' : 'Welcome to LOOL Store. Click anywhere to continue'}
    >
      <span className="lool-welcome__content">
        <img className="lool-welcome__robot" src={welcomeRobot} alt="" width="768" height="768" />
        <span className="lool-welcome__title">{isArabic ? 'مرحبًا بك في LOOL Store' : 'Welcome to LOOL Store'}</span>
        <span className="lool-welcome__message">
          {isArabic ? 'كل خدماتك الرقمية في مكان واحد. جاهز تبدأ؟' : 'All your digital services in one place. Ready to begin?'}
        </span>
        <span className="lool-welcome__hint">{isArabic ? 'اضغط في أي مكان للمتابعة' : 'Click anywhere to continue'}</span>
      </span>
    </button>,
    document.body
  );
};

export default WelcomeIntro;
