import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, useNavigate } from 'react-router-dom';
import { CheckCircle2, Download, Menu, ShieldCheck, Smartphone, UserRound } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import useAuthStore from '../store/useAuthStore';
import ThemeToggle from '../components/ui/ThemeToggle';
import HeaderBrand from '../components/layout/HeaderBrand';
import PublicSidebar from '../components/layout/PublicSidebar';
import SiteCopyrightFooter from '../components/layout/SiteCopyrightFooter';
import Seo from '../components/seo/Seo';
import { useBodyScrollLock } from '../utils/bodyScrollLock';
import { isNativeApp } from '../utils/platform';

const FALLBACK_APK_URL = '/downloads/android/ad-card-1.2.0.apk';
const FALLBACK_VERSION = '1.2.0';
const MANIFEST_URL = '/downloads/android/latest.json';

const getSafeApkUrl = (value) => {
  if (typeof value !== 'string' || !value.trim() || typeof window === 'undefined') return '';

  try {
    const url = new URL(value, window.location.origin);
    const isSameOrigin = url.origin === window.location.origin;
    return url.protocol === 'https:' || (isSameOrigin && url.protocol === window.location.protocol)
      ? url.href
      : '';
  } catch {
    return '';
  }
};

const DownloadApp = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [release, setRelease] = useState({
    apkUrl: FALLBACK_APK_URL,
    version: FALLBACK_VERSION,
    isLoading: true,
    usedFallback: false,
  });
  const isArabic = language === 'ar';

  useBodyScrollLock(isMenuOpen);

  useEffect(() => {
    if (isNativeApp()) return undefined;

    const controller = new AbortController();

    const loadRelease = async () => {
      try {
        const response = await fetch(MANIFEST_URL, {
          signal: controller.signal,
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`Android release manifest returned ${response.status}`);

        const manifest = await response.json();
        const apkUrl = getSafeApkUrl(manifest?.apkUrl);
        const version = String(manifest?.version || manifest?.versionName || '').trim();
        if (!apkUrl || !version) throw new Error('Android release manifest is incomplete');

        setRelease({ apkUrl, version, isLoading: false, usedFallback: false });
      } catch (error) {
        if (error?.name === 'AbortError') return;
        setRelease({
          apkUrl: FALLBACK_APK_URL,
          version: FALLBACK_VERSION,
          isLoading: false,
          usedFallback: true,
        });
      }
    };

    void loadRelease();
    return () => controller.abort();
  }, []);

  const handleHome = useCallback(() => navigate('/'), [navigate]);
  const handleAbout = useCallback(() => navigate('/about-us'), [navigate]);
  const handleContact = useCallback(() => navigate('/public-contact-us'), [navigate]);
  const handleLogin = useCallback(() => navigate('/auth?mode=login'), [navigate]);
  const handleCreateAccount = useCallback(() => navigate('/auth?mode=signup'), [navigate]);
  const handleGoogleLogin = useCallback(() => {
    Promise.resolve(loginWithGoogle());
  }, [loginWithGoogle]);

  if (isNativeApp()) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8ea_0%,#f4fbff_48%,#fffdf8_100%)] pb-5 pt-[4.75rem] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.16),transparent_34%),linear-gradient(180deg,#041019_0%,#07111f_52%,#03070d_100%)]">
      <Seo
        title={isArabic ? 'تحميل تطبيق Lool Store للأندرويد' : 'Download the Lool Store Android app'}
        description={isArabic ? 'حمّل تطبيق Lool Store الرسمي للأندرويد.' : 'Download the official Lool Store Android app.'}
        canonicalUrl="https://ad-card.com/download-app"
        language={language}
      />

      {typeof document !== 'undefined' && createPortal(
        <header className="pointer-events-none fixed inset-x-0 top-0 z-[90]">
          <div className="w-full">
            <div dir="ltr" className="public-full-header ka-card-panel pointer-events-auto grid min-h-[2.95rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-[20px] border px-2.5 py-1 sm:min-h-[3.25rem] sm:gap-5 sm:rounded-[28px] sm:px-5 sm:py-1.5">
              <div className="col-start-1 row-start-1 justify-self-start">
                <ThemeToggle variant="glass" compact className="h-9 w-9 sm:h-10 sm:w-10" />
              </div>
              <button type="button" onClick={handleHome} className="col-start-2 row-start-1 justify-self-center rounded-[20px] transition-all hover:-translate-y-0.5" aria-label={isArabic ? 'العودة للرئيسية' : 'Back to home'}>
                <HeaderBrand className="justify-center" iconClassName="h-14 w-24 scale-100 sm:h-16 sm:w-28" />
              </button>
              <div className="col-start-3 row-start-1 flex items-center gap-1.5 justify-self-end sm:gap-2">
                <button type="button" onClick={handleLogin} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-200/20 bg-[linear-gradient(180deg,rgb(124_58_237/0.22),rgb(3_8_22/0.78))] text-cyan-50 shadow-[inset_0_0_18px_rgb(255_255_255/0.035),0_0_26px_-18px_rgb(124_58_237/0.9)] transition-all hover:-translate-y-0.5 hover:border-amber-200/30 hover:text-amber-100 sm:h-10 sm:w-10" aria-label={isArabic ? 'تسجيل الدخول' : 'Login'}>
                  <UserRound className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </button>
                <button type="button" onClick={() => setIsMenuOpen((value) => !value)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[linear-gradient(180deg,rgb(3_8_22/0.9),rgb(2_6_19/0.78))] text-[var(--color-text)] shadow-[inset_0_0_18px_rgb(255_255_255/0.035),0_0_26px_-18px_rgb(34_211_238/0.9)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.38)] hover:text-[var(--color-primary)] sm:h-10 sm:w-10" aria-label={isArabic ? 'القائمة' : 'Menu'}>
                  <Menu className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>
          </div>
        </header>,
        document.body
      )}

      <PublicSidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onHome={handleHome}
        onAbout={handleAbout}
        onContact={handleContact}
        onLogin={handleLogin}
        onCreateAccount={handleCreateAccount}
        onGoogleLogin={handleGoogleLogin}
        isBusy={false}
        isArabic={isArabic}
      />

      <main className="mx-auto flex w-full max-w-4xl items-center px-3 py-6 sm:px-4 sm:py-10">
        <section className="ka-card-panel relative w-full overflow-hidden rounded-[2rem] border p-5 text-center shadow-[0_32px_92px_-54px_rgb(49_16_47/0.66)] sm:p-8">
          <span className="pointer-events-none absolute -top-24 left-1/2 h-56 w-80 -translate-x-1/2 rounded-full bg-fuchsia-400/18 blur-3xl" />
          <span className="pointer-events-none absolute -bottom-24 -right-16 h-52 w-52 rounded-full bg-cyan-400/16 blur-3xl" />
          <div className="relative">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-[1.4rem] border border-amber-200/30 bg-[linear-gradient(145deg,rgb(229_166_104/0.26),rgb(139_28_128/0.2))] text-amber-100 shadow-[0_18px_42px_-24px_rgb(189_112_65/0.86)]">
              <Smartphone className="h-8 w-8" strokeWidth={1.9} />
            </span>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.24)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] px-3 py-1 text-xs font-black tracking-[0.12em] text-[var(--color-primary)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Lool Store · ANDROID
            </p>
            <h1 className="mt-4 text-2xl font-black text-[var(--color-text)] sm:text-4xl">
              {isArabic ? 'تطبيق Lool Store للأندرويد' : 'Lool Store for Android'}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-[var(--color-text-secondary)] sm:text-base">
              {isArabic ? 'حمّل النسخة الرسمية لتجربة أسرع وأسهل على جهازك.' : 'Download the official app for a faster, simpler experience on your device.'}
            </p>

            <div className="mx-auto mt-6 max-w-md rounded-[1.35rem] border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-surface-rgb)/0.56)] px-4 py-3">
              <p className="text-xs font-bold text-[var(--color-text-secondary)]">{isArabic ? 'الإصدار الحالي' : 'Current version'}</p>
              <p className="mt-1 text-xl font-black text-[var(--color-text)]" aria-live="polite">
                {release.isLoading ? (isArabic ? 'جارٍ التحقق…' : 'Checking…') : `v${release.version}`}
              </p>
              {release.usedFallback ? <p className="mt-1 text-[0.7rem] font-semibold text-[var(--color-text-secondary)]">{isArabic ? 'تم استخدام رابط التحميل الاحتياطي.' : 'Using the fallback download link.'}</p> : null}
            </div>

            <a
              href={release.apkUrl}
              download
              aria-disabled={release.isLoading}
              onClick={(event) => {
                if (release.isLoading) event.preventDefault();
              }}
              className={`mt-6 inline-flex min-h-12 w-full max-w-md items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-base font-black transition-all ${release.isLoading ? 'pointer-events-none cursor-wait border-[color:rgb(var(--color-border-rgb)/0.6)] bg-[color:rgb(var(--color-surface-rgb)/0.58)] text-[var(--color-text-secondary)]' : 'border-amber-100/35 bg-[linear-gradient(135deg,#29bfe8,#1485bf)] text-[#151039] shadow-[0_18px_36px_-20px_rgb(189_112_65/0.86)] hover:-translate-y-0.5 hover:brightness-110'}`}
            >
              <Download className="h-5 w-5" />
              {isArabic ? 'تحميل التطبيق للأندرويد' : 'Download for Android'}
            </a>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
              <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" />
              <span>{isArabic ? 'رابط التحميل الرسمي لـ Lool Store' : 'Official Lool Store download link'}</span>
            </div>
          </div>
        </section>
      </main>

      <SiteCopyrightFooter isArabic={isArabic} />
    </div>
  );
};

export default DownloadApp;
