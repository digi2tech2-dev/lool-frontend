import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../../services/client';
import { Users, Package, Shield, Search, X, CheckSquare, CircleDollarSign } from 'lucide-react';

// Reuse the individual endpoints so every change keeps its existing validation,
// authorization and audit trail. A batch may finish partially.
export default function BulkUserActions({ users, onClose, onRefresh, canManageUsers, canConfirmAccounts }) {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    apiClient.users.listProductVisibility(users[0].id)
      .then((rows) => { if (active) setProducts(Array.isArray(rows) ? rows : []); })
      .catch(() => { if (active) setMessage('تعذر تحميل المنتجات. يمكنك استخدام إجراءات الحسابات الأخرى.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [users]);
  const filtered = useMemo(() => products.filter((p) => String(p.name || '').toLowerCase().includes(search.trim().toLowerCase())), [products, search]);
  const toggle = (id) => setSelected((items) => items.includes(id) ? items.filter((v) => v !== id) : [...items, id]);
  const run = async (action) => {
    const descriptions = { apiOff: 'إيقاف API للحسابات', apiOn: 'تفعيل API للحسابات', suspend: 'رفض أو إيقاف الحسابات', delete: 'حذف الحسابات', price: 'تعيين السعر للمنتجات والمستخدمين', productApiOff: 'إخفاء المنتجات من API للمستخدمين', productApiOn: 'إظهار المنتجات في API للمستخدمين' };
    const productAction = ['price', 'productApiOff', 'productApiOn'].includes(action);
    if (productAction && !selected.length) { setMessage('حدد منتجًا واحدًا على الأقل.'); return; }
    const rawPrice = price.trim();
    if (action === 'price' && (!/^(?:0|[1-9]\d{0,17})(?:\.\d{1,50})?$/.test(rawPrice) || !/[1-9]/.test(rawPrice))) { setMessage('أدخل سعرًا نهائيًا موجبًا بالدولار.'); return; }
    const count = users.length * (productAction ? selected.length : 1);
    if (!window.confirm(`${descriptions[action]}؟\nعدد المستخدمين: ${users.length}${productAction ? ` · المنتجات: ${selected.length}` : ''}\nسيتم تنفيذ ${count} طلب.`)) return;
    setBusy(true); setDetails([]); setMessage('جارٍ تنفيذ العمليات، لا تغلق الصفحة.');
    let success = 0; const failed = [];
    for (const user of users) {
      for (const productId of productAction ? selected : [null]) {
        try {
          if (action === 'apiOff' || action === 'apiOn') await apiClient.users.updateProfile(user.id, { isApiEnabled: action === 'apiOn' });
          else if (action === 'suspend') await apiClient.users.updateStatus(user.id, 'rejected');
          else if (action === 'delete') await apiClient.users.delete(user.id);
          else if (action === 'price') await apiClient.users.setUserProductPrice(user.id, productId, rawPrice);
          else await apiClient.users.setUserProductApiVisibility(user.id, productId, action === 'productApiOff');
          success++;
        } catch (error) {
          const product = products.find((p) => p.id === productId);
          const code = error?.response?.data?.code || error?.code;
          const reason = code === 'CUSTOM_PRICE_BELOW_SUPPLIER' ? 'السعر أقل من سعر المورد' : code === 'SUPPLIER_PRICE_UNAVAILABLE' ? 'سعر المورد غير متاح' : error?.response?.data?.message || error?.message || 'تعذر التنفيذ';
          failed.push(`${user.name || user.email || user.id}${product ? ` / ${product.name}` : ''}: ${reason}`);
        }
      }
    }
    setMessage(`اكتمل التنفيذ: ${success} نجح، ${failed.length} فشل.`); setDetails(failed); setBusy(false); onRefresh?.();
  };
  const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-bold transition hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-45';
  return <section dir="rtl" className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_18px_50px_-35px_rgba(0,0,0,0.35)]">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
      <div className="flex items-start gap-3"><span className="rounded-2xl bg-[var(--color-primary)]/10 p-2.5 text-[var(--color-primary)]"><Users className="h-5 w-5" /></span><div><h2 className="text-base font-black">إجراءات جماعية</h2><p className="mt-1 text-xs text-[var(--color-text-secondary)]">إدارة الحسابات والمنتجات المحددة من مكان واحد</p></div></div>
      <button type="button" disabled={busy} onClick={onClose} className={button}><X className="h-4 w-4" /> إغلاق</button>
    </div>
    <div className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1.5 text-[var(--color-primary)]">{users.length} مستخدم محدد</span><span className="rounded-full bg-[var(--color-surface)] px-3 py-1.5">{selected.length} منتج محدد</span></div>
      <p className="break-words text-xs leading-6 text-[var(--color-text-secondary)]">{users.map((u) => u.name || u.email || u.id).join('، ')}</p>
      <div className="space-y-3 rounded-2xl border border-[var(--color-border)] p-4"><div className="flex items-center gap-2"><Shield className="h-4 w-4 text-[var(--color-primary)]" /><h3 className="text-sm font-black">إدارة الحسابات</h3></div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {canManageUsers && <><button type="button" className={button} disabled={busy} onClick={() => run('apiOff')}>إيقاف API</button><button type="button" className={button} disabled={busy} onClick={() => run('apiOn')}>تفعيل API</button><button type="button" className={`${button} text-red-600`} disabled={busy} onClick={() => run('delete')}>حذف المستخدمين</button></>}
          {canConfirmAccounts && <button type="button" className={`${button} text-red-600`} disabled={busy} onClick={() => run('suspend')}>رفض أو إيقاف الحسابات</button>}
        </div>
      </div>
      {canManageUsers && <div className="space-y-4 rounded-2xl border border-[var(--color-border)] p-4">
        <div className="flex items-center gap-2"><Package className="h-4 w-4 text-[var(--color-primary)]" /><div><h3 className="text-sm font-black">منتجات المستخدمين</h3><p className="mt-1 text-xs text-[var(--color-text-secondary)]">اختر المنتجات ثم حدد الإجراء الذي تريد تطبيقه.</p></div></div>
        <div className="relative"><Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث باسم المنتج" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-3 pr-10 text-sm" /></div>
        <div className="flex flex-wrap gap-2"><button type="button" disabled={busy || !filtered.length} className={button} onClick={() => setSelected((old) => [...new Set([...old, ...filtered.map((p) => p.id)])])}><CheckSquare className="h-4 w-4" /> تحديد نتائج البحث</button><button type="button" className={button} disabled={busy} onClick={() => setSelected([])}>إلغاء تحديد المنتجات</button></div>
        {loading ? <p className="text-sm">جارٍ تحميل المنتجات...</p> : <div className="max-h-56 space-y-1 overflow-auto rounded-xl bg-[var(--color-surface)] p-2">{filtered.length ? filtered.map((p) => <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2.5 text-sm hover:bg-[var(--color-card)]"><input type="checkbox" checked={selected.includes(p.id)} disabled={busy} onChange={() => toggle(p.id)} className="h-4 w-4 accent-[var(--color-primary)]" /><span>{p.name}</span></label>) : <p className="p-3 text-xs text-[var(--color-text-secondary)]">لا توجد منتجات مطابقة.</p>}</div>}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><button type="button" className={button} disabled={busy || !selected.length} onClick={() => run('productApiOff')}>إخفاء المحدد من API</button><button type="button" className={button} disabled={busy || !selected.length} onClick={() => run('productApiOn')}>إظهار المحدد في API</button></div>
        <div className="rounded-xl bg-[var(--color-surface)] p-3"><label htmlFor="bulk-user-price" className="mb-2 flex items-center gap-2 text-xs font-bold"><CircleDollarSign className="h-4 w-4" /> السعر النهائي بالدولار</label><div className="flex flex-wrap gap-2"><input id="bulk-user-price" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="مثال: 10.50" className="min-w-[10rem] flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-2.5 text-sm" /><button type="button" className={`${button} text-[var(--color-primary)]`} disabled={busy || !selected.length} onClick={() => run('price')}>تطبيق السعر</button></div><p className="mt-2 text-xs text-[var(--color-text-secondary)]">يُرفض السعر الأقل من سعر المورد حسب إعدادات كل منتج.</p></div>
      </div>}
      {message && <p role="status" className="rounded-xl bg-[var(--color-surface)] p-3 text-sm font-bold">{message}</p>}{details.length > 0 && <ul className="max-h-40 list-inside list-disc overflow-auto rounded-xl bg-red-50 p-3 text-xs text-red-700">{details.map((d, i) => <li key={`${i}-${d}`}>{d}</li>)}</ul>}
    </div>
  </section>;
}
