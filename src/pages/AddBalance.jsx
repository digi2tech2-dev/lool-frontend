import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CreditCard,
  Globe2,
  ShieldCheck,
  Smartphone,
  Wallet,
  Zap,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../context/LanguageContext";
import useAuthStore from "../store/useAuthStore";
import useSystemStore from "../store/useSystemStore";
import { resolveImageUrl } from "../utils/imageUrl";
import { formatWalletNumber } from "../utils/storefront";
import { getActivePaymentGroups } from "../utils/paymentSettings";
import walletHeroImg from "../assets/lool-sidebar-logo.webp";
import vodafoneRobotImg from "../assets/lool-welcome-robot.webp";

const getMethodIcon = (method) => {
  const token = `${method?.type || ""} ${method?.id || ""} ${method?.name || ""}`.toLowerCase();
  if (token.includes("bank") || token.includes("تحويل")) return Building2;
  if (token.includes("wallet") || token.includes("vodafone") || token.includes("orange") || token.includes("etisalat")) return Smartphone;
  return CreditCard;
};

/* ─── Currency badge colours ─── */
const CURRENCY_COLORS = {
  EGP: { bg: "from-[#6930c6] via-[#7134ce] to-[#5f195d]", badge: "bg-[#86e4ff]/15 text-[#fff0c9] border-[#86e4ff]/35" },
  USD: { bg: "from-[#5f195d] via-[#6930c6] to-[#7134ce]", badge: "bg-[#d9a0ff]/15 text-[#ffd8f5] border-[#d9a0ff]/35" },
  MAD: { bg: "from-[#1485bf] via-[#7134ce] to-[#37208c]", badge: "bg-[#86e4ff]/15 text-[#fff0c9] border-[#86e4ff]/35" },
};
const getCurrencyStyle = (currency) => CURRENCY_COLORS[String(currency || "").toUpperCase()] || { bg: "from-gray-700 to-gray-900", badge: "bg-white/10 text-white/70 border-white/20" };

/* ─── Big glamorous payment card ─── */
const PaymentMethodButton = ({ method, groupName, groupCurrency, onSelect, isRTL }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = getMethodIcon(method);
  const showImage = Boolean(method?.image) && !imageFailed;
  const isVodafoneCash = [method?.id, method?.name].some((value) => /vodafone|فودافون/i.test(String(value || "")));
  const note = method.description || (method.type === "mobile_wallet" ? (isRTL ? "محفظة إلكترونية" : "Mobile wallet") : (isRTL ? "وسيلة دفع آمنة" : "Secure payment method"));
  const currStyle = getCurrencyStyle(groupCurrency);

  return (
    <button
      type="button"
      onClick={() => onSelect(method)}
      className="group relative flex flex-col overflow-hidden rounded-2xl text-white shadow-[0_12px_40px_-16px_rgba(0,0,0,0.7)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_48px_-16px_rgba(0,0,0,0.85)] focus:outline-none"
      style={{ background: "radial-gradient(circle at 15% 8%,rgba(241,185,121,0.24),transparent 28%), radial-gradient(circle at 90% 94%,rgba(217,54,194,0.26),transparent 38%), linear-gradient(145deg,#3a0b38 0%,#6930c6 42%,#7134ce 68%,#5f195d 100%)", border: "2px solid rgba(241,185,121,0.42)" }}
    >
      {/* sparkle dots */}
      <span className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.18) 1px,transparent 1px)", backgroundSize: "18px 18px", opacity: 0.4 }} />

      {/* header */}
      <div className="relative flex items-center justify-between px-2.5 pt-2.5 pb-1">
        <span className="flex items-center gap-1 text-[9px] font-black text-[#fff0c9] drop-shadow"><span>💰</span><span>{isRTL ? "اشحن رصيدك" : "Top-up"}</span></span>
        <span className="rounded-full border border-[#86e4ff]/30 bg-[#86e4ff]/15 px-2 py-0.5 text-[8px] font-black text-[#fff0c9] backdrop-blur">Recharge</span>
      </div>

      {/* logo */}
      <div className={`relative mx-2.5 mb-0 mt-1 flex h-[86px] items-center justify-center overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] ${isVodafoneCash ? "bg-[linear-gradient(135deg,#f4f0ff,#e5f5ff)]" : "bg-white"}`}>
        {showImage ? (
          <img src={resolveImageUrl(method.image)} alt="" className={`h-full object-contain p-2 ${isVodafoneCash ? "w-[62%] me-auto" : "w-full"}`} loading="lazy" decoding="async" onError={() => setImageFailed(true)} />
        ) : (
          <Icon className={`h-9 w-9 text-gray-400 ${isVodafoneCash ? "me-auto ms-5" : ""}`} />
        )}
        {isVodafoneCash ? (
          <img src={vodafoneRobotImg} alt="" aria-hidden="true" className="pointer-events-none absolute inset-y-0 end-1 h-full w-[42%] object-contain object-bottom" loading="lazy" decoding="async" />
        ) : null}
      </div>

      {/* coins */}
      <div className="px-2.5 pt-1 text-center text-sm leading-none select-none">🪙🪙🪙🪙</div>

      {/* name badge */}
      <div className="mx-2.5 mt-1 rounded-lg bg-gradient-to-r from-[#37208c] via-[#d936c2] to-[#1485bf] py-1 text-center text-[11px] font-black text-white shadow-[0_4px_14px_-6px_rgba(49,16,47,0.72)]">{method.name}</div>

      {/* note section */}
      <div className="mx-2.5 mt-1.5 overflow-hidden rounded-lg border border-[#d9a0ff]/25 bg-[#5f195d]/30 backdrop-blur">
        <div className="bg-[#86e4ff]/16 px-2 py-0.5 text-center text-[8px] font-black text-[#fff0c9]">{isRTL ? "ملاحظة" : "Note"}</div>
        <div className="px-2 py-1 text-center text-[8px] font-semibold leading-4 text-white/85">{note}</div>
      </div>

      {/* currency + group footer */}
      <div className={`mx-2.5 mb-2.5 mt-1.5 flex items-center justify-between gap-1 rounded-lg bg-gradient-to-r ${currStyle.bg} px-2 py-1`}>
        <span className="truncate text-[8px] font-semibold text-white/70">{groupName}</span>
        {groupCurrency ? (
          <span className={`shrink-0 rounded-md border px-1.5 py-0.5 font-[Poppins] text-[8px] font-black ${currStyle.badge}`}>{String(groupCurrency).toUpperCase()}</span>
        ) : null}
      </div>
    </button>
  );
};

