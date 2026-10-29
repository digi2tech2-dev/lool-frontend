import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useMediaStore from '../store/useMediaStore';
import useGroupStore from '../store/useGroupStore';
import HeroSlider from '../components/home/HeroSlider';
import CategoryCard from '../components/home/CategoryCard';
import BestSellingSection from '../components/home/BestSellingSection';
import ProductSearchBar from '../components/products/ProductSearchBar';
import ProductPurchaseDialog from '../components/products/ProductPurchaseDialog';
import StorefrontQuickOffers from '../components/products/StorefrontQuickOffers';
import WelcomeIntro from '../components/app/WelcomeIntro';
import slideOneHeroImage from '../assets/slide-1.jpg';
import slideTwoHeroImage from '../assets/slide-2.jpg';
import slideThreeHeroImage from '../assets/slide-3.jpg';
import slideFourHeroImage from '../assets/slide-4.jpg';
import slideFiveHeroImage from '../assets/slide-5.jpg';
import targetBannerImage from '../assets/تارجت.jpg';
import {
  createStorefrontCategories,
  createStorefrontProducts,
  getStorefrontLanguage,
} from '../utils/storefront';

const Dashboard = () => {
  const { user, refreshProfile } = useAuthStore();
  const { categories, products, loadProducts } = useMediaStore();
  const groupsLastLoadedAt = useGroupStore((state) => state.groupsLastLoadedAt);
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const language = getStorefrontLanguage(i18n);
  const isTwoFactorEnabled = Boolean(user?.twoFactorEnabled ?? user?.isTwoFactorEnabled);
  const isCustomerUser = String(user?.role || '').trim().toLowerCase() === 'customer';

  useEffect(() => {
    if (refreshProfile) refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    const refreshProducts = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - Number(useMediaStore.getState().lastLoadedAt || 0) < 30_000) return;
      void loadProducts({ force: true, bypassCache: true });
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshProducts();
    };

    void loadProducts({ force: true });
    window.addEventListener('focus', refreshProducts);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    const refreshInterval = window.setInterval(refreshProducts, 30_000);

    return () => {
      window.removeEventListener('focus', refreshProducts);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.clearInterval(refreshInterval);
    };
  }, [loadProducts]);

  const slideTwoUrl = 'https://chat.whatsapp.com/EhP71my5sGm2VXafTk12Qw';
  const heroSlides = useMemo(() => ([
    { id: 'landing-slide-1', image: slideOneHeroImage, title: '' },
    { id: 'landing-slide-2', image: slideTwoHeroImage, title: '', href: slideTwoUrl },
    { id: 'landing-slide-3', image: slideThreeHeroImage, title: '', href: '/referral' },
    { id: 'landing-slide-4', image: slideFourHeroImage, title: '' },
    { id: 'landing-slide-5', image: slideFiveHeroImage, title: '' },
  ]), []);

  const storefrontProducts = useMemo(
    () => createStorefrontProducts(products, {
      language,
      userGroup: user?.groupId || user?.group || 'Normal',
      userGroupPercentage: user?.groupPercentage ?? null,
    }),
    [groupsLastLoadedAt, language, products, user?.group, user?.groupId, user?.groupPercentage]
  );

  const storefrontCategories = useMemo(
    () => createStorefrontCategories(categories, storefrontProducts, language),
    [categories, storefrontProducts, language]
  );

  const visibleHomepageCategories = useMemo(
    () => storefrontCategories.filter((category) => {
      if (category.id === 'all') return false;
      const p = category.parentCategory;
      if (!p) return true;
      if (typeof p === 'string' && !p.trim()) return true;
      return false;
    }),
    [storefrontCategories]
  );

  const categoryChildrenByParent = useMemo(() => (
    storefrontCategories.reduce((map, category) => {
      const parentId = String(category?.parentCategory || '').trim();
      if (!parentId) return map;
      if (!map.has(parentId)) map.set(parentId, []);
      map.get(parentId).push(category.id);
      return map;
    }, new Map())
  ), [storefrontCategories]);

  const collectCategoryIds = useCallback((categoryId) => {
    const seen = new Set();
    const stack = [String(categoryId || '').trim()].filter(Boolean);
    while (stack.length) {
      const currentId = stack.pop();
      if (!currentId || seen.has(currentId)) continue;
      seen.add(currentId);
      (categoryChildrenByParent.get(currentId) || []).forEach((childId) => {
        if (!seen.has(childId)) stack.push(childId);
      });
    }
    return seen;
  }, [categoryChildrenByParent]);

  const bestSellingProducts = useMemo(() => {
    const firstCategory = visibleHomepageCategories[0];
    const secondCategory = visibleHomepageCategories[1];
    const pickedIds = new Set();

    const pickFromCategory = (category, limit) => {
      if (!category) return [];
      const categoryIds = collectCategoryIds(category.id);
      const selected = [];

      for (const product of storefrontProducts) {
        if (selected.length >= limit) break;
        if (!categoryIds.has(String(product?.category || '').trim())) continue;
        if (pickedIds.has(product.id)) continue;
        pickedIds.add(product.id);
        selected.push(product);
      }

      return selected;
    };

    return [
      ...pickFromCategory(firstCategory, 4),
      ...pickFromCategory(secondCategory, 4),
    ];
  }, [collectCategoryIds, storefrontProducts, visibleHomepageCategories]);

  const handleCategorySelect = useCallback((categoryId) => {
    navigate(categoryId === 'all' ? '/products' : `/products?category=${encodeURIComponent(categoryId)}`);
  }, [navigate]);

  const handleProductSelect = useCallback((product) => {
    const next = new URLSearchParams();
    if (product?.category) next.set('category', product.category);
    next.set('request', product.id);
    navigate(`/products?${next.toString()}`);
  }, [navigate]);

  const openPurchaseDialog = useCallback((product) => {
    setSelectedProduct(product);
  }, []);

  const closePurchaseDialog = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  const viewCreatedOrder = useCallback((orderId) => {
    setSelectedProduct(null);
    navigate(`/orders/${encodeURIComponent(orderId)}`);
  }, [navigate]);

  const handleSellTarget = useCallback(() => {
    navigate('/buy-target');
  }, [navigate]);

  return (
    <div className="space-y-5 pb-5 sm:space-y-6">
      {isCustomerUser ? <WelcomeIntro key={user?.id || user?._id || user?.email} user={user} language={language} /> : null}
      {!isTwoFactorEnabled ? (
        <section className="group relative mx-auto w-full max-w-md overflow-hidden rounded-xl border border-[color:rgb(var(--color-primary-rgb)/0.28)] bg-[linear-gradient(110deg,rgb(var(--color-card-rgb)/0.96),rgb(var(--color-primary-rgb)/0.12),rgb(var(--color-secondary-rgb)/0.1))] p-1 shadow-[0_12px_26px_-22px_rgb(var(--color-primary-rgb)/0.55)] backdrop-blur-xl">
          <span className="pointer-events-none absolute -start-6 -top-8 h-16 w-16 rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.16)] blur-xl" />
          <div className="relative flex items-center justify-between gap-1.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[color:rgb(var(--color-primary-rgb)/0.3)] bg-[color:rgb(var(--color-primary-rgb)/0.12)] text-[var(--color-primary)]">
                <span className="absolute end-0 top-0 h-1.5 w-1.5 -translate-y-1/4 translate-x-1/4 rounded-full border border-[rgb(var(--color-card-rgb))] bg-[var(--color-secondary)]" />
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[0.62rem] font-bold text-[var(--color-text)]">
                  {language === 'ar' ? 'حماية إضافية لحسابك' : 'Extra protection for your account'}
                </p>
                <p className="mt-px truncate text-[0.52rem] font-medium text-[var(--color-text-secondary)]">
                  {language === 'ar' ? 'فعّل المصادقة الثنائية في أقل من دقيقة.' : 'Enable two-factor authentication in under a minute.'}
                </p>
              </div>
            </div>

            <Link
              to="/account-security"
              className="inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-lg border border-[color:rgb(var(--color-primary-rgb)/0.32)] bg-[color:rgb(var(--color-primary-rgb)/0.12)] px-2 text-[0.55rem] font-extrabold text-[var(--color-primary)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.55)] hover:bg-[color:rgb(var(--color-primary-rgb)/0.2)] hover:shadow-[0_8px_18px_-14px_rgb(var(--color-primary-rgb)/0.75)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            >
              <span>{language === 'ar' ? 'تفعيل الحماية' : 'Protect now'}</span>
              <ArrowUpRight className="h-3 w-3" strokeWidth={2.4} />
            </Link>
          </div>
        </section>
      ) : null}

      <HeroSlider slides={heroSlides} />

      <div className="mx-auto w-full max-w-5xl px-0.5 sm:px-2">
        <StorefrontQuickOffers language={language} onSellTarget={handleSellTarget} />
      </div>

      <section id="categories" className="scroll-mt-28 space-y-3 sm:space-y-3.5">
        <div className="relative z-10 mx-auto flex w-full max-w-5xl justify-center px-0.5 sm:px-2">
          <ProductSearchBar products={storefrontProducts} language={language} onSelectProduct={handleProductSelect} forceIconRight placeholder={language === 'ar' ? 'ابحث عن منتج...' : 'Search for a product...'} noResultsLabel={language === 'ar' ? 'لا يوجد منتج مطابق' : 'No matching product found'} className="mx-auto w-full" inputClassName="h-10 rounded-full" />
        </div>

        <div className="relative z-0 grid grid-cols-2 gap-2 sm:gap-2.5 md:grid-cols-3 xl:grid-cols-4">
          {visibleHomepageCategories.map((category, index) => (
            <CategoryCard key={category.id} category={category} active={false} index={index} onSelect={handleCategorySelect} />
          ))}
        </div>

      </section>

      {isCustomerUser ? (
        <div className="mx-auto w-full max-w-5xl px-0.5 sm:px-2">
          <Link
            to="/buy-target"
            className="group mx-auto block w-[21rem] max-w-full overflow-hidden rounded-[1rem] border border-[color:rgb(var(--color-primary-rgb)/0.28)] bg-[color:rgb(var(--color-card-rgb)/0.76)] shadow-[0_18px_42px_-30px_rgb(var(--color-primary-rgb)/0.82),inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.46)] hover:shadow-[0_22px_48px_-30px_rgb(var(--color-primary-rgb)/0.9)] sm:w-[26rem]"
            aria-label={language === 'ar' ? 'بيع تارجت' : 'Sell Target'}
          >
            <span className="block overflow-hidden bg-black">
              <img
                src={targetBannerImage}
                alt={language === 'ar' ? 'بيع تارجت' : 'Sell Target'}
                className="block aspect-[2048/800] w-full object-cover transition-transform duration-500 group-hover:scale-[1.012]"
                loading="lazy"
              />
            </span>
            <span className="block border-t border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[linear-gradient(180deg,rgb(var(--color-card-rgb)/0.94),rgb(var(--color-primary-rgb)/0.08))] px-3 py-1.5 text-center">
              <span className="text-xs font-extrabold text-[var(--color-text)] sm:text-sm">
                {language === 'ar' ? 'بيع تارجت' : 'Sell Target'}
              </span>
            </span>
          </Link>
        </div>
      ) : null}

      {bestSellingProducts.length ? (
        <BestSellingSection
          id="best-selling-title"
          title={language === 'ar' ? 'الأكثر مبيعًا' : 'Best sellers'}
          viewAllLabel={language === 'ar' ? 'عرض الكل' : 'View all'}
          products={bestSellingProducts}
          categories={storefrontCategories}
          language={language}
          onViewAll={() => navigate('/products')}
          onProductSelect={openPurchaseDialog}
          disableUnavailable
        />
      ) : null}

      <ProductPurchaseDialog
        isOpen={Boolean(selectedProduct)}
        productId={selectedProduct?.id}
        initialProduct={selectedProduct}
        onClose={closePurchaseDialog}
        onViewOrder={viewCreatedOrder}
      />

    </div>
  );
};

export default Dashboard;
