import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Check, Copy, FileText, Heart, LockKeyhole, Package, ShoppingBag, ShoppingCart, UserRound, WalletCards, X, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useFavoritesStore, { favoriteUserKey } from '../../store/useFavoritesStore';
import useMediaStore from '../../store/useMediaStore';
import useOrderStore from '../../store/useOrderStore';
import useSystemStore from '../../store/useSystemStore';
import apiClient from '../../services/client';
import { useToast } from '../ui/Toast';
import { useLanguage } from '../../context/LanguageContext';
import { resolveImageUrl } from '../../utils/imageUrl';
import brandLogoDark from '../../assets/lool-store-logo.webp';
import {
  calculateProductPrice,
  formatCurrencyAmount,
  getCurrencyMeta,
  resolveProductUnitPrice,
} from '../../utils/pricing';
import { getReadableErrorMessage } from '../../utils/errorMessages';
import {
  clampProductQuantity,
  getProductQuantityMeta,
  resolveProductOrderFields,
  sanitizeOrderFieldValue,
} from '../../utils/productPurchase';
import { getWalletBalanceSummary, normalizeMoneyAmount } from '../../utils/money';
import { devLogger } from '../../utils/devLogger';
import { useBodyScrollLock } from '../../utils/bodyScrollLock';
import AddBalance from '../../pages/AddBalance';
import PaymentDetails from '../../pages/PaymentDetails';
import './ProductPurchaseDialog.css';
import './ProductPurchaseOscar.css';

const isInstantMockCheckout = (import.meta.env.VITE_DATA_PROVIDER || 'mock').toLowerCase() === 'mock';

const truncatePurchaseTotal = (amount) => {
  const value = String(amount);
  const match = value.match(/^(-?\d+)\.(\d{3,})$/);
  return match ? Number(`${match[1]}.${match[2].slice(0, 2)}`) : amount;
};

const getCopy = (language = 'ar') => (
  language === 'en'
    ? {
        available: 'Available',
        unavailable: 'Unavailable',
        priceUnavailable: 'Price is temporarily unavailable. Please try again later.',
        unitPrice: 'Unit Price',
        agentProductId: 'Agent ID',
        accountNumber: 'Receiver Account ID',
        total: 'Total',
        purchaseSummary: 'Purchase summary',
        usdEquivalent: 'USD equivalent',
        usdSettlementNote: 'Base platform price in USD',
        shippingNotice: 'Shipping is completed within a few seconds',
        quantity: 'Quantity',
        quantityPlaceholder: 'Enter quantity',
        minQuantity: 'Min',
        maxQuantity: 'Max',
        userId: 'User ID',
        userIdPlaceholder: 'Enter your user ID',
        buyNow: 'Buy Now',
        loginToBuy: 'Log in to buy',
        buying: 'Processing...',
        cancel: 'Cancel',
        successTitle: 'Purchase completed successfully',
        orderNumber: 'Order Number',
        product: 'Product',
        status: 'Order Status',
        orderDetails: 'View Order Details',
        later: 'Later',
        copied: 'Order number copied',
        accountCopied: 'Account number copied',
        emptyQuantity: 'Enter quantity.',
        belowMin: 'Quantity is below the minimum.',
        aboveMax: 'Quantity is above the maximum.',
        emptyUserId: 'User ID is required.',
        insufficientBalance: 'Insufficient balance.',
        balanceShortfallMessage: 'Your balance is insufficient. Add',
        balanceRequiredTitle: 'Top up to complete your order',
        balanceRequiredDescription: 'Your balance is short by the amount below.',
        currentBalance: 'Available balance',
        requiredTopup: 'Amount required',
        automaticTopup: 'Auto Top-up',
        backToPurchase: 'Back to purchase',
        loading: 'Loading product...',
        fallbackStatus: 'Processing',
      }
    : {
        available: 'متاح',
        unavailable: 'غير متاح',
        priceUnavailable: 'السعر غير متاح مؤقتًا. حاول لاحقًا.',
        unitPrice: 'سعر الوحدة',
        agentProductId: 'رقم آيدي الوكيل',
        accountNumber: 'آيدي الحساب المستلم',
        total: 'الإجمالي',
        purchaseSummary: 'ملخص الشراء',
        usdEquivalent: 'المعادل بالدولار',
        usdSettlementNote: 'السعر الأساسي للمنصة بالدولار',
        shippingNotice: 'الشحن يتم خلال ثواني معدوده',
        quantity: 'العدد',
        quantityPlaceholder: 'أدخل الكمية',
        minQuantity: 'أقل كمية',
        maxQuantity: 'أقصى كمية',
        userId: 'معرف المستخدم',
        userIdPlaceholder: 'أدخل معرف المستخدم',
        buyNow: 'شراء',
        loginToBuy: 'تسجيل الدخول للشراء',
        buying: 'جاري التنفيذ...',
        cancel: 'إلغاء',
        successTitle: 'تم الشراء بنجاح',
        orderNumber: 'رقم الطلب',
        product: 'المنتج',
        status: 'حالة الطلب',
        orderDetails: 'عرض تفاصيل الطلب',
        later: 'لاحقًا',
        copied: 'تم نسخ رقم الطلب',
        accountCopied: 'تم نسخ رقم الحساب',
        emptyQuantity: 'أدخل الكمية.',
        belowMin: 'الكمية أقل من الحد الأدنى.',
        aboveMax: 'الكمية أكبر من الحد الأقصى.',
        emptyUserId: 'معرف المستخدم مطلوب.',
        insufficientBalance: 'الرصيد غير كافي.',
        balanceShortfallMessage: 'رصيدك غير كافي، تحتاج لإضافة رصيد',
        balanceRequiredTitle: 'اشحن رصيدك لإتمام الطلب',
        balanceRequiredDescription: 'رصيدك الحالي لا يكفي، وتحتاج إلى شحن المبلغ الموضح بالأسفل.',
        currentBalance: 'الرصيد المتاح',
        requiredTopup: 'المبلغ المطلوب شحنه',
        automaticTopup: 'شحن آلي',
        backToPurchase: 'العودة للشراء',
        loading: 'جاري تحميل المنتج...',
        fallbackStatus: 'قيد التنفيذ',
      }
);

