import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CustomerOrderCard from '../components/orders/CustomerOrderCard';
import OrderDetailsDrawer from '../components/orders/OrderDetailsDrawer';
import EmptyOrdersState from '../components/orders/EmptyOrdersState';
import DashboardDateRangeFilter from '../components/admin-dashboard/DashboardDateRangeFilter';
import useAuthStore from '../store/useAuthStore';
import useOrderStore from '../store/useOrderStore';
import useMediaStore from '../store/useMediaStore';
import useSystemStore from '../store/useSystemStore';
import { filterOrders, enrichOrders } from '../utils/orders';
import { formatNumber } from '../utils/intl';
import { inputBaseClassName } from '../components/ui/Input';

const ORDERS_PER_PAGE = 8;

const getTodayInputValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const asPositiveNumber = (value) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

const getOrderExchangeRate = (order = {}, currencies = []) => {
  const currencyCode = String(order?.currencyCode || 'USD').trim().toUpperCase();
  if (currencyCode === 'USD') return 1;

  const executionRate = asPositiveNumber(
    order?.financialSnapshot?.exchangeRateAtExecution
    ?? order?.exchangeRateAtExecution
    ?? order?.rateSnapshot
  );
  if (executionRate) return executionRate;

  const currency = currencies.find((item) => String(item?.code || '').trim().toUpperCase() === currencyCode);
  return asPositiveNumber(currency?.rate) || 1;
};

const getOrderUsdValue = (order = {}, currencies = []) => {
  const amount = Number(order?.amountValue || 0);
  if (!Number.isFinite(amount)) return 0;
  return amount / getOrderExchangeRate(order, currencies);
};

const escapeXml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const createExcelCell = (value, type = 'String', styleId = '') => (
  `<Cell${styleId ? ` ss:StyleID="${styleId}"` : ''}><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`
);

