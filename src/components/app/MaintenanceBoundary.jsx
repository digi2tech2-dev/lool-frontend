import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import apiClient from '../../services/client';
import { useLanguage } from '../../context/LanguageContext';
import useAuthStore from '../../store/useAuthStore';

export default function MaintenanceBoundary({ children }) {
  const { language } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const { pathname } = useLocation();
  const [status, setStatus] = useState({ enabled: false, canBypass: false });
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const next = await apiClient.maintenance.getStatus();
        if (active && next) setStatus({ enabled: next.enabled === true, canBypass: next.canBypass === true });
      } catch { /* Keep the last confirmed state until the server is reachable. */ }
    };
    const updated = (event) => { if (active && event.detail) setStatus(event.detail); };
    refresh();
    const timer = window.setInterval(refresh, 10000);
    window.addEventListener('lool:maintenance-updated', updated);
    window.addEventListener('online', refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('lool:maintenance-updated', updated); window.removeEventListener('online', refresh); };
  }, [user]);
  const isAuth = ['/auth', '/login', '/email-verified'].includes(pathname);
  if (!status.enabled || status.canBypass || isAuth) return children;
  const ar = language === 'ar';
  return <main dir={ar ? 'rtl' : 'ltr'} className="fixed inset-0 z-[1000] grid min-h-[100dvh] place-items-center overflow-auto bg-[#071527] px-5 py-12 text-white">
    <section className="w-full max-w-xl rounded-[2rem] border border-violet-300/25 bg-[#241c37] p-8 text-center shadow-2xl sm:p-12">
      <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-cyan-400/15 text-cyan-200"><Wrench className="h-10 w-10" /></div>
      <p className="mb-3 text-xs font-black tracking-[.25em] text-violet-300">LOOL STORE</p>
      <h1 className="text-2xl font-black sm:text-3xl">{ar ? 'نعمل على تحسين تجربتك' : 'We are improving your experience'}</h1>
      <p className="mt-4 leading-7 text-slate-300">{ar ? 'الموقع تحت الصيانة مؤقتًا، سنعود للعمل قريبًا. شكرًا لصبرك.' : 'The store is temporarily under maintenance. We will be back soon.'}</p>
      <Link to="/auth" className="mt-7 inline-flex rounded-xl border border-cyan-300/40 px-5 py-2 text-sm font-bold text-cyan-100">{ar ? 'دخول الإدارة' : 'Admin sign in'}</Link>
    </section>
  </main>;
}