const formatCount = (value) => Number(value || 0).toLocaleString('en-US');
const normalizeQuantityDigits = (value) => String(value || '')
  .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
  .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
  .replace(/\D/g, '');
const parseQuantityInput = (value) => Number.parseInt(normalizeQuantityDigits(value), 10);
const isUploadFieldType = (type) => ['image', 'file'].includes(String(type || '').trim().toLowerCase());

const ProductImage = ({ product }) => {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [product?.id, product?.image]);

  if (product?.image && !imageFailed) {
    return <img src={resolveImageUrl(product.image)} alt={product?.name || ''} onError={() => setImageFailed(true)} />;
  }

  return <img src={brandLogoDark} alt="Lool Store" className="purchase-dialog-fallback-logo" />;
};

const SummaryCell = ({ label, value, icon, onClick, title }) => {
  const content = (
    <>
      <span>{icon}</span>
      <p>{label}</p>
      <strong dir="auto">{value}</strong>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="purchase-dialog-summary-cell is-clickable" onClick={onClick} title={title}>
        {content}
      </button>
    );
  }

  return (
    <div className="purchase-dialog-summary-cell">
      {content}
    </div>
  );
};

const SummaryPair = ({ left, right }) => (
  <div className="purchase-dialog-summary-pair">
    <SummaryCell {...left} />
    <SummaryCell {...right} />
  </div>
);

const SummaryRow = ({ label, value, icon, onClick, title }) => (
  <div className="purchase-dialog-summary-row">
    <span>{icon}</span>
    <p>{label}</p>
    <strong dir="auto">{value}</strong>
  </div>
);

