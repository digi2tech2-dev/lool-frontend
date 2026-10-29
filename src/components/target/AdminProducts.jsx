import React, { useEffect, useState } from 'react';
import { Boxes, Edit3, Plus, Trash2 } from 'lucide-react';
import { resolveImageUrl } from '../../utils/imageUrl';
import coinsImage from '../../assets/lool-store-logo.webp';
import Button, { cn } from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import UploadProof from './UploadProof';
import { formatNumber } from '../../utils/intl';
import { isPaymentMethodAllowed } from '../../utils/paymentSettings';

const ProductModal = ({ isOpen, onClose, product, paymentMethods, onSave }) => {
  const [name, setName] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [image, setImage] = useState(null);
  const [paymentMethodIds, setPaymentMethodIds] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    const allowedValues = product?.allowedPaymentMethods || product?.paymentMethodIds || [];
    const selectedIds = product
      ? paymentMethods
          .filter((method) => isPaymentMethodAllowed(method, allowedValues))
          .map((method) => method.id)
      : paymentMethods.map((method) => method.id);

    setName(product?.name || '');
    setTargetAccountId(
      product?.targetAccountId
      || product?.receivingAccountId
      || product?.receiverAccountId
      || product?.recipientAccountId
      || product?.targetRecipientId
      || product?.receivingAccount
      || product?.targetAccount
      || product?.destinationAccountId
      || product?.accountId
      || product?.accountNumber
      || ''
    );
    setUnitPrice(product?.unitPrice ? String(product.unitPrice) : '');
    setImage(product?.image ? { preview: product.image, fileName: 'صورة التطبيق' } : null);
    setPaymentMethodIds(selectedIds);
  }, [isOpen, paymentMethods, product]);

  const togglePayment = (id) => {
    setPaymentMethodIds((current) => (
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    ));
  };

  const handleSave = () => {
    if (!name.trim() || !Number(unitPrice) || !paymentMethodIds.length) return;
    onSave({
      name: name.trim(),
      targetAccountId: targetAccountId.trim(),
      receivingAccountId: targetAccountId.trim(),
      unitPrice: Number(unitPrice),
      image: image?.file || image?.preview || '',
      imageFile: image?.file || null,
      imagePreview: image?.preview || '',
      allowedPaymentMethods: paymentMethodIds,
      paymentMethodIds,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'تعديل التطبيق' : 'إضافة منتج / تطبيق'}
      size="lg"
      footer={(
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button type="button" onClick={handleSave} disabled={!paymentMethods.length || !paymentMethodIds.length}>
            {product ? 'حفظ التعديل' : 'حفظ التطبيق'}
          </Button>
        </div>
      )}
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="اسم التطبيق" value={name} onChange={(event) => setName(event.target.value)} placeholder="مثال: PUBG Mobile" />
          <Input label="آيدي الحساب المستلم" value={targetAccountId} onChange={(event) => setTargetAccountId(event.target.value)} placeholder="ادخل آيدي الحساب" />
          <Input label="سعر الدولار" type="number" min="0" step="0.01" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} placeholder="مثال: 48" suffix="EGP" />
        </div>

        <UploadProof label="صورة التطبيق" value={image} onChange={setImage} />

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--color-text)]">طرق الدفع المتاحة</p>
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              اختر طريقة أو أكثر
            </span>
          </div>
          {paymentMethods.length ? (
            <div className="grid gap-2 sm:grid-cols-3">
              {paymentMethods.map((method) => {
                const checked = paymentMethodIds.includes(method.id);
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => togglePayment(method.id)}
                    className={cn(
                      'rounded-2xl border px-4 py-3 text-sm font-bold transition hover:-translate-y-0.5',
                      checked
                        ? 'border-indigo-500/55 bg-indigo-500/10 text-indigo-500'
                        : 'border-[color:rgb(var(--color-border-rgb)/0.82)] bg-[color:rgb(var(--color-card-rgb)/0.72)] text-[var(--color-text-secondary)]'
                    )}
                  >
                    {method.name}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[color:rgb(var(--color-border-rgb)/0.82)] p-4 text-sm text-[var(--color-text-secondary)]">
              لا توجد طرق دفع مفعّلة من لوحة طرق الدفع حاليًا.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

const AdminProducts = ({ products, paymentMethods, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const openCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSave = (payload) => {
    if (editingProduct) {
      onUpdate(editingProduct.id, payload);
      return;
    }
    onAdd(payload);
  };

  return (
    <section className="space-y-4 rounded-[1.6rem] border border-sky-500/15 bg-[radial-gradient(28rem_circle_at_top_left,rgb(14_165_233/0.07),transparent_52%),rgb(var(--color-card-rgb)/0.72)] p-4 shadow-[0_24px_70px_-56px_rgb(14_165_233/0.55)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500 ring-1 ring-sky-500/15">
            <Boxes className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-base font-black text-[var(--color-text)] sm:text-lg">تطبيقات التارجت</h2>
            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">إضافة التطبيقات وتعديل أسعار الدولار وطرق الاستلام.</p>
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={openCreate} className="h-10 rounded-xl border-sky-500/25 bg-sky-500/10 px-4 text-xs text-sky-500 hover:border-sky-500/40 hover:bg-sky-500/15">
          <Plus className="h-4 w-4" />
          إضافة منتج / تطبيق
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <article
            key={product.id}
            className="group overflow-hidden rounded-[1.25rem] border border-sky-500/15 bg-[linear-gradient(180deg,rgb(var(--color-card-rgb)/0.98),rgb(var(--color-elevated-rgb)/0.76))] shadow-[0_18px_46px_-38px_rgb(14_165_233/0.35)] transition duration-200 hover:-translate-y-0.5 hover:border-sky-500/35"
          >
            <div className="relative h-28 overflow-hidden">
              {product.image ? (
                <img src={resolveImageUrl(product.image)} alt={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[color:rgb(var(--color-surface-rgb)/0.78)] text-[var(--color-primary)]">
                  <img src={coinsImage} alt="عملات" className="h-14 w-14 object-contain" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
              <span className={cn(
                'absolute right-2.5 top-2.5 rounded-lg border px-2 py-1 text-[9px] font-black backdrop-blur-md',
                product.isActive === false
                  ? 'border-rose-400/30 bg-rose-500/20 text-rose-200'
                  : 'border-emerald-400/30 bg-emerald-500/20 text-emerald-100'
              )}>
                {product.isActive === false ? 'غير نشط' : 'نشط'}
              </span>
            </div>
            <div className="p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black text-[var(--color-text)]">{product.name}</h3>
                  <p className="mt-1 text-xs font-black text-sky-500">
                    {formatNumber(product.unitPrice, 'en-US', { maximumFractionDigits: 2 })} EGP / دولار
                  </p>
                  {(product.targetAccountId || product.receivingAccountId) ? (
                    <p className="mt-1.5 truncate text-[10px] font-semibold text-[var(--color-text-secondary)]" title={product.targetAccountId || product.receivingAccountId}>
                      ID الاستلام: {product.targetAccountId || product.receivingAccountId}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button type="button" size="icon" variant="secondary" className="h-8 w-8 rounded-lg border-sky-500/20 bg-sky-500/[0.07] text-sky-500" onClick={() => openEdit(product)} title="تعديل">
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" size="icon" variant="danger" className="h-8 w-8 rounded-lg" onClick={() => onDelete(product.id)} title="حذف">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[color:rgb(var(--color-border-rgb)/0.58)] pt-3">
                {paymentMethods
                  .filter((method) => isPaymentMethodAllowed(method, product.allowedPaymentMethods || product.paymentMethodIds || []))
                  .map((method) => (
                    <span key={method.id} className="rounded-md border border-indigo-500/15 bg-indigo-500/[0.07] px-2 py-1 text-[9px] font-bold text-indigo-500">
                      {method.name}
                    </span>
                  ))}
              </div>
            </div>
          </article>
        ))}
        {!products.length ? (
          <div className="col-span-full rounded-[1.25rem] border border-dashed border-sky-500/20 bg-sky-500/[0.04] px-4 py-10 text-center text-sm text-[var(--color-text-secondary)]">
            لا توجد تطبيقات تارجت حتى الآن.
          </div>
        ) : null}
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={editingProduct}
        paymentMethods={paymentMethods}
        onSave={handleSave}
      />
    </section>
  );
};

export default AdminProducts;
