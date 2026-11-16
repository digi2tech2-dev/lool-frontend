import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function ConnectionNotice() {
  const { language } = useLanguage();
  const [offline, setOffline] = useState(() => !navigator.onLine);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  if (!offline) return null;
  return <div role="alert" dir={language === 'ar' ? 'rtl' : 'ltr'} className="fixed inset-x-3 top-3 z-[2000] mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-amber-400/50 bg-amber-950 px-4 py-3 text-sm font-bold text-amber-50 shadow-xl">
    <WifiOff className="h-5 w-5 shrink-0" />
    <span>{language === 'ar' ? 'انقطع اتصال الإنترنت، يرجى الاتصال بالإنترنت لإتمام العمليات بنجاح.' : 'You are offline. Connect to the internet to complete your operations.'}</span>
  </div>;
}
