import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, RefreshCw, ShieldCheck, Smartphone, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useBodyScrollLock } from '../../utils/bodyScrollLock';
import { checkNativeAndroidUpdate, openNativeAndroidUpdate } from '../../services/nativeAppUpdate';

let postponedVersionCode = null;

const NativeAppUpdateGate = () => {
  const { language } = useLanguage();
  const [update, setUpdate] = useState(null);
  const [isOpeningDownload, setIsOpeningDownload] = useState(false);
  const updateButtonRef = useRef(null);
  const isArabic = language === 'ar';
  const isForced = update?.isForced === true;

  useBodyScrollLock(Boolean(update));

  useEffect(() => {
    let isActive = true;

    void checkNativeAndroidUpdate().then((nextUpdate) => {
      if (!isActive || !nextUpdate || postponedVersionCode === nextUpdate.versionCode) return;
      setUpdate(nextUpdate);
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!update) return undefined;

    updateButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      if (!isForced) {
        postponedVersionCode = update.versionCode;
        setUpdate(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isForced, update]);

  if (!update || typeof document === 'undefined') return null;

  const postponeUpdate = () => {
    if (isForced) return;
    postponedVersionCode = update.versionCode;
    setUpdate(null);
  };

  const handleOpenUpdate = async () => {
    if (isOpeningDownload) return;

    setIsOpeningDownload(true);
    const opened = await openNativeAndroidUpdate(update.apkUrl);
    if (!opened) setIsOpeningDownload(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-3 sm:p-4" dir={isArabic ? 'rtl' : 'ltr'}>
      {isForced ? (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
      ) : (
        <button
          type="button"
          tabIndex={-1}
          aria-label={isArabic ? 'إغلاق' : 'Close'}
          onClick={postponeUpdate}
          className="absolute inset-0 cursor-default bg-slate-950/80 backdrop-blur-md"
        />
      )}
      <section
        role={isForced ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby="native-app-update-title"
        className="ka-card-panel relative z-10 w-full max-w-sm overflow-hidden rounded-[1.8rem] border border-cyan-200/20 p-5 text-center shadow-[0_32px_88px_-38px_rgb(8_127_155/0.72)] sm:p-6"
      >
        <span className="pointer-events-none absolute -top-20 left-1/2 h-44 w-72 -translate-x-1/2 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-24 -right-16 h-44 w-44 rounded-full bg-cyan-400/18 blur-3xl" />

        {!isForced ? (
          <button
            type="button"
            onClick={postponeUpdate}
            className="absolute left-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.7)] bg-[color:rgb(var(--color-card-rgb)/0.72)] text-[var(--color-text-secondary)] transition hover:text-[var(--color-text)]"
            aria-label={isArabic ? 'إغلاق' : 'Close'}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}

        <div className="relative">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-[1.4rem] border border-amber-200/30 bg-[linear-gradient(145deg,rgb(229_166_104/0.24),rgb(139_28_128/0.2))] text-amber-100 shadow-[0_18px_42px_-24px_rgb(189_112_65/0.86)]">
            <Smartphone className="h-8 w-8" strokeWidth={1.9} />
          </span>
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.24)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] px-3 py-1 text-[0.68rem] font-black tracking-[0.1em] text-[var(--color-primary)]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Lool Store · ANDROID
          </p>
          <h2 id="native-app-update-title" className="mt-4 text-xl font-black text-[var(--color-text)] sm:text-2xl">
            {isArabic ? 'يتوفر تحديث جديد' : 'A new update is available'}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">
            {isArabic ? 'يتوفر تحديث جديد لتطبيق Lool Store' : 'A new Lool Store app update is ready.'}
          </p>
          <p className="mt-4 text-base font-black text-[var(--color-text)]">
            {isArabic ? 'الإصدار' : 'Version'} {update.versionName}
          </p>

          <button
            ref={updateButtonRef}
            type="button"
            onClick={handleOpenUpdate}
            disabled={isOpeningDownload}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-amber-100/35 bg-[linear-gradient(135deg,#29bfe8,#1485bf)] px-5 py-3 text-base font-black text-[#151039] shadow-[0_18px_36px_-20px_rgb(189_112_65/0.86)] transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
          >
            {isOpeningDownload ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            {isArabic ? 'تحديث الآن' : 'Update now'}
          </button>

          {!isForced ? (
            <button
              type="button"
              onClick={postponeUpdate}
              className="mt-2.5 inline-flex min-h-10 w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-bold text-[var(--color-text-secondary)] transition hover:bg-[color:rgb(var(--color-primary-rgb)/0.08)] hover:text-[var(--color-text)]"
            >
              {isArabic ? 'لاحقاً' : 'Later'}
            </button>
          ) : null}
        </div>
      </section>
    </div>,
    document.body
  );
};

export default NativeAppUpdateGate;