const normalizeSearchValue = (value) => String(value ?? '')
  .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
  .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
  .trim()
  .replace(/^#/, '')
  .toLowerCase();

const getOrderSearchText = (order = {}) => (
  [
    order?.searchIndex,
    order?.id,
    order?._id,
    order?.orderNumber,
    order?.siteOrderNumber,
    order?.internalOrderNumber,
    order?.supplierOrderNumber,
    order?.externalOrderId,
    order?.providerOrderId,
    order?.userId,
    order?.customerId,
    order?.user?._id,
    order?.user?.id,
    order?.playerId,
    order?.uid,
    order?.username,
    order?.customerInput,
    order?.supplierRequestSnapshot?.orderId,
    order?.supplierResponseSnapshot?.orderId,
    order?.supplierResponseSnapshot?.data?.orderId,
  ].map(normalizeSearchValue).filter(Boolean).join(' ')
);

const matchesOrderSearch = (order, searchTerm) => {
  const normalizedSearchTerm = normalizeSearchValue(searchTerm);
  if (!normalizedSearchTerm) return true;
  return getOrderSearchText(order).includes(normalizedSearchTerm);
};

const Orders = () => {
  const { user } = useAuthStore();
  const { orders, loadOrders, getOrderById } = useOrderStore();
  const { products, loadProducts } = useMediaStore();
  const { currencies, loadCurrencies } = useSystemStore();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { orderId: routeOrderId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [customStartDate, setCustomStartDate] = useState(getTodayInputValue);
  const [customEndDate, setCustomEndDate] = useState(getTodayInputValue);
  const [sortOrder, setSortOrder] = useState('newest');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const isArabic = String(i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().startsWith('ar');
  const locale = isArabic ? 'ar-EG' : 'en-US';
  const todayInputValue = useMemo(getTodayInputValue, []);
  const currentUserId = String(user?.id || user?._id || user?.userId || '').trim();
  const orderOwnerScopeId = currentUserId;

  useEffect(() => {
    let isMounted = true;

    const loadPage = async () => {
      if (!orderOwnerScopeId) return;

      setIsLoading(true);

      await Promise.allSettled([
        Promise.resolve(loadOrders(orderOwnerScopeId, { force: true })),
        Promise.resolve(loadProducts({ force: true })),
        Promise.resolve(loadCurrencies()),
      ]);

      if (isMounted) {
        setIsLoading(false);
      }
    };

    loadPage();

    return () => {
      isMounted = false;
    };
  }, [loadCurrencies, loadOrders, loadProducts, orderOwnerScopeId]);

  const enrichedOrders = useMemo(
    () => enrichOrders(orders, {
      users: user ? [user] : [],
      products,
      language: isArabic ? 'ar' : 'en',
    }),
    [orders, products, user, isArabic]
  );

  const accountOrders = useMemo(
    () => enrichedOrders.filter((order) => {
      const ownerId = String(
        order?.userId
        || order?.customerId
        || order?.user?._id
        || order?.user?.id
        || ''
      ).trim();

      return !ownerId || !currentUserId || ownerId === currentUserId;
    }),
    [currentUserId, enrichedOrders]
  );

  const ordersBeforeTypeFilter = useMemo(
    () => {
      const baseFiltered = filterOrders(accountOrders, {
        searchTerm: '',
        statusFilter,
        typeFilter: 'all',
        dateFilter,
        sortOrder,
      });

      const orderNumberFiltered = baseFiltered.filter((order) => matchesOrderSearch(order, searchTerm));

      if (dateFilter !== 'custom') {
        return orderNumberFiltered;
      }

      const startBoundary = customStartDate ? new Date(`${customStartDate}T00:00:00`) : null;
      const endBoundary = customEndDate ? new Date(`${customEndDate}T23:59:59.999`) : null;

      return orderNumberFiltered.filter((order) => {
        const orderDate = new Date(order?.createdAt || 0);
        if (Number.isNaN(orderDate.getTime())) return false;
        if (startBoundary && orderDate < startBoundary) return false;
        if (endBoundary && orderDate > endBoundary) return false;
        return true;
      });
    },
    [accountOrders, customEndDate, customStartDate, dateFilter, searchTerm, sortOrder, statusFilter]
  );

  const filteredOrders = useMemo(
    () => (typeFilter === 'all'
      ? ordersBeforeTypeFilter
      : ordersBeforeTypeFilter.filter((order) => order?.typeKey === typeFilter)),
    [ordersBeforeTypeFilter, typeFilter]
  );

  const typeCounts = useMemo(() => ordersBeforeTypeFilter.reduce((summary, order) => ({
    apiCount: summary.apiCount + (order?.typeKey === 'auto' ? 1 : 0),
    manualCount: summary.manualCount + (order?.typeKey === 'manual' ? 1 : 0),
  }), {
    apiCount: 0,
    manualCount: 0,
  }), [ordersBeforeTypeFilter]);

  const totalUsd = useMemo(
    () => filteredOrders.reduce((total, order) => total + getOrderUsdValue(order, currencies), 0),
    [currencies, filteredOrders]
  );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * ORDERS_PER_PAGE;
  const paginatedOrders = useMemo(
    () => filteredOrders.slice(pageStartIndex, pageStartIndex + ORDERS_PER_PAGE),
    [filteredOrders, pageStartIndex]
  );
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxButtons = 5;
    let start = Math.max(1, safeCurrentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);

    start = Math.max(1, end - maxButtons + 1);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [safeCurrentPage, totalPages]);

  const selectedOrder = useMemo(
    () => accountOrders.find((order) => order.id === selectedOrderId) || null,
    [accountOrders, selectedOrderId]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [customEndDate, customStartDate, dateFilter, searchTerm, sortOrder, statusFilter, typeFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const orderIdFromQuery = String(routeOrderId || searchParams.get('orderId') || '').trim();
    if (!orderIdFromQuery) {
      setSelectedOrderId(null);
      return;
    }

    setSelectedOrderId(orderIdFromQuery);
    if (!orderOwnerScopeId) return;
    void getOrderById(orderIdFromQuery, orderOwnerScopeId).catch(() => {});
  }, [getOrderById, orderOwnerScopeId, routeOrderId, searchParams]);

  const formatCount = (value) => formatNumber(value, locale);
  const visibleStart = filteredOrders.length ? pageStartIndex + 1 : 0;
  const visibleEnd = Math.min(pageStartIndex + paginatedOrders.length, filteredOrders.length);
  const PreviousIcon = isArabic ? ChevronRight : ChevronLeft;
  const NextIcon = isArabic ? ChevronLeft : ChevronRight;

  const formatRangeDate = (value) => {
    const [year, month, day] = String(value || '').split('-').map(Number);
    if (!year || !month || !day) return isArabic ? 'غير محدد' : 'Not set';
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(year, month - 1, day));
  };

  const handleDateRangeChange = (nextStartDate, nextEndDate = nextStartDate) => {
    const normalizedStartDate = nextStartDate || '';
    const normalizedEndDate = nextEndDate || normalizedStartDate;
    setCustomStartDate(normalizedStartDate);
    setCustomEndDate(normalizedEndDate);

    if (!normalizedStartDate && !normalizedEndDate) {
      setDateFilter('all');
    } else if (normalizedStartDate === todayInputValue && normalizedEndDate === todayInputValue) {
      setDateFilter('today');
    } else {
      setDateFilter('custom');
    }
  };

  const handleExportExcel = () => {
    if (!filteredOrders.length) return;

    const headers = isArabic
      ? ['رقم الطلب', 'التاريخ', 'المنتج', 'طريقة التنفيذ', 'الحالة', 'القيمة الأصلية', 'العملة', 'سعر الصرف', 'القيمة بالدولار']
      : ['Order number', 'Date', 'Product', 'Execution method', 'Status', 'Original amount', 'Currency', 'Exchange rate', 'USD amount'];
    const headerRow = `<Row>${headers.map((header) => createExcelCell(header, 'String', 'Header')).join('')}</Row>`;
    const dataRows = filteredOrders.map((order) => {
      const exchangeRate = getOrderExchangeRate(order, currencies);
      const usdValue = getOrderUsdValue(order, currencies);
      const orderDate = new Date(order?.createdAt || 0);
      const formattedDate = Number.isNaN(orderDate.getTime()) ? '' : orderDate.toLocaleString(locale);
      const executionType = order?.typeKey === 'auto'
        ? (isArabic ? 'API' : 'API')
        : (isArabic ? 'يدوي' : 'Manual');

      return `<Row>${[
        createExcelCell(order?.orderNumber || order?.id || ''),
        createExcelCell(formattedDate),
        createExcelCell(order?.productName || ''),
        createExcelCell(executionType),
        createExcelCell(order?.statusLabel || order?.status || ''),
        createExcelCell(Number(order?.amountValue || 0), 'Number'),
        createExcelCell(order?.currencyCode || 'USD'),
        createExcelCell(exchangeRate, 'Number'),
        createExcelCell(usdValue.toFixed(4), 'Number'),
      ].join('')}</Row>`;
    }).join('');
    const totalLabel = isArabic ? 'إجمالي النتائج بالدولار' : 'Filtered total in USD';
    const totalRow = `<Row>${createExcelCell(totalLabel, 'String', 'Total')}${createExcelCell('', 'String')}${createExcelCell('', 'String')}${createExcelCell('', 'String')}${createExcelCell('', 'String')}${createExcelCell('', 'String')}${createExcelCell('', 'String')}${createExcelCell('', 'String')}${createExcelCell(totalUsd.toFixed(4), 'Number', 'Total')}</Row>`;
    const workbook = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
        <Styles>
          <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="11"/></Style>
          <Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#6D28D9" ss:Pattern="Solid"/></Style>
          <Style ss:ID="Total"><Font ss:FontName="Arial" ss:Size="11" ss:Bold="1"/><Interior ss:Color="#EDE9FE" ss:Pattern="Solid"/></Style>
        </Styles>
        <Worksheet ss:Name="Orders">
          <Table ss:DefaultColumnWidth="105" ss:DefaultRowHeight="20">${headerRow}${dataRows}${totalRow}</Table>
          <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><DisplayRightToLeft/></WorksheetOptions>
        </Worksheet>
      </Workbook>`;
    const blob = new Blob([`\ufeff${workbook}`], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = `lool-orders-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="min-w-0 space-y-3 pb-3">
      <section className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.82)] bg-[linear-gradient(135deg,rgb(var(--color-card-rgb)/0.94),rgb(var(--color-surface-rgb)/0.68))] px-3 py-2 text-[11px] shadow-[var(--shadow-subtle)] sm:text-xs">
        <div className="me-auto flex items-center gap-2">
          <strong className="font-black text-[var(--color-text)]">
            {dateFilter === 'today'
              ? (isArabic ? 'طلباتك اليوم' : 'Your orders today')
              : dateFilter === 'all'
                ? (isArabic ? 'كل طلباتك' : 'All your orders')
                : (isArabic ? 'طلباتك في الفترة المحددة' : 'Your orders in this period')}
          </strong>
          <span className="rounded-full bg-violet-500/12 px-2 py-0.5 font-black text-violet-400">
            {formatCount(filteredOrders.length)}
          </span>
        </div>

        <span className="whitespace-nowrap text-[var(--color-text-secondary)]">
          {isArabic ? 'الإجمالي' : 'Total'}: <b className="text-emerald-400" dir="ltr">${formatNumber(totalUsd, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
        </span>

        <button
          type="button"
          onClick={handleExportExcel}
          disabled={!filteredOrders.length}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2.5 font-black text-emerald-400 transition hover:border-emerald-400/45 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{isArabic ? 'تنزيل Excel' : 'Download Excel'}</span>
        </button>

        <div dir={isArabic ? 'rtl' : 'ltr'} className="flex basis-full flex-wrap items-center gap-1.5 border-t border-[color:rgb(var(--color-border-rgb)/0.62)] pt-2">
          <button
            type="button"
            aria-pressed={typeFilter === 'auto'}
            onClick={() => setTypeFilter((current) => (current === 'auto' ? 'all' : 'auto'))}
            className={`whitespace-nowrap rounded-lg border px-2 py-1 font-bold transition ${typeFilter === 'auto' ? 'border-sky-400/35 bg-sky-500/15 text-sky-400' : 'border-transparent text-[var(--color-text-secondary)] hover:border-sky-400/20 hover:bg-sky-500/8 hover:text-sky-400'}`}
          >
            {isArabic ? 'عن طريق API' : 'Through API'}: <b>{formatCount(typeCounts.apiCount)}</b>
          </button>
          <button
            type="button"
            aria-pressed={typeFilter === 'manual'}
            onClick={() => setTypeFilter((current) => (current === 'manual' ? 'all' : 'manual'))}
            className={`whitespace-nowrap rounded-lg border px-2 py-1 font-bold transition ${typeFilter === 'manual' ? 'border-violet-400/35 bg-violet-500/15 text-violet-400' : 'border-transparent text-[var(--color-text-secondary)] hover:border-violet-400/20 hover:bg-violet-500/8 hover:text-violet-400'}`}
          >
            {isArabic ? 'يدوي' : 'Manual'}: <b>{formatCount(typeCounts.manualCount)}</b>
          </button>

          <span className="ms-1 text-[10px] font-bold text-[var(--color-muted)]">
            {isArabic ? 'الحالة:' : 'Status:'}
          </span>
          {[
            { value: 'completed', label: isArabic ? 'مكتمل' : 'Completed', active: 'border-emerald-400/35 bg-emerald-500/15 text-emerald-400' },
            { value: 'incomplete', label: isArabic ? 'غير مكتمل' : 'Incomplete', active: 'border-rose-400/35 bg-rose-500/15 text-rose-400' },
            { value: 'processing', label: isArabic ? 'قيد الانتظار' : 'Pending', active: 'border-amber-400/35 bg-amber-500/15 text-amber-400' },
          ].map((status) => (
            <button
              key={status.value}
              type="button"
              aria-pressed={statusFilter === status.value}
              onClick={() => setStatusFilter((current) => (current === status.value ? 'all' : status.value))}
              className={`whitespace-nowrap rounded-lg border px-2 py-1 font-bold transition ${statusFilter === status.value ? status.active : 'border-transparent text-[var(--color-text-secondary)] hover:bg-[color:rgb(var(--color-surface-rgb)/0.68)]'}`}
            >
              {status.label}
            </button>
          ))}

        </div>

        <div dir="ltr" className="flex basis-full justify-end border-t border-[color:rgb(var(--color-border-rgb)/0.62)] pt-2">
          <label dir={isArabic ? 'rtl' : 'ltr'} className="flex items-center gap-1.5">
            <span className="whitespace-nowrap text-[10px] font-bold text-[var(--color-muted)]">
              {isArabic ? 'الترتيب:' : 'Sort:'}
            </span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              aria-label={isArabic ? 'ترتيب الطلبات' : 'Sort orders'}
              className={`${inputBaseClassName} !h-8 !w-[108px] !min-w-[108px] !rounded-lg !px-2 !py-0 !text-[10px] !shadow-none`}
            >
              <option value="newest">{isArabic ? 'الأحدث أولاً' : 'Newest first'}</option>
              <option value="oldest">{isArabic ? 'الأقدم أولاً' : 'Oldest first'}</option>
            </select>
          </label>
        </div>

        <div className="flex basis-full flex-col gap-2 border-t border-[color:rgb(var(--color-border-rgb)/0.62)] pt-2 sm:flex-row sm:items-center">
          <DashboardDateRangeFilter
            isArabic={isArabic}
            formatRangeDate={formatRangeDate}
            todayInputValue={todayInputValue}
            startDate={customStartDate}
            endDate={customEndDate}
            onRangeChange={handleDateRangeChange}
            compact
            showFilterButton={false}
            className="!basis-auto !w-auto shrink-0"
          />
          <label className="relative min-w-0 flex-1 sm:min-w-[220px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={isArabic ? 'بحث برقم الطلب أو معرف المستخدم' : 'Search by order number or user ID'}
              aria-label={isArabic ? 'بحث برقم الطلب أو معرف المستخدم' : 'Search by order number or user ID'}
              className={`${inputBaseClassName} !h-9 !rounded-xl !py-1.5 !pe-3 !ps-9 !text-[11px] !shadow-none sm:!h-10 sm:!text-xs`}
            />
          </label>
        </div>
      </section>

      {filteredOrders.length ? (
        <>
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            {paginatedOrders.map((order) => (
              <CustomerOrderCard
                key={order.id}
                order={order}
                isArabic={isArabic}
                currencies={currencies}
                onSelect={() => {
                  setSelectedOrderId(order.id);
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.set('orderId', order.id);
                  setSearchParams(nextParams, { replace: true });
                  void getOrderById(order.id, orderOwnerScopeId).catch(() => {});
                }}
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav
              className="flex flex-col gap-2 rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.82)] bg-[color:rgb(var(--color-card-rgb)/0.78)] p-2.5 shadow-[var(--shadow-subtle)] sm:flex-row sm:items-center sm:justify-between"
              aria-label={isArabic ? 'صفحات الطلبات' : 'Orders pages'}
            >
              <p className="text-center text-xs font-bold text-[var(--color-text-secondary)] sm:text-start">
                {isArabic
                  ? `عرض ${formatCount(visibleStart)}-${formatCount(visibleEnd)} من ${formatCount(filteredOrders.length)} طلب`
                  : `Showing ${formatCount(visibleStart)}-${formatCount(visibleEnd)} of ${formatCount(filteredOrders.length)} orders`}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safeCurrentPage === 1}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-surface-rgb)/0.58)] px-3 text-[11px] font-black text-[var(--color-text)] transition hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.34)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                >
                  <PreviousIcon className="h-3.5 w-3.5" />
                  <span>{isArabic ? 'الصفحة السابقة' : 'Previous page'}</span>
                </button>

                <div className="flex items-center gap-1" dir="ltr">
                  {pageNumbers[0] > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setCurrentPage(1)}
                        className="h-9 min-w-9 rounded-lg border border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-surface-rgb)/0.52)] px-3 text-[11px] font-black text-[var(--color-text)] transition hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.34)]"
                      >
                        1
                      </button>
                      <span className="px-1 text-sm font-black text-[var(--color-muted)]">...</span>
                    </>
                  ) : null}

                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      aria-current={page === safeCurrentPage ? 'page' : undefined}
                      className={`h-9 min-w-9 rounded-lg border px-3 text-[11px] font-black transition hover:-translate-y-0.5 ${
                        page === safeCurrentPage
                          ? 'border-[color:rgb(var(--color-primary-rgb)/0.52)] bg-[linear-gradient(135deg,rgb(var(--color-primary-rgb)/0.2),rgb(168_85_247/0.14))] text-[var(--color-primary)] shadow-[0_0_24px_-16px_rgb(var(--color-primary-rgb)/0.9)]'
                          : 'border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-surface-rgb)/0.52)] text-[var(--color-text)] hover:border-[color:rgb(var(--color-primary-rgb)/0.34)]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  {pageNumbers[pageNumbers.length - 1] < totalPages ? (
                    <>
                      <span className="px-1 text-sm font-black text-[var(--color-muted)]">...</span>
                      <button
                        type="button"
                        onClick={() => setCurrentPage(totalPages)}
                        className="h-9 min-w-9 rounded-lg border border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-surface-rgb)/0.52)] px-3 text-[11px] font-black text-[var(--color-text)] transition hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.34)]"
                      >
                        {totalPages}
                      </button>
                    </>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[color:rgb(var(--color-primary-rgb)/0.32)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] px-3 text-[11px] font-black text-[var(--color-primary)] shadow-[var(--shadow-subtle)] transition hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.48)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                >
                  <span>{isArabic ? 'الصفحة التالية' : 'Next page'}</span>
                  <NextIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </nav>
          ) : null}
        </>
      ) : (
        <EmptyOrdersState
          title={isLoading
            ? (isArabic ? 'جارٍ تحميل الطلبات' : 'Loading orders')
            : (isArabic ? 'لا توجد طلبات حتى الآن' : 'No orders yet')}
          description={isLoading
            ? (isArabic ? 'نقوم بجلب طلباتك الحالية من النظام.' : 'We are fetching your current orders from the system.')
            : (isArabic
              ? 'عندما تنشئ طلبًا جديدًا سيظهر هنا مع حالته وتفاصيله كاملة.'
              : 'Once you place a new order, it will appear here with its status and details.')}
          actionLabel={isLoading ? '' : (isArabic ? 'تصفح المنتجات' : 'Browse products')}
          actionTo={isLoading ? '' : '/products'}
        />
      )}

      <OrderDetailsDrawer
        isOpen={Boolean(selectedOrder)}
        onClose={() => {
          setSelectedOrderId(null);
          if (routeOrderId) {
            navigate('/orders', { replace: true });
            return;
          }
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete('orderId');
          setSearchParams(nextParams, { replace: true });
        }}
        order={selectedOrder}
        isArabic={isArabic}
        currencies={currencies}
        view="customer"
      />
    </div>
  );
};

export default Orders;
