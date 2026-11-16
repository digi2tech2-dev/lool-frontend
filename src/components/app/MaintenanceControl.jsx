import React, { useEffect, useState } from 'react';
import { ShieldCheck, Wrench } from 'lucide-react';
import apiClient from '../../services/client';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../ui/Toast';

export default function MaintenanceControl() {
  const { language } = useLanguage();
  const { addToast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const ar = language === 'ar';
  useEffect(() => {
    let active = true;
    apiClient.maintenance.getStatus().then((value) => { if (active && value) { setEnabled(value.enabled === true); setLoaded(true); } }).catch(() => {});
    return () => { active = false; };
  }, []);
  const toggle = async () => {
    setBusy(true);
    try {
      const next = await apiClient.maintenance.setEnabled(!enabled);
      setEnabled(next.enabled === true);
      window.dispatchEvent(new CustomEvent('lool:maintenance-updated', { detail: { enabled: next.enabled === true, canBypass: next.canBypass === true } }));
      addToast(ar ? 'تم تحديث وضع الصيانة' : 'Maintenance mode updated', 'success');
    } catch { addToast(ar ? 'تعذر تحديث وضع الصيانة. تحقق من الاتصال والصلاحيات.' : 'Could not update maintenance mode.', 'error'); }
    finally { setBusy(false); }
  };
  return <section className="rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-slate-900 to-cyan-950 p-5 text-white shadow-lg">
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-200"><Wrench /></span><div><h2 className="font-black">{ar ? 'التحكم في وضع الصيانة' : 'Maintenance control'}</h2><p className="mt-1 text-xs text-slate-300">{ar ? 'أوقف وصول العملاء مؤقتًا مع استمرار دخول الإدارة.' : 'Temporarily pause customer access while keeping admin access.'}</p></div></div><span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs"><ShieldCheck className="h-4 w-4" />{!loaded ? (ar ? 'جارٍ التحميل' : 'Loading') : enabled ? (ar ? 'الصيانة مفعلة' : 'Maintenance on') : (ar ? 'الموقع يعمل' : 'Store online')}</span></div>
    <button type="button" onClick={toggle} disabled={!loaded || busy} className="mt-5 rounded-xl bg-cyan-300 px-5 py-2 text-sm font-black text-slate-950 disabled:opacity-50">{enabled ? (ar ? 'إيقاف الصيانة' : 'Disable maintenance') : (ar ? 'تفعيل الصيانة' : 'Enable maintenance')}</button>
  </section>;
}