const ProductPurchaseDialog = ({
  productId,
  initialProduct = null,
  isOpen,
  onClose,
  onViewOrder,
  pricingPreviewUser = null,
  requireAuth = false,
  onRequireAuth,
}) => {
  const navigate = useNavigate();
  const { language, dir } = useLanguage();
  const { addToast } = useToast();
  const copy = useMemo(() => getCopy(language), [language]);

  const user = useAuthStore((state) => state.user);
  const favoriteKey = favoriteUserKey(user);
  const isFavorite = useFavoritesStore((state) => Boolean(favoriteKey && (state.favoritesByUser[favoriteKey] || []).includes(String(productId || initialProduct?.id || ''))));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const updateUserSession = useAuthStore((state) => state.updateUserSession);
  const products = useMediaStore((state) => state.products);
  const loadProducts = useMediaStore((state) => state.loadProducts);
  const currencies = useSystemStore((state) => state.currencies);
  const loadCurrencies = useSystemStore((state) => state.loadCurrencies);
  const addOrder = useOrderStore((state) => state.addOrder);

  const [product, setProduct] = useState(initialProduct);
  const [quantityInput, setQuantityInput] = useState('');
  const [userId, setUserId] = useState('');
  const [orderFieldValues, setOrderFieldValues] = useState({});
  const [orderFieldFiles, setOrderFieldFiles] = useState({});
  const [verifiedData, setVerifiedData] = useState({});
  const [verificationLoading, setVerificationLoading] = useState({});
  const [verificationErrors, setVerificationErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(productId && !initialProduct));
  const [successOrder, setSuccessOrder] = useState(null);
  const [showBalanceTopup, setShowBalanceTopup] = useState(false);
  const [topupStep, setTopupStep] = useState('summary');
  const [topupMethodId, setTopupMethodId] = useState('');

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    setProduct(initialProduct || null);
    setQuantityInput('');
    setUserId('');
    setOrderFieldValues({});
    setOrderFieldFiles({});
    setVerifiedData({});
    setVerificationLoading({});
    setVerificationErrors({});
    setFormError('');
    setServerError('');
    setSuccessOrder(null);
    setShowBalanceTopup(false);
    setTopupStep('summary');
    setTopupMethodId('');
  }, [initialProduct, isOpen, productId]);

  useEffect(() => {
    if (!isOpen) return undefined;
    if (!currencies || currencies.length === 0) {
      loadCurrencies();
    }
    return undefined;
  }, [currencies, isOpen, loadCurrencies]);

  useEffect(() => {
    if (!isOpen || !productId) return undefined;

    let isActive = true;
    const loadProduct = async () => {
      const cachedProduct = initialProduct
        || (useMediaStore.getState().products || products || []).find((item) => String(item.id) === String(productId));

      if (cachedProduct) {
        setProduct(cachedProduct);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      try {
        await loadProducts({ force: true, bypassCache: true });
        if (!isActive) return;
        const freshProduct = (useMediaStore.getState().products || []).find((item) => String(item.id) === String(productId));
        if (freshProduct) {
          setProduct(freshProduct);
        }
      } catch (error) {
        devLogger.error('Failed to load product', error);
        if (!cachedProduct) {
          setServerError(getReadableErrorMessage(error, copy.loading, { language }));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadProduct();
    return () => {
      isActive = false;
    };
  }, [copy.loading, initialProduct, isOpen, language, loadProducts, productId, products]);

  const quantityMeta = useMemo(() => (product ? getProductQuantityMeta(product) : null), [product]);
  const orderFields = useMemo(() => (product ? resolveProductOrderFields(product, language) : []), [language, product]);

  useEffect(() => {
    if (!quantityMeta) return;
    setQuantityInput(String(quantityMeta.minQty));
  }, [product?.id, quantityMeta?.minQty]);

  const pricingUser = user || pricingPreviewUser || null;
  const shouldRequireAuth = Boolean(requireAuth && !user);
  const userCurrencyCode = String(pricingUser?.currency || 'USD').toUpperCase();
  const pricingGroup = pricingUser?.groupId || pricingUser?.group || 'Normal';
  const pricingGroupPercentage = pricingUser?.groupPercentage ?? null;
  const unitPriceBase = product ? calculateProductPrice(product, pricingGroup, pricingGroupPercentage) : '0';
  const unitPrice = product ? resolveProductUnitPrice(product, userCurrencyCode, currencies, pricingGroup, pricingGroupPercentage) : '0';
  const quantity = parseQuantityInput(quantityInput);
  const safeQuantity = Number.isFinite(quantity) ? quantity : 0;
  const totalPrice = normalizeMoneyAmount(Number(unitPrice) * safeQuantity);
  const totalPriceUsd = normalizeMoneyAmount(Number(unitPriceBase) * safeQuantity);
  const walletSummary = getWalletBalanceSummary(pricingUser);
  const walletBalance = walletSummary.walletBalance;
  const availableBalance = walletSummary.availableBalance;
  const locale = language === 'en' ? 'en-US' : 'ar-EG';
  const purchaseDisplayFormat = { minimumFractionDigits: 0, maximumFractionDigits: 2 };
  const formattedTotalPrice = formatCurrencyAmount(truncatePurchaseTotal(totalPrice), userCurrencyCode, currencies, locale, purchaseDisplayFormat);
  const formattedTotalPriceUsd = formatCurrencyAmount(truncatePurchaseTotal(totalPriceUsd), 'USD', currencies, locale, purchaseDisplayFormat);
  const shouldShowUsdEquivalent = userCurrencyCode !== 'USD';
  const balanceShortfall = normalizeMoneyAmount(Math.max(0, totalPrice - availableBalance));
  const formattedAvailableBalance = formatCurrencyAmount(availableBalance, userCurrencyCode, currencies, locale);
  const formattedBalanceShortfall = formatCurrencyAmount(balanceShortfall, userCurrencyCode, currencies, locale);
  const shouldShowBalanceWarning = Boolean(user) && balanceShortfall > 0;
  const agentProductId = String(
    product?.providerProductId
    || product?.externalProductId
    || product?.providerProduct
    || product?.supplierProductId
    || product?.supplierProductCode
    || product?.rawPayload?.product_id
    || product?.rawPayload?.productId
    || product?.rawPayload?.id
    || ''
  ).trim();
  const configuredAccountNumber = String(
    product?.targetAccountId
    || product?.receivingAccountId
    || product?.receiverAccountId
    || product?.recipientAccountId
    || product?.targetRecipientId
    || product?.receivingAccount
    || product?.targetAccount
    || product?.destinationAccountId
    || product?.accountId
    || product?.displayAccountNumber
    || product?.purchaseAccountNumber
    || product?.accountNumber
    || product?.productAccountNumber
    || ''
  ).trim();
  const hasReceiverAccountId = Boolean(
    product?.targetAccountId
    || product?.receivingAccountId
    || product?.receiverAccountId
    || product?.recipientAccountId
    || product?.targetRecipientId
    || product?.receivingAccount
    || product?.targetAccount
    || product?.destinationAccountId
    || product?.accountId
  );
  const shouldShowAccountNumber = Boolean(
    hasReceiverAccountId
    || (
      product?.showPurchaseAccountNumber
      ?? product?.showAccountNumber
      ?? product?.displayAccountNumber
      ?? false
    )
  );
  const displayedAccountNumber = shouldShowAccountNumber
    ? (configuredAccountNumber || agentProductId)
    : '';
  const isPurchasable = product?.storefrontStatus?.isPurchasable !== false;
  const statusLabel = isPurchasable
    ? (product?.storefrontStatus?.label || product?.storefrontStatus?.badgeLabel || copy.available)
    : (product?.storefrontStatus?.label || product?.storefrontStatus?.badgeLabel || copy.unavailable);
  const purchaseButtonLabel = isSubmitting
    ? copy.buying
    : (shouldRequireAuth && isPurchasable ? copy.loginToBuy : (isPurchasable ? copy.buyNow : statusLabel));

  const primaryOrderField = orderFields.find((field) => String(field?.key || '').toLowerCase() === 'playerid')
    || orderFields.find((field) => !isUploadFieldType(field?.type))
    || { key: 'playerId', label: copy.userId, placeholder: copy.userIdPlaceholder };
  const primaryOrderFieldKey = String(primaryOrderField?.key || 'playerId').trim() || 'playerId';
  const primaryOrderFieldLabel = primaryOrderField?.label || copy.userId;
  const primaryOrderFieldPlaceholder = primaryOrderField?.placeholder || primaryOrderFieldLabel || copy.userIdPlaceholder;
  const orderFieldKeySet = useMemo(
    () => new Set(orderFields.map((field) => String(field?.key || '').trim()).filter(Boolean)),
    [orderFields]
  );
  const hasPrimaryOrderField = orderFieldKeySet.has(primaryOrderFieldKey);
  const additionalOrderFields = useMemo(
    () => orderFields.filter((field) => String(field?.key || '').trim() !== primaryOrderFieldKey),
    [orderFields, primaryOrderFieldKey]
  );
  const validateForm = () => {
    const identifier = sanitizeOrderFieldValue(userId).trim();
    if (!quantityInput || !Number.isFinite(quantity)) return copy.emptyQuantity;
    if (quantity < quantityMeta.minQty) return copy.belowMin;
    if (quantity > quantityMeta.maxQty) return copy.aboveMax;
    if (hasPrimaryOrderField && !identifier) return copy.emptyUserId;
    for (const field of additionalOrderFields) {
      if (field?.required === false) continue;
      const key = String(field?.key || '').trim();
      if (!key) continue;
      const hasValue = isUploadFieldType(field?.type)
        ? Boolean(orderFieldFiles[key] || String(orderFieldValues[key] || '').trim())
        : Boolean(sanitizeOrderFieldValue(orderFieldValues[key]).trim());
      if (!hasValue) {
        return language === 'en'
          ? `${field.label || key} is required.`
          : `${field.label || key} مطلوب.`;
      }
    }
    if (!isPurchasable) return copy.unavailable;
    return '';
  };

  const clearVerificationForField = (key) => {
    setVerifiedData((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setVerificationErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleVerifyField = async (field, value) => {
    if (!product?.id) return;

    const key = String(field?.key || '').trim();
    const fieldValue = sanitizeOrderFieldValue(value).trim();
    if (!key) return;

    if (!fieldValue) {
      setVerificationErrors((prev) => ({
        ...prev,
        [key]: language === 'en' ? 'Enter the value first.' : 'أدخل القيمة أولاً.',
      }));
      setVerifiedData((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    setVerificationLoading((prev) => ({ ...prev, [key]: true }));
    setVerificationErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    try {
      const result = await apiClient.products.verifyField(product.id, fieldValue);
      setVerifiedData((prev) => ({ ...prev, [key]: result }));
    } catch (error) {
      setVerifiedData((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setVerificationErrors((prev) => ({
        ...prev,
        [key]: error?.response?.data?.message || error?.message || (language === 'en' ? 'Verification failed.' : 'فشل التحقق.'),
      }));
    } finally {
      setVerificationLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const renderVerificationResult = (field) => {
    const key = String(field?.key || '').trim();
    const data = verifiedData[key];
    const error = verificationErrors[key];

    if (error) {
      return <p className="mt-1 text-xs font-bold text-red-400">{error}</p>;
    }

    if (!data) return null;

    return (
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-indigo-400/25 bg-indigo-500/10 px-3 py-2 text-start text-xs font-bold text-indigo-200">
        {data.avatar ? (
          <img src={data.avatar} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-indigo-300/30" />
        ) : null}
        <div className="min-w-0">
          <p className="truncate">{data.nickName || data.uid}</p>
          {data.uid ? <p className="truncate text-[0.68rem] text-indigo-100/70" dir="ltr">{data.uid}</p> : null}
        </div>
      </div>
    );
  };

  const renderVerifyButton = (field, value) => {
    const key = String(field?.key || '').trim();
    if (field?.isVerifiable !== true || !key) return null;

    return (
      <button
        type="button"
        onClick={() => handleVerifyField(field, value)}
        disabled={Boolean(verificationLoading[key])}
        className="min-h-[2.75rem] rounded-xl border border-indigo-400/25 bg-indigo-500/15 px-3 text-sm font-black text-indigo-100 transition hover:bg-indigo-500/25 disabled:cursor-wait disabled:opacity-60"
      >
        {verificationLoading[key] ? (
          <span className="mx-auto block h-4 w-4 animate-spin rounded-full border-2 border-indigo-100/30 border-t-indigo-100" />
        ) : (
          'تحقق'
        )}
      </button>
    );
  };

  const handlePurchase = async () => {
    if (!product || !quantityMeta) return;
    if (shouldRequireAuth) {
      onRequireAuth?.();
      return;
    }
    const validationError = validateForm();
    setFormError(validationError);
    setServerError('');
    if (validationError) return;

    if (Number.isFinite(totalPrice) && totalPrice > availableBalance) {
      setShowBalanceTopup(true);
      return;
    }

    const identifier = sanitizeOrderFieldValue(userId).trim();
    const orderId = `#${product?.name?.replace(/\s+/g, '').toUpperCase() || 'ORD'}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

    // The demo checkout is intentionally instant: never show a transient
    // "Processing" state before its confirmation.
    if (isInstantMockCheckout) {
      setSuccessOrder({
        orderId,
        orderNumber: orderId,
        productName: product?.nameAr || product?.name,
        quantity,
        total: totalPrice,
        userId: identifier,
        status: language === 'en' ? 'Completed' : 'مكتمل',
      });
    } else {
      setIsSubmitting(true);
    }

    try {
      const normalizedFields = hasPrimaryOrderField ? { [primaryOrderFieldKey]: identifier } : {};

      for (const field of additionalOrderFields) {
        const key = String(field?.key || '').trim();
        if (!key) continue;

        if (isUploadFieldType(field?.type)) {
          if (orderFieldFiles[key]) {
            normalizedFields[key] = await apiClient.uploads.orderFieldImage(orderFieldFiles[key]);
          } else if (orderFieldValues[key]) {
            normalizedFields[key] = String(orderFieldValues[key]).trim();
          }
          continue;
        }

        const value = sanitizeOrderFieldValue(orderFieldValues[key]).trim();
        if (value) normalizedFields[key] = value;
      }

      if (identifier && orderFieldKeySet.has('playerId') && !normalizedFields.playerId) normalizedFields.playerId = identifier;
      if (identifier && orderFieldKeySet.has('userId') && !normalizedFields.userId) normalizedFields.userId = identifier;

      const fieldsSnapshot = Array.isArray(product?.orderFields) && product.orderFields.length > 0
        ? product.orderFields.map((field) => ({ ...field }))
        : orderFields.map((field) => ({
            key: field.key,
            label: field.label,
            placeholder: field.placeholder,
            type: field.type,
            required: field.required,
            isVerifiable: field.isVerifiable === true,
            options: field.options,
          }));

      const payload = {
        id: orderId,
        userId: user?.id,
        productId: product.id,
        productName: product.name,
        quantity,
        total: totalPrice,
        playerId: hasPrimaryOrderField ? identifier : undefined,
        customInputs: normalizedFields,
        orderFields: normalizedFields,
        orderFieldsValues: normalizedFields,
        customerInput: {
          values: normalizedFields,
          fieldsSnapshot,
          quantitySnapshot: quantityMeta,
        },
        quantitySnapshot: quantityMeta,
        timestamp: new Date().toISOString(),
        unitPriceBase,
        unitPrice,
        priceCoins: totalPrice,
        currencyCode: userCurrencyCode,
        exchangeRateAtExecution: getCurrencyMeta(userCurrencyCode, currencies).rate,
        idempotencyKey: `${user?.id || 'user'}-${product.id}-${identifier || 'fields'}-${Date.now()}`,
        preferLegacyOrderEndpoint: true,
      };

      const result = await addOrder(payload);
      const returnedOrder = result?.order || result || null;
      const returnedId = returnedOrder?.id || returnedOrder?._id || returnedOrder?.orderId || orderId;
      const returnedOrderNumber = String(
        returnedOrder?.siteOrderNumber
        || returnedOrder?.orderNumber
        || returnedOrder?.internalOrderNumber
        || returnedOrder?.displayOrderId
        || returnedId
      ).trim();
      const returnedWalletSource = result?.wallet || result?.walletSummary || result?.user || returnedOrder?.wallet || returnedOrder?.walletSummary || null;
      const nextBalance = Number(result?.updatedBalance);
      const nextWalletSummary = getWalletBalanceSummary(
        returnedWalletSource
        || (Number.isFinite(nextBalance)
          ? { ...walletSummary, walletBalance: nextBalance }
          : { ...walletSummary, walletBalance: normalizeMoneyAmount(walletBalance - totalPrice, 2) })
      );

      updateUserSession({
        coins: nextWalletSummary.walletBalance,
        walletBalance: nextWalletSummary.walletBalance,
        balance: nextWalletSummary.walletBalance,
        creditLimit: nextWalletSummary.creditLimit,
        creditUsed: nextWalletSummary.creditUsed,
        availableCredit: nextWalletSummary.availableCredit,
        availableBalance: nextWalletSummary.availableBalance,
      });

      // Refresh in the background when the order response did not include wallet
      // details. The customer should see the completed purchase immediately.
      if (!returnedWalletSource && user?.id) {
        apiClient.auth.getProfile(user.id)
          .then((profile) => {
            const refreshedWallet = getWalletBalanceSummary(profile);
            updateUserSession({
              coins: refreshedWallet.walletBalance,
              walletBalance: refreshedWallet.walletBalance,
              balance: refreshedWallet.walletBalance,
              creditLimit: refreshedWallet.creditLimit,
              creditUsed: refreshedWallet.creditUsed,
              availableCredit: refreshedWallet.availableCredit,
              availableBalance: refreshedWallet.availableBalance,
            });
          })
          .catch((profileError) => {
            devLogger.warnUnlessBenign('Failed to refresh profile after purchase', profileError, { once: true });
          });
      }

      setSuccessOrder({
        orderId: returnedId,
        orderNumber: returnedOrderNumber,
        productName: product?.nameAr || product?.name,
        quantity,
        total: totalPrice,
        userId: identifier,
        status: returnedOrder?.statusLabel || returnedOrder?.status || copy.fallbackStatus,
      });
      addToast(language === 'en' ? 'Order placed successfully!' : 'تم تنفيذ الطلب بنجاح!', 'success');
    } catch (error) {
      devLogger.error('Purchase failed', error);
      setServerError(getReadableErrorMessage(
        error,
        language === 'en' ? 'Purchase failed. Please try again.' : 'فشلت عملية الشراء. حاول مرة أخرى.',
        { language }
      ));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutomaticTopup = () => {
    setTopupStep('methods');
  };

  const handleTopupMethodSelect = (method) => {
    setTopupMethodId(String(method?.id || ''));
    setTopupStep('details');
  };

  const copyOrderNumber = async () => {
    const value = String(successOrder?.orderNumber || successOrder?.orderId || '').trim();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      addToast(copy.copied, 'success');
    } catch (_error) {
      addToast(value, 'success');
    }
  };

  const copyAccountNumber = async () => {
    if (!displayedAccountNumber) return;

    try {
      await navigator.clipboard.writeText(displayedAccountNumber);
      addToast(copy.accountCopied, 'success');
    } catch (_error) {
      addToast(displayedAccountNumber, 'success');
    }
  };

  if (!isOpen) return null;

  const displayNameAr = product?.nameAr || product?.displayName || product?.name || '';
  const displayNameEn = product?.name || product?.nameAr || '';
  const productDescription = String(
    language === 'en'
      ? (
        product?.description
        || product?.descriptionEn
        || product?.shortDescription
        || product?.details
        || product?.note
        || product?.descriptionAr
        || ''
      )
      : (
        product?.descriptionAr
        || product?.description
        || product?.shortDescriptionAr
        || product?.shortDescription
        || product?.detailsAr
        || product?.details
        || product?.noteAr
        || product?.note
        || ''
      )
  ).trim();
  const visibleError = formError || serverError;

  const renderAdditionalOrderField = (field) => {
    const key = String(field?.key || '').trim();
    if (!key) return null;
    const type = String(field?.type || 'text').trim().toLowerCase();
    const label = field?.label || key;
    const placeholder = field?.placeholder || label;

    if (type === 'select') {
      return (
        <div key={key} className="purchase-dialog-field">
          <span>{label}</span>
          <div className={field?.isVerifiable === true ? 'grid grid-cols-[minmax(0,1fr)_auto] gap-2' : ''}>
            <select
              value={orderFieldValues[key] || ''}
              onChange={(event) => {
                setOrderFieldValues((prev) => ({ ...prev, [key]: event.target.value }));
                clearVerificationForField(key);
                setFormError('');
              }}
              className="min-h-[2.75rem] w-full rounded-xl border border-slate-400/20 bg-white px-3 text-center text-sm font-extrabold text-slate-900 outline-none focus:border-indigo-400/50 dark:bg-slate-950/60 dark:text-white"
            >
              <option value="">{placeholder}</option>
              {(field.options || []).map((option) => (
                <option key={String(option)} value={String(option)}>{String(option)}</option>
              ))}
            </select>
            {renderVerifyButton(field, orderFieldValues[key] || '')}
          </div>
          {field?.isVerifiable === true ? renderVerificationResult(field) : null}
        </div>
      );
    }

    if (isUploadFieldType(type)) {
      return (
        <label key={key} className="purchase-dialog-field">
          <span>{label}</span>
          <input
            type="file"
            accept="image/*"
            className="block w-full cursor-pointer rounded-xl border border-slate-300 bg-white text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              setOrderFieldFiles((prev) => ({ ...prev, [key]: file }));
              setOrderFieldValues((prev) => ({ ...prev, [key]: file ? file.name : '' }));
              setFormError('');
            }}
          />
          {orderFieldFiles[key] ? <small>{orderFieldFiles[key].name}</small> : null}
        </label>
      );
    }

    return (
      <div key={key} className="purchase-dialog-field">
        <span>{label}</span>
        <div className={field?.isVerifiable === true ? 'grid grid-cols-[minmax(0,1fr)_auto] gap-2' : ''}>
          <input
            type={type === 'number' ? 'number' : type === 'email' ? 'email' : 'text'}
            value={orderFieldValues[key] || ''}
            onChange={(event) => {
              setOrderFieldValues((prev) => ({ ...prev, [key]: event.target.value }));
              clearVerificationForField(key);
              setFormError('');
            }}
            placeholder={placeholder}
          />
          {renderVerifyButton(field, orderFieldValues[key] || '')}
        </div>
        {field?.isVerifiable === true ? renderVerificationResult(field) : null}
      </div>
    );
  };

  const dialog = (
    <div className="purchase-dialog-overlay" dir={dir} role="dialog" aria-modal="true">
      <button type="button" className="purchase-dialog-backdrop" onClick={onClose} aria-label={copy.cancel} />

      <motion.section
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className={`purchase-dialog-card ${showBalanceTopup ? (topupStep !== 'summary' ? 'is-wallet-flow' : 'purchase-dialog-card--reference') : (successOrder ? 'purchase-dialog-card--oscar-success' : 'purchase-dialog-card--oscar')}`}
      >
        {!successOrder && !showBalanceTopup ? <span className="purchase-oscar-neon-frame" aria-hidden="true" /> : null}
        <div className="purchase-dialog-grid" />
        <button type="button" className="purchase-dialog-close" onClick={onClose} aria-label="Close">
          <X className="h-5 w-5" />
        </button>

        {isLoading || !product || !quantityMeta ? (
          <div className="purchase-dialog-loading">
            <span />
            <p>{copy.loading}</p>
          </div>
        ) : successOrder ? (
          <div className="purchase-dialog-success">
            <div className="purchase-dialog-success-icon">
              <Check className="h-14 w-14" />
            </div>
            <h2>{copy.successTitle}</h2>
            <div className="purchase-dialog-summary">
              <SummaryPair
                left={{
                  label: copy.orderNumber,
                  value: successOrder.orderNumber || successOrder.orderId,
                  icon: <Copy className="h-4 w-4" />,
                  onClick: copyOrderNumber,
                  title: copy.copied,
                }}
                right={{
                  label: copy.product,
                  value: successOrder.productName,
                  icon: <Package className="h-4 w-4" />,
                }}
              />
              <SummaryPair
                left={{
                  label: copy.quantity,
                  value: formatCount(successOrder.quantity),
                  icon: <FileText className="h-4 w-4" />,
                }}
                right={{
                  label: copy.total,
                  value: formattedTotalPrice,
                  icon: <WalletCards className="h-4 w-4" />,
                }}
              />
              <SummaryPair
                left={{
                  label: copy.userId,
                  value: successOrder.userId,
                  icon: <UserRound className="h-4 w-4" />,
                }}
                right={{
                  label: copy.status,
                  value: successOrder.status,
                  icon: <Check className="h-4 w-4" />,
                }}
              />
            </div>
            <div className="purchase-dialog-success-actions">
              <button
                type="button"
                className="purchase-dialog-primary"
                onClick={() => onViewOrder?.(successOrder.orderId)}
              >
                {copy.orderDetails}
              </button>
              <button type="button" className="purchase-dialog-secondary" onClick={onClose}>
                {copy.later}
              </button>
            </div>
          </div>
        ) : showBalanceTopup && topupStep === 'methods' ? (
          <div className="purchase-dialog-wallet-flow">
            <button
              type="button"
              onClick={() => setTopupStep('summary')}
              className="purchase-dialog-wallet-back"
            >
              {language === 'en' ? 'Back to required amount' : 'العودة للمبلغ المطلوب'}
            </button>
            <AddBalance
              embedded
              automaticAmount={balanceShortfall}
              automaticCurrency={userCurrencyCode}
              onSelectMethod={handleTopupMethodSelect}
            />
          </div>
        ) : showBalanceTopup && topupStep === 'details' ? (
          <div className="purchase-dialog-wallet-flow">
            <PaymentDetails
              embedded
              methodId={topupMethodId}
              automaticAmount={balanceShortfall}
              automaticCurrency={userCurrencyCode}
              onBack={() => setTopupStep('methods')}
              onComplete={() => {
                onClose?.();
                navigate('/wallet/topups');
              }}
              onReturnToPurchase={() => {
                setTopupStep('summary');
                setTopupMethodId('');
                setShowBalanceTopup(false);
              }}
            />
          </div>
        ) : showBalanceTopup ? (
          <div className="purchase-dialog-topup">
            <div className="purchase-dialog-topup-icon">
              <WalletCards className="h-8 w-8" />
            </div>
            <span className="purchase-dialog-topup-kicker">
              <Zap className="h-3.5 w-3.5" />
              {copy.automaticTopup}
            </span>
            <h2>{copy.balanceRequiredTitle}</h2>
            <p>{copy.balanceRequiredDescription}</p>

            <div className="purchase-dialog-topup-summary">
              <div>
                <span>{copy.currentBalance}</span>
                <strong dir="ltr">{formattedAvailableBalance}</strong>
              </div>
              <div>
                <span>{copy.total}</span>
                <strong dir="ltr">{formattedTotalPrice}</strong>
              </div>
              <div className="is-required">
                <span>{copy.requiredTopup}</span>
                <strong dir="ltr">{formattedBalanceShortfall}</strong>
              </div>
            </div>

            <button type="button" className="purchase-dialog-primary purchase-dialog-topup-action" onClick={handleAutomaticTopup}>
              <Zap className="h-5 w-5" />
              {copy.automaticTopup}
              <strong dir="ltr">{formattedBalanceShortfall}</strong>
            </button>
            <button type="button" className="purchase-dialog-secondary purchase-dialog-topup-back" onClick={() => setShowBalanceTopup(false)}>
              {copy.backToPurchase}
            </button>
          </div>
        ) : (
          <>
            <header className="purchase-oscar-header">
              <span className="purchase-oscar-bag" aria-hidden="true"><ShoppingBag size={21} strokeWidth={2.4} /></span>
              <div className="purchase-oscar-title-block">
                <h2 title={displayNameAr}>{displayNameAr}</h2>
                {displayNameEn && displayNameEn !== displayNameAr ? <p dir="ltr" title={displayNameEn}>{displayNameEn}</p> : null}
                <span className={`purchase-oscar-status ${isPurchasable ? 'is-available' : 'is-unavailable'}`}>{statusLabel}</span>
                <span className="purchase-oscar-title-line" aria-hidden="true" />
              </div>
            </header>

            <p className="purchase-oscar-description">{productDescription || copy.shippingNotice}</p>

            {displayedAccountNumber ? (
              <div className="purchase-dialog-price-card purchase-oscar-account">
                <button type="button" className="purchase-dialog-copy-card" onClick={copyAccountNumber} title={copy.accountCopied}>
                  <span>{copy.accountNumber}</span>
                  <strong dir="ltr">{displayedAccountNumber}</strong>
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            {/* ── Quantity + Total — single premium row ── */}
            <div className="ppd-gold-row purchase-oscar-info">
              <div className="ppd-gold-qty">
                <div className="purchase-oscar-cell-heading"><span className="purchase-oscar-mini-icon"><Box size={17} /></span><span className="ppd-gold-label">{copy.quantity}</span></div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  dir="ltr"
                  className="ppd-gold-input"
                  value={quantityInput}
                  placeholder={`${copy.minQuantity}: ${formatCount(quantityMeta.minQty)}`}
                  onChange={(event) => {
                    setQuantityInput(normalizeQuantityDigits(event.target.value));
                    setFormError('');
                  }}
                  onBlur={() => setQuantityInput(String(clampProductQuantity(quantityInput, product)))}
                />
                <span className="ppd-gold-range" dir="ltr">{formatCount(quantityMeta.minQty)} · {formatCount(quantityMeta.maxQty)}</span>
              </div>
              <div className="ppd-gold-divider" aria-hidden="true" />
              <div className="ppd-gold-total">
                <div className="purchase-oscar-cell-heading"><span className="purchase-oscar-mini-icon"><Zap size={16} fill="currentColor" /></span><span className="ppd-gold-label">{copy.total}</span></div>
                <output className="ppd-gold-price purchase-oscar-total-output" dir="ltr" aria-label={copy.total}>{formattedTotalPrice}</output>
                {shouldShowUsdEquivalent ? <span className="ppd-gold-usd" dir="ltr">{formattedTotalPriceUsd}</span> : null}
              </div>
            </div>

            {shouldShowBalanceWarning ? (
              <p className="purchase-oscar-balance-warning" role="alert">
                <span>{copy.balanceShortfallMessage}</span>
                <strong dir="ltr">{formattedBalanceShortfall}</strong>
              </p>
            ) : null}

            {hasPrimaryOrderField ? (
              <div className="purchase-dialog-field purchase-oscar-user-field">
                <span className="purchase-dialog-field-label"><span className="purchase-oscar-mini-icon" aria-hidden="true"><UserRound size={17} /></span>{primaryOrderFieldLabel}</span>
                <div className={primaryOrderField?.isVerifiable === true ? 'grid grid-cols-[minmax(0,1fr)_auto] gap-2' : ''}>
                  <div className="purchase-dialog-input-shell">
                    <input
                      type="text"
                      value={userId}
                      onChange={(event) => {
                        setUserId(event.target.value);
                        clearVerificationForField(primaryOrderFieldKey);
                        setFormError('');
                      }}
                      placeholder={primaryOrderFieldPlaceholder || copy.userIdPlaceholder}
                    />
                  </div>
                  {renderVerifyButton(primaryOrderField, userId)}
                </div>
                {renderVerificationResult(primaryOrderField)}
              </div>
            ) : null}

            {additionalOrderFields.map(renderAdditionalOrderField)}

            {visibleError ? <div className="purchase-dialog-error">{visibleError}</div> : null}

            <div className="purchase-dialog-actions">
              <button
                type="button"
                className="purchase-dialog-primary"
                onClick={handlePurchase}
                disabled={isSubmitting || !isPurchasable}
              >
                <LockKeyhole className="h-5 w-5" />
                <span>{purchaseButtonLabel}</span>
              </button>
              <button type="button" className="purchase-dialog-secondary" onClick={onClose} disabled={isSubmitting}>
                {copy.cancel}
              </button>
            </div>
            <figure className="purchase-oscar-showcase">
              {favoriteKey ? (
                <button
                  type="button"
                  className={`purchase-dialog-favorite${isFavorite ? ' is-favorite' : ''}`}
                  onClick={() => {
                    toggleFavorite(favoriteKey, product.id);
                    addToast(isFavorite
                      ? (language === 'en' ? 'Removed from favorites' : 'تمت الإزالة من المفضلة')
                      : (language === 'en' ? 'Added to favorites' : 'تمت الإضافة إلى المفضلة'), 'success');
                  }}
                  aria-label={isFavorite ? (language === 'en' ? 'Remove from favorites' : 'إزالة من المفضلة') : (language === 'en' ? 'Add to favorites' : 'إضافة إلى المفضلة')}
                  aria-pressed={isFavorite}
                  title={isFavorite ? (language === 'en' ? 'Remove from favorites' : 'إزالة من المفضلة') : (language === 'en' ? 'Add to favorites' : 'إضافة إلى المفضلة')}
                >
                  <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
                </button>
              ) : null}
              <div className="purchase-oscar-stage">
                <span className="purchase-oscar-ring-glow" aria-hidden="true" />
                <span className="purchase-oscar-energy-ring" aria-hidden="true" />
                <span className="purchase-oscar-ring-core" aria-hidden="true" />
                <span className="purchase-oscar-display-base" aria-hidden="true" />
                <div className={`purchase-oscar-product-image${isPurchasable ? '' : ' is-unavailable'}`}><ProductImage product={product} /></div>
              </div>
            </figure>
          </>
        )}
      </motion.section>
    </div>
  );

  if (typeof document === 'undefined') return dialog;

  return createPortal(dialog, document.body);
};

export default ProductPurchaseDialog;
