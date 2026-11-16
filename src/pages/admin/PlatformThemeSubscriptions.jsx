import React from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function PlatformThemeSubscriptions() {
  const { language } = useLanguage();
  const arabic = language === 'ar';
  const features = arabic
    ? ['كل الثيمات والألوان والوضع الفاتح والغامق', 'قوالب الهيدر والسايدبار والنافبار وتعديل المقاسات', 'تغيير الشعار وصور السلايدر', 'تأثيرات النيون والأقسام المتحركة', 'تعديل النصوص العربية والإنجليزية', 'تغيير أرقام التواصل والإشعارات', 'معاينة مباشرة ونشر واسترجاع الإصدارات']
    : ['All themes, colors, and light and dark modes', 'Header, sidebar, and navbar templates with sizing controls', 'Logo and slider image changes', 'Neon effects and animated sections', 'Arabic and English text editing', 'Contact and notification number changes', 'Live preview, publishing, and version restore'];

  return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
    <section className="overflow-hidden rounded-3xl border border-emerald-500/25 bg-[var(--color-card)] shadow-xl">
      <div className="bg-gradient-to-br from-emerald-500/15 via-[var(--color-card)] to-cyan-500/10 p-6 sm:p-10">
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600"><Sparkles /></span>
        <p className="text-sm font-black uppercase tracking-widest text-emerald-600">{arabic ? 'مظهر المنصة' : 'Platform theme'}</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--color-text)]">{arabic ? 'كل المميزات مجانية' : 'Every feature is free'}</h1>
        <p className="mt-3 max-w-2xl leading-7 text-[var(--color-text-secondary)]">{arabic ? 'استخدم جميع أدوات تخصيص المنصة بلا اشتراك أو دفع أو كود تفعيل.' : 'Use every platform customization tool without a subscription, payment, or activation code.'}</p>
      </div>
      <div className="grid gap-3 p-6 sm:grid-cols-2 sm:p-10">{features.map((feature) => <div key={feature} className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"><Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><span className="text-sm font-semibold text-[var(--color-text)]">{feature}</span></div>)}</div>
      <div className="flex justify-center border-t border-[var(--color-border)] p-6"><Link to="/admin/themes" className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 font-bold text-white"><ArrowLeft className="h-4 w-4" />{arabic ? 'افتح محرر مظهر المنصة' : 'Open theme editor'}</Link></div>
    </section>
  </main>;
}