/* ─── Main component ─── */
const AddBalance = ({ embedded = false, automaticAmount = null, automaticCurrency = "", onSelectMethod = null }) => {
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const paymentSettings = useSystemStore((state) => state.paymentSettings);
  const loadPaymentSettings = useSystemStore((state) => state.loadPaymentSettings);
  const isRTL = dir === "rtl";

  useEffect(() => { void loadPaymentSettings({ force: true }).catch(() => null); }, [loadPaymentSettings]);

  const currentBalance = Number(user?.walletBalance ?? user?.coins ?? user?.balance ?? 0);
  const currentCurrency = String(user?.currency || "USD").toUpperCase();
  const suggestedAmount = Number(automaticAmount ?? searchParams.get("amount") ?? 0);
  const suggestedCurrency = String(automaticCurrency || searchParams.get("currency") || currentCurrency).toUpperCase();
  const isAutomaticTopup = (embedded || searchParams.get("mode") === "auto") && Number.isFinite(suggestedAmount) && suggestedAmount > 0;

  const paymentGroups = useMemo(() => getActivePaymentGroups(paymentSettings, { fallbackToDefault: false }), [paymentSettings]);

  /* Flatten all methods with their group metadata */
  const allMethods = useMemo(() =>
    paymentGroups.flatMap((group) =>
      group.methods.map((method) => ({
        ...method,
        groupId: group.id,
        groupName: group.name,
        groupCurrency: group.currency,
      }))
    ),
    [paymentGroups]
  );

  /* Unique currencies for the pills below the hero */
  const currencies = useMemo(() => {
    const seen = new Set();
    return paymentGroups.filter((g) => { if (!g.currency || seen.has(g.currency)) return false; seen.add(g.currency); return true; });
  }, [paymentGroups]);

  const handleMethodSelect = (method) => {
    if (onSelectMethod) { onSelectMethod(method); return; }
    const next = new URLSearchParams();
    if (isAutomaticTopup) { next.set("amount", String(suggestedAmount)); next.set("currency", suggestedCurrency); next.set("mode", "auto"); }
    const query = next.toString();
    navigate(`/wallet/payment-details/${method.id}${query ? `?${query}` : ""}`);
  };

  return (
    <div className={embedded ? "w-full min-w-0 overflow-x-hidden pb-1" : "min-h-full pb-6"} dir={dir}>
      <div className="mx-auto w-full min-w-0 max-w-3xl space-y-3 px-1 sm:space-y-4 sm:px-2">

        {/* ── Wallet hero ── */}
        <section className="relative isolate min-h-[17rem] overflow-hidden rounded-[1.55rem] bg-[radial-gradient(circle_at_50%_15%,#321264,#140c37_55%,#080717)] shadow-[0_30px_70px_-38px_rgba(0,0,0,0.9)] sm:min-h-[18rem]">
          <img src={walletHeroImg} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-contain object-top" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(6,5,20,0.97)_0%,rgba(6,5,20,0.86)_30%,rgba(6,5,20,0.28)_64%,transparent_100%)]" />

          {/* wallet badge – fixed top-left */}
          <div className="absolute top-3 left-3">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.62rem] font-black text-amber-200 backdrop-blur-md">
              <Wallet className="h-3 w-3" />{isRTL ? "المحفظة" : "Wallet"}
            </p>
          </div>

          {/* bottom: title + pills */}
          <div className="absolute bottom-0 w-full px-4 pb-3" dir="rtl">
            <h1 className="text-lg font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] sm:text-2xl">{t("wallet.addBalance")}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-xl">
                <span className="text-[0.6rem] font-bold text-cyan-100/80">{isRTL ? "الرصيد" : "Balance"}</span>
                <strong className="font-[Poppins] text-sm font-extrabold text-white [font-variant-numeric:tabular-nums]" dir="ltr">{formatWalletNumber(currentBalance, false, { maximumFractionDigits: 3 })}</strong>
                <span className="rounded-md bg-amber-400/25 px-1.5 py-0.5 font-[Poppins] text-[0.6rem] font-black text-amber-200">{currentCurrency}</span>
              </div>

              {currencies.map((g) => {
                const cs = getCurrencyStyle(g.currency);
                return (
                  <div key={g.id} className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 backdrop-blur-xl ${cs.badge}`}>
                    <span className="text-[8px] font-semibold opacity-80">{g.name}</span>
                    <span className={`rounded-md px-1.5 py-0.5 font-[Poppins] text-[9px] font-black border ${cs.badge}`}>{String(g.currency).toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Auto topup ── */}
        {isAutomaticTopup ? (
          <section className="flex items-center gap-3 rounded-[1rem] border border-amber-400/25 bg-[linear-gradient(115deg,rgb(245_158_11/0.1),rgb(var(--color-primary-rgb)/0.08))] p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-[0_12px_24px_-16px_rgb(245_158_11/0.8)]"><Zap className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <strong className="block text-xs font-black text-[var(--color-text)]">{isRTL ? "شحن آلي لإكمال الشراء" : "Auto top-up for your purchase"}</strong>
              <span className="mt-0.5 block text-[0.68rem] font-semibold text-[var(--color-text-secondary)]">{isRTL ? "سنضع المبلغ المطلوب تلقائيًا بعد اختيار وسيلة الدفع" : "The required amount will be entered automatically"}</span>
            </div>
            <strong className="shrink-0 text-sm font-black text-amber-600 dark:text-amber-300" dir="ltr">{formatWalletNumber(suggestedAmount, false, { maximumFractionDigits: 3 })} {suggestedCurrency}</strong>
          </section>
        ) : null}

        {/* ── All payment method cards ── */}
        {allMethods.length ? (
          <section className="overflow-hidden rounded-[1.45rem] border border-indigo-500/15 bg-[radial-gradient(24rem_circle_at_top_right,rgb(99_102_241/0.1),transparent_55%),rgb(var(--color-card-rgb)/0.7)] shadow-[0_24px_60px_-48px_rgb(99_102_241/0.58)]">
            <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 sm:p-4">
              {allMethods.map((method) => (
                <PaymentMethodButton
                  key={`${method.groupId}-${method.id}`}
                  method={method}
                  groupName={method.groupName}
                  groupCurrency={method.groupCurrency}
                  onSelect={handleMethodSelect}
                  isRTL={isRTL}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-[1rem] border border-dashed border-[color:rgb(var(--color-border-rgb)/0.82)] px-4 py-8 text-center">
            <Wallet className="mx-auto h-7 w-7 text-[var(--color-text-secondary)]" />
            <h3 className="mt-2 text-sm font-black text-[var(--color-text)]">{isRTL ? "لا توجد وسائل دفع متاحة الآن" : "No payment methods available"}</h3>
            <p className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)]">{isRTL ? "يرجى المحاولة لاحقًا أو التواصل مع الدعم" : "Try again later or contact support"}</p>
          </section>
        )}

        {/* ── Security footer ── */}
        <div className="flex items-center justify-center gap-2 py-1 text-[0.68rem] font-semibold text-[var(--color-text-secondary)]">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          {isRTL ? "بيانات التحويل محمية وتُراجع بأمان" : "Payment details are protected and reviewed securely"}
        </div>
      </div>
    </div>
  );
};

export default AddBalance;
