import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, PackageSearch, Search, Upload, X } from 'lucide-react';
import apiClient from '../../services/client';
import { useLanguage } from '../../context/LanguageContext';

const input = 'w-full min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)]';
const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50';
// Keep each request bounded while allowing any number of selected products.
const PUBLISH_BATCH_SIZE = 10;

export default function ProductRecovery() {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState({ search: '', providerId: '', availability: 'all', sort: 'asc' });
  const [results, setResults] = useState({ items: [], total: 0, failures: [] });
  const [selected, setSelected] = useState({});
  const [settings, setSettings] = useState({});
  const [step, setStep] = useState('select');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const requestId = useRef(0);
  const pendingSearchTimer = useRef(null);
  const warningDialogRef = useRef(null);
  const publishingRef = useRef(false);

  useEffect(() => {
    const dialog = warningDialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    apiClient.productRecovery.providers()
      .then((data) => setProviders(data?.providers || []))
      .catch(() => setError(ar ? 'تعذر تحميل الموردين.' : 'Could not load providers.'));
  }, [ar]);

  useEffect(() => {
    let active = true;
    apiClient.categories.list()
      .then((items) => { if (active) setCategories(Array.isArray(items) ? items.filter((item) => item.isActive !== false) : []); })
      .catch(() => { if (active) setError(ar ? 'تعذر تحميل الأقسام.' : 'Could not load categories.'); });
    return () => { active = false; };
  }, [ar]);

  const search = async (nextPage = 1, refresh = false) => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.productRecovery.search({ ...query, page: nextPage, limit: 24, refresh });
      if (!data || !Array.isArray(data.items)) throw new Error('Invalid response');
      if (requestId.current === id) { setResults(data); setPage(nextPage); }
    } catch {
      if (requestId.current === id) setError(ar ? 'تعذر البحث في الموردين. حاول مرة أخرى.' : 'Could not search providers.');
    } finally { if (requestId.current === id) setLoading(false); }
  };

  useEffect(() => {
    if (!query.search.trim()) {
      requestId.current += 1;
      setLoading(false);
      setResults({ items: [], total: 0, failures: [] });
      setPage(1);
      return undefined;
    }
    pendingSearchTimer.current = setTimeout(() => { pendingSearchTimer.current = null; void search(1); }, 550);
    return () => { clearTimeout(pendingSearchTimer.current); pendingSearchTimer.current = null; };
    // Search is intentionally tied to input/filter changes, not response state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, ar]);

  const chosen = Object.values(selected);
  const toggle = (item) => {
    if (selected[item.key]) {
      setSelected((current) => { const next = { ...current }; delete next[item.key]; return next; });
      setError('');
      return;
    }
    setSelected((current) => ({ ...current, [item.key]: item }));
    setError('');
  };
  const setProductSetting = (key, patch) => setSettings((current) => ({ ...current, [key]: { ...current[key], ...patch } }));

  const publishSelected = async () => {
    if (publishingRef.current) return;
    setError(''); setNotice('');
    const missing = chosen.find((item) => !settings[item.key]?.file);
    if (missing) { setError(ar ? `أضف صورة للمنتج «${missing.name}» قبل التفعيل.` : `Add an image for “${missing.name}” before publishing.`); return; }
    const missingCategory = chosen.find((item) => !settings[item.key]?.mainCategoryId);
    if (missingCategory) { setError(ar ? `اختر قسمًا رئيسيًا للمنتج «${missingCategory.name}».` : `Select a main category for “${missingCategory.name}”.`); return; }
    const invalidMarkup = chosen.find((item) => {
      const value = String(settings[item.key]?.markupValue ?? '').trim();
      return value && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 1000000);
    });
    if (invalidMarkup) { setError(ar ? `أدخل هامش ربح صالحًا للمنتج «${invalidMarkup.name}» أو اتركه فارغًا.` : `Enter a valid markup for “${invalidMarkup.name}” or leave it empty.`); return; }
    publishingRef.current = true;
    setPublishing(true);
    setPublishProgress({ completed: 0, total: chosen.length });
    try {
      const published = [];
      const failed = [];
      for (let offset = 0; offset < chosen.length; offset += PUBLISH_BATCH_SIZE) {
        const batch = chosen.slice(offset, offset + PUBLISH_BATCH_SIZE);
        const products = [];
        for (const item of batch) {
          try {
            const image = await apiClient.productRecovery.uploadImage(settings[item.key].file);
            const setting = settings[item.key];
            products.push({ providerId: item.providerId, externalProductId: item.externalProductId, name: item.name, image,
              mainCategoryId: setting.mainCategoryId, subCategoryId: setting.subCategoryId || null,
              ...(String(setting.markupValue ?? '').trim() ? { markupValue: String(setting.markupValue).trim() } : {}) });
          } catch (uploadError) {
            failed.push({ key: item.key, name: item.name, message: uploadError?.message || (ar ? 'تعذر رفع الصورة' : 'Image upload failed') });
          }
        }
        if (products.length) {
          // If the response is lost, stop: the server may still be publishing this batch.
          const response = await apiClient.productRecovery.publish(products);
          if (!Array.isArray(response?.published) || !Array.isArray(response?.failed)) throw new Error(ar ? 'تعذر تأكيد نتيجة الدفعة. راجع المنتجات المنشورة قبل إعادة المحاولة.' : 'Could not confirm the batch result. Check published products before retrying.');
          published.push(...response.published);
          failed.push(...response.failed);
          const completed = new Set(response.published.map((entry) => entry.key));
          setSelected((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !completed.has(key))));
          setSettings((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !completed.has(key))));
        }
        setPublishProgress({ completed: Math.min(offset + batch.length, chosen.length), total: chosen.length });
      }
      if (failed.length) {
        setError(ar ? `تم تفعيل ${published.length} منتج، وتعذر تفعيل ${failed.length}: ${failed.map((entry) => `${entry.name}: ${entry.message}`).join('، ')}` : `Published ${published.length}; ${failed.length} failed: ${failed.map((entry) => `${entry.name}: ${entry.message}`).join('; ')}`);
      } else {
        setNotice(ar ? `تم تفعيل ${published.length} منتج بنجاح.` : `${published.length} products published successfully.`);
        setStep('select');
      }
    } catch { setError(ar ? 'تعذر تأكيد نتيجة آخر دفعة. راجع المنتجات المنشورة قبل إعادة المحاولة؛ قد يستمر الخادم في معالجتها.' : 'The last batch result could not be confirmed. Check published products before retrying; the server may still be processing it.'); }
    finally { publishingRef.current = false; setPublishing(false); setPublishProgress(null); }
  };

  const PreviousIcon = ar ? ArrowRight : ArrowLeft;
  return (
    <main dir={ar ? 'rtl' : 'ltr'} className="mx-auto max-w-7xl space-y-5 px-3 py-5 sm:px-6">
      <dialog ref={warningDialogRef} aria-labelledby="recovery-currency-warning-title" aria-describedby="recovery-currency-warning-message" onCancel={(event) => event.preventDefault()} className="fixed inset-0 m-auto w-[92vw] max-w-md rounded-2xl border border-amber-500/40 bg-[var(--color-card)] p-0 text-[var(--color-text)] shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm">
        <div className="space-y-4 p-5 sm:p-6">
          <h2 id="recovery-currency-warning-title" className="text-lg font-black text-amber-600">{ar ? 'تنبيه هام' : 'Important notice'}</h2>
          <p id="recovery-currency-warning-message" className="text-sm leading-7">{ar ? 'يرجى التأكد أن جميع الموردين بعملة الدولار، وإذا كان غير ذلك يُنصح بعدم استخدام استرداد المنتجات. شكرًا لتفهمكم.' : 'Please make sure all suppliers use US dollars. If any supplier uses another currency, we recommend not using product recovery. Thank you for your understanding.'}</p>
          <form method="dialog" className="flex justify-end"><button autoFocus type="submit" className="rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white">{ar ? 'موافق' : 'OK'}</button></form>
        </div>
      </dialog>
      <header className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 to-cyan-950 p-5 text-white">
        <PackageSearch className="mb-3 h-8 w-8 text-cyan-300" /><h1 className="text-2xl font-black">{ar ? 'استرداد المنتجات' : 'Product recovery'}</h1>
        <p className="mt-2 text-sm text-slate-300">{ar ? 'ابحث واختر المنتجات، ثم أضف الصور لتفعيلها. هامش الربح اختياري.' : 'Search and select products, then add images to publish them. Markup is optional.'}</p>
      </header>
      {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700">{notice}</p>}

      {step === 'select' ? <>
        <form onSubmit={(event) => { event.preventDefault(); clearTimeout(pendingSearchTimer.current); pendingSearchTimer.current = null; void search(1, true); }} className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <div className="grid grid-cols-3 items-end gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 2xl:grid-cols-5">
            <label className="col-span-2 min-w-0 order-1 sm:col-span-2 2xl:order-1 2xl:col-span-1"><span className="mb-1 block text-xs font-bold">{ar ? 'اسم المنتج' : 'Product name'}</span><input className={input} value={query.search} onChange={(event) => setQuery({ ...query, search: event.target.value })} maxLength={120} /></label>
            <label className="min-w-0 order-2 2xl:order-2"><span className="mb-1 block text-[10px] leading-tight font-bold sm:text-xs">{ar ? 'الترتيب' : 'Sort'}</span><select className={input} value={query.sort} onChange={(event) => setQuery({ ...query, sort: event.target.value })}><option value="asc">{ar ? 'الأقل سعرًا' : 'Lowest price'}</option><option value="desc">{ar ? 'الأعلى سعرًا' : 'Highest price'}</option></select></label>
            <button aria-label={ar ? 'بحث' : 'Search'} className={button + ' order-5 col-span-1 min-h-[2.65rem] w-full bg-[var(--color-primary)] text-white 2xl:order-5 2xl:col-span-1'} disabled={loading}><Search className="h-4 w-4" />{loading ? (ar ? 'جارٍ البحث...' : 'Searching...') : (ar ? 'بحث' : 'Search')}</button>
          </div>
          <div className="contents">
            <label className="min-w-0 order-3 2xl:order-3"><span className="mb-1 block text-[10px] leading-tight font-bold sm:text-xs">{ar ? 'المورد' : 'Supplier'}</span><select className={input} value={query.providerId} onChange={(event) => setQuery({ ...query, providerId: event.target.value })}><option value="">{ar ? 'كل الموردين' : 'All suppliers'}</option>{providers.map((provider) => <option key={provider._id} value={provider._id}>{provider.name}</option>)}</select></label>
            <label className="min-w-0 order-4 2xl:order-4"><span className="mb-1 block text-[10px] leading-tight font-bold sm:text-xs">{ar ? 'التوفر' : 'Availability'}</span><select className={input} value={query.availability} onChange={(event) => setQuery({ ...query, availability: event.target.value })}><option value="all">{ar ? 'الكل' : 'All'}</option><option value="available">{ar ? 'متاح' : 'Available'}</option><option value="unavailable">{ar ? 'غير متاح' : 'Unavailable'}</option></select></label>
          </div>
        </form>
        {results.failures?.length > 0 && <div role="status" className="rounded-xl bg-amber-500/10 p-3 text-sm">{ar ? 'تعذر الوصول إلى بعض الموردين:' : 'Some suppliers could not be reached:'} {results.failures.map((failure) => failure.providerName).join('، ')}</div>}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="space-y-3"><div className="flex justify-between text-sm font-bold"><span>{ar ? 'النتائج' : 'Results'}: {results.total}</span><span>{ar ? 'صفحة' : 'Page'} {page}</span></div>
            {results.items.map((item) => <article key={item.key} className="flex min-w-0 gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
              <input type="checkbox" className="h-5 w-5 shrink-0" aria-label={(ar ? 'تحديد ' : 'Select ') + item.name + ' ' + item.providerName} checked={Boolean(selected[item.key])} onChange={() => toggle(item)} />
              {item.image && <img src={item.image} alt="" className="h-14 w-14 rounded-xl object-cover" referrerPolicy="no-referrer" />}
              <div className="min-w-0 flex-1"><h2 className="break-words font-black">{item.name}</h2><p className="mt-1 text-xs text-[var(--color-text-secondary)]">{ar ? 'المورد:' : 'Supplier:'} {item.providerName} · {item.available === null ? (ar ? 'التوفر غير مؤكد' : 'Availability unconfirmed') : item.available ? (ar ? 'متاح' : 'Available') : (ar ? 'غير متاح' : 'Unavailable')}</p><p className="mt-1 text-sm font-bold">{item.price != null ? String(item.price) + (item.currency ? ' ' + item.currency : '') : (ar ? 'السعر غير متاح من المورد' : 'Supplier price unavailable')}</p><p className="text-xs text-[var(--color-text-secondary)]">{item.limitsVerified ? String(item.minQty) + ' – ' + String(item.maxQty) : (ar ? 'الحدود تحتاج مراجعة' : 'Limits need review')}</p>{item.description && <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">{item.description}</p>}</div>
            </article>)}
            <div className="flex gap-2"><button type="button" className={button} disabled={loading || page <= 1} onClick={() => search(page - 1)}>{ar ? 'السابق' : 'Previous'}</button><button type="button" className={button} disabled={loading || page * 24 >= results.total} onClick={() => search(page + 1)}>{ar ? 'التالي' : 'Next'}</button></div>
          </section>
          <aside className="h-fit rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4"><h2 className="font-black">{ar ? 'المنتجات المختارة' : 'Selected products'} ({chosen.length})</h2>
            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">{chosen.map((item) => <div key={item.key} className="flex items-center justify-between gap-2 rounded-xl bg-[var(--color-surface)] p-2 text-sm"><span className="min-w-0 break-words">{item.name} · {item.providerName}</span><button type="button" aria-label={ar ? 'إزالة' : 'Remove'} onClick={() => toggle(item)}><X className="h-4 w-4" /></button></div>)}</div>
            <p className="mt-3 text-xs text-[var(--color-text-secondary)]">{ar ? 'يمكنك اختيار العدد الذي تريده؛ سيتم النشر على دفعات تلقائيًا.' : 'Select as many products as you need; publishing runs in batches automatically.'}</p>
            <button type="button" className={button + ' mt-4 w-full bg-[var(--color-primary)] text-white'} disabled={!chosen.length || publishing} onClick={() => { setError(''); setNotice(''); setStep('configure'); }}>{ar ? 'التالي لإضافة الصور' : 'Next: add images'}</button>
          </aside>
        </div>
      </> : <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black">{ar ? 'تجهيز المنتجات للنشر' : 'Prepare products for publishing'}</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{ar ? 'أضف صورة لكل منتج. السعر والاسم والحدود مرتبطة بمزامنة المورد، وهامش الربح اختياري.' : 'Add an image for each product. Name, price and limits sync with the supplier; markup is optional.'}</p></div><span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-sm font-bold">{chosen.length} {ar ? 'منتج' : 'products'}</span></div>
        <div className="space-y-3">{chosen.map((item) => { const setting = settings[item.key] || {}; return <article key={item.key} className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.75fr)]">
          <div className="flex min-w-0 items-start gap-3">{setting.preview ? <img src={setting.preview} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" /> : <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-[var(--color-card)] text-[var(--color-text-secondary)]"><ImagePlus className="h-7 w-7" /></div>}<div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-black">{item.name}</h3><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-700">{ar ? 'مزامنة المورد مفعّلة' : 'Supplier sync enabled'}</span></div><p className="mt-1 text-xs text-[var(--color-text-secondary)]">{item.providerName}</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3"><div className="rounded-lg bg-[var(--color-card)] p-2"><span className="block text-[var(--color-text-secondary)]">{ar ? 'سعر المورد' : 'Supplier price'}</span><b>{item.price ?? '—'} {item.currency || ''}</b></div><div className="rounded-lg bg-[var(--color-card)] p-2"><span className="block text-[var(--color-text-secondary)]">{ar ? 'الحد الأدنى' : 'Minimum'}</span><b>{item.minQty ?? '—'}</b></div><div className="rounded-lg bg-[var(--color-card)] p-2"><span className="block text-[var(--color-text-secondary)]">{ar ? 'الحد الأقصى' : 'Maximum'}</span><b>{item.maxQty ?? '—'}</b></div></div></div></div>
          <div className="space-y-3"><label className="block text-sm font-bold">{ar ? 'القسم الرئيسي (مطلوب)' : 'Main category (required)'}<select className={`${input} mt-2`} value={setting.mainCategoryId || ''} onChange={(event) => setProductSetting(item.key, { mainCategoryId: event.target.value, subCategoryId: '' })}><option value="">{ar ? 'اختر القسم الرئيسي' : 'Select a main category'}</option>{categories.filter((category) => !category.parentCategory).map((category) => <option key={category.id} value={category.id}>{category.nameAr || category.name}</option>)}</select></label><label className="block text-sm font-bold">{ar ? 'القسم الفرعي (اختياري)' : 'Subcategory (optional)'}<select className={`${input} mt-2`} value={setting.subCategoryId || ''} disabled={!setting.mainCategoryId} onChange={(event) => setProductSetting(item.key, { subCategoryId: event.target.value })}><option value="">{ar ? 'بدون قسم فرعي' : 'No subcategory'}</option>{categories.filter((category) => String(category.parentCategory || '') === String(setting.mainCategoryId || '')).map((category) => <option key={category.id} value={category.id}>{category.nameAr || category.name}</option>)}</select></label><label className="block text-sm font-bold">{ar ? 'صورة المنتج (مطلوبة)' : 'Product image (required)'}<input className={`${input} mt-2`} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0] || null; if (file && file.size > 8 * 1024 * 1024) { setError(ar ? 'حجم الصورة لا يتجاوز 8 ميجابايت.' : 'Image size must be 8 MB or less.'); event.target.value = ''; return; } setError(''); setProductSetting(item.key, { file, preview: file ? URL.createObjectURL(file) : '' }); }} /></label><label className="block text-sm font-bold">{ar ? 'هامش ربح بالدولار (اختياري)' : 'Profit margin in USD (optional)'}<input className={`${input} mt-2`} type="number" min="0" step="0.000001" inputMode="decimal" placeholder="0" value={setting.markupValue ?? ''} onChange={(event) => setProductSetting(item.key, { markupValue: event.target.value })} /></label></div>
        </article>; })}</div>
        {publishProgress && <p role="status" className="text-sm font-semibold">{ar ? `جارٍ معالجة ${publishProgress.completed} من ${publishProgress.total}` : `Processed ${publishProgress.completed} of ${publishProgress.total}`}</p>}
        <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--color-border)] pt-4"><button type="button" className={button} disabled={publishing} onClick={() => setStep('select')}><PreviousIcon className="h-4 w-4" />{ar ? 'رجوع للاختيار' : 'Back to selection'}</button><button type="button" className={button + ' bg-[var(--color-primary)] text-white'} disabled={publishing || !chosen.length || chosen.some((item) => !settings[item.key]?.file)} onClick={publishSelected}><Upload className="h-4 w-4" />{publishing ? (ar ? 'جارٍ رفع الصور ونشر الكل...' : 'Uploading and publishing all...') : (ar ? 'نشر كل المنتجات' : 'Publish all products')}</button></div>
      </section>}
    </main>
  );
}
