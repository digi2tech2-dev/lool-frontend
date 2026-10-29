import React from 'react';
import { Instagram, MessageCircle, Phone } from 'lucide-react';

const INSTAGRAM_URL = 'https://www.instagram.com/lool._store?cplk=MjIzOHRnZjRkNXY1';
const WHATSAPP_COMMUNITY_URL = 'https://chat.whatsapp.com/EhP71my5sGm2VXafTk12Qw';

export const StoreSocialLinks = ({ isArabic = true }) => (
  <div className="flex items-center justify-center gap-3" dir="ltr">
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={isArabic ? 'إنستجرام Lool Store' : 'Lool Store Instagram'}
      title={isArabic ? 'إنستجرام' : 'Instagram'}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.25)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] text-[var(--color-text-secondary)] transition-colors hover:border-fuchsia-400/60 hover:text-fuchsia-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400"
    >
      <Instagram className="h-4 w-4" aria-hidden="true" />
    </a>
    <a
      href={WHATSAPP_COMMUNITY_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={isArabic ? 'مجتمع واتساب Lool Store' : 'Lool Store WhatsApp community'}
      title={isArabic ? 'مجتمع واتساب' : 'WhatsApp community'}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.25)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] text-[var(--color-text-secondary)] transition-colors hover:border-emerald-400/60 hover:text-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
    >
      <span className="relative inline-flex h-4 w-4 items-center justify-center" aria-hidden="true">
        <MessageCircle className="absolute inset-0 h-4 w-4" />
        <Phone className="h-2 w-2" strokeWidth={2.5} />
      </span>
    </a>
  </div>
);

const SidebarSocialFooter = ({ isArabic = true }) => (
  <div className="relative z-10 shrink-0 border-t border-[color:rgb(var(--color-border-rgb)/0.55)] px-3 pb-3 pt-2.5 text-center" dir="ltr">
    <div className="text-[0.62rem] font-semibold text-[var(--color-text-secondary)]">© 2026 Lool Store</div>
    <div className="mt-2">
      <StoreSocialLinks isArabic={isArabic} />
    </div>
  </div>
);

export default SidebarSocialFooter;
