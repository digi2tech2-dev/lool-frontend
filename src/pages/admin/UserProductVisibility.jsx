import React, { useEffect, useState } from 'react';
import apiClient from '../../services/client';

export default function UserProductVisibility({ userId, standalone = false }) {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setProducts([]);
    setError('');
    setLoading(Boolean(userId));
    if (userId) apiClient.users.listProductVisibility(userId)
      .then((rows) => { if (active) { const list = Array.isArray(rows) ? rows : []; setProducts(list); setPrices(Object.fromEntries(list.map((item) => [item.id, item.priceOverride ?? '']))); } })
      .catch(() => { if (active) setError('تعذر تحميل المنتجات. تأكد من صلاحية المستخدم واتصال الباك إند.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  const toggle = async (item) => {
    setBusy(item.id);
    setError('');
    try {
      await apiClient.users.setProductVisibility(userId, item.id, !item.hidden);
      setProducts((rows) => rows.map((row) => row.id === item.id ? { ...row, hidden: !row.hidden } : row));
    } catch {
      setError('تعذر حفظ إعداد المنتج. حاول مرة أخرى.');
    } finally { setBusy(''); }
  };

  const savePrice = async (item) => {
    const raw = String(prices[item.id] ?? '').trim();
    if (raw && (!/^(?:0|[1-9]\d{0,17})(?:\.\d{1,50})?$/.test(raw) || !/[1-9]/.test(raw))) { setError('أدخل سعرًا موجبًا صالحًا أو اترك الخانة فارغة.'); return; }
    setBusy(item.id);
    setError('');
    try {
      const result = await apiClient.users.setUserProductPrice(userId, item.id, raw || null);
      setProducts((rows) => rows.map((row) => row.id === item.id ? { ...row, priceOverride: result.priceOverride, effectiveCustomPrice: result.priceOverride, followsSupplier: false } : row));
    } catch (cause) {
      const code = cause?.response?.data?.code || cause?.code;
      if (code === 'CUSTOM_PRICE_BELOW_SUPPLIER') setError('لا يمكن أن يكون السعر الخاص أقل من آخر سعر مسجل من المورد.');
      else if (code === 'SUPPLIER_PRICE_UNAVAILABLE') setError('سعر المورد غير متاح أو غير صالح. حدّث سعر المورد قبل إضافة سعر خاص.');
      else setError('تعذر حفظ السعر. تأكد من الصلاحيات وحاول مرة أخرى.');
    }
    finally { setBusy(''); }
  };

  const toggleApi = async (item) => {
    setBusy(item.id);
    setError('');
    try {
      await apiClient.users.setUserProductApiVisibility(userId, item.id, !item.apiHidden);
      setProducts((rows) => rows.map((row) => row.id === item.id ? { ...row, apiHidden: !row.apiHidden } : row));
    } catch { setError('تعذر حفظ إعداد إخفاء المنتج من API.'); }
    finally { setBusy(''); }
  };

  return <section className="mt-4 rounded-2xl border border-[var(--color-border)] p-3">
    <h3 className="font-bold">المنتجات المتاحة لهذا المستخدم</h3>
    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">المنتج المخفي لا يظهر للمستخدم ولا يمكنه طلبه.</p>
    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">يمكن أيضًا إخفاء المنتج من API لهذا المستخدم فقط مع بقائه في الموقع.</p>
    <input className="mt-3 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن منتج" />
    {error && <p role="alert" className="mt-2 text-sm text-red-500">{error}</p>}
    {loading && <p role="status" className="mt-3 text-sm">جارٍ تحميل المنتجات...</p>}
    {!loading && !error && !products.length && <p className="mt-3 text-sm text-[var(--color-text-secondary)]">لا توجد منتجات متاحة.</p>}
    <div className={standalone ? "mt-2 space-y-2" : "mt-2 max-h-96 space-y-2 overflow-y-auto"}>{products.filter((item) => String(item.name || '').toLowerCase().includes(query.toLowerCase())).map((item) => <div key={item.id} className="space-y-2 rounded-lg border border-[var(--color-border)] p-3"><div className="flex items-center justify-between gap-3"><span className="text-sm font-bold">{item.name}</span><button type="button" disabled={Boolean(busy)} onClick={() => toggleApi(item)} className="rounded-lg border border-[var(--color-border)] px-3 py-1 text-xs font-bold">{item.apiHidden ? 'إظهار في API' : 'إخفاء من API'}</button><button type="button" disabled={Boolean(busy)} onClick={() => toggle(item)} className="rounded-lg border border-[var(--color-border)] px-3 py-1 text-xs font-bold">{busy === item.id ? 'جارٍ الحفظ' : item.hidden ? 'إظهار' : 'إخفاء'}</button></div><div className="grid grid-cols-2 gap-2 text-xs"><span>آخر سعر مسجل من المورد: {item.supplierPrice ?? 'غير متاح'}</span><span>سعر البيع الأساسي: {item.basePrice ?? 'غير متاح'} USD</span><span>نسبة المجموعة: {item.groupPercentage ?? 'غير متاحة'}%</span><span>بعد النسبة: {item.groupPrice ?? 'غير متاح'} USD</span><span>السعر الخاص المحفوظ: {item.priceOverride ?? 'غير محدد'} {item.priceOverride != null ? 'USD' : ''}</span>{item.followsSupplier && <span className="col-span-2 font-bold text-amber-600">السعر الجاري بعد ارتفاع المورد ونسبة المجموعة: {item.effectiveCustomPrice} USD</span>}</div>{item.billingMode === 'quantity_only' ? <p className="text-xs">هذه المجموعة تعمل بنظام الكميات دون تسعير.</p> : <div><label className="block text-xs font-bold" htmlFor={`user-price-${item.id}`}>السعر النهائي الخاص بالدولار (اختياري)</label><div className="mt-1 flex gap-2"><input id={`user-price-${item.id}`} type="text" inputMode="decimal" value={prices[item.id] ?? ''} onChange={(event) => setPrices((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="اتركه فارغًا لسعر المجموعة" className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-sm" /><button type="button" disabled={Boolean(busy)} onClick={() => savePrice(item)} className="rounded-lg border border-[var(--color-border)] px-3 py-1 text-xs font-bold">حفظ السعر</button></div></div>}</div>)}</div>
  </section>;
}
