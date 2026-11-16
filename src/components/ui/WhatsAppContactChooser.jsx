import React, { useEffect } from 'react';
import { ArrowUpRight, Headphones, MessageCircle } from 'lucide-react';
import Modal from './Modal';
import logo from '../../assets/lool-store-logo.webp';
import { usePlatformBrand } from '../../context/ThemeContext';
import { resolveImageUrl } from '../../utils/imageUrl';
import supportRobot from '../../assets/lool-support-robot.webp';
import { buildWhatsAppLink, getDefaultWhatsAppNumber, resolveSupportContacts } from '../../utils/whatsapp';
import useSystemStore from '../../store/useSystemStore';
import './WhatsAppContactChooser.css';

const WhatsAppContactChooser = ({ isOpen, onClose, message = '', isArabic = true }) => {
  const brand = usePlatformBrand();
  const paymentSettings = useSystemStore((state) => state.paymentSettings);
  const loadPaymentSettings = useSystemStore((state) => state.loadPaymentSettings);
  useEffect(() => {
    if (isOpen) void loadPaymentSettings({ force: true });
  }, [isOpen, loadPaymentSettings]);
  const contacts = resolveSupportContacts(paymentSettings?.supportContacts);
  const visibleContacts = contacts.length ? contacts : [{
    id: 'support-default',
    name: isArabic ? 'خدمة العملاء' : 'Customer support',
    role: '',
    number: paymentSettings?.whatsappNumber || getDefaultWhatsAppNumber(),
  }];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xs" title={isArabic ? 'خدمة العملاء' : 'Customer support'}>
      <div dir={isArabic ? 'rtl' : 'ltr'} className="support-contact">
        <div className="support-contact__hero">
          <div className="support-contact__topline">
            <div className="support-contact__brand" dir="ltr">
              <img src={brand.logoPath ? resolveImageUrl(brand.logoPath) : logo} alt={brand.platformName} className="support-contact__logo" />
              <span><small>CLIENT CARE</small></span>
            </div>
            <span className="support-contact__icon" aria-hidden="true"><Headphones /></span>
          </div>
          <div className="support-contact__welcome">
            <div className="support-contact__intro">
              <span className="support-contact__eyebrow">{isArabic ? 'نحن هنا لمساعدتك' : 'WE ARE HERE TO HELP'}</span>
              <h4>{isArabic ? 'كيف نقدر نساعدك؟' : 'How can we help?'}</h4>
              <p>{isArabic ? 'اختر جهة التواصل المناسبة وسنفتح محادثة واتساب.' : 'Choose a contact and we will open WhatsApp.'}</p>
            </div>
            <img className="support-contact__robot" src={supportRobot} alt="" width="512" height="512" decoding="async" />
          </div>
        </div>
        <div className="support-contact__body">
          {visibleContacts.map((contact) => {
            const href = buildWhatsAppLink({ number: contact.number, message });
            return (
              <a key={contact.id} href={href || '#'} target="_blank" rel="noopener noreferrer" onClick={onClose} className="support-contact__action">
                <MessageCircle aria-hidden="true" />
                <span>{contact.name}{contact.role ? ' · ' + contact.role : ''}</span>
                <ArrowUpRight className="support-contact__arrow" aria-hidden="true" />
              </a>
            );
          })}
          <p className="support-contact__hint">{isArabic ? 'سيتم فتح محادثة واتساب مباشرة.' : 'A WhatsApp conversation will open.'}</p>
        </div>
      </div>
    </Modal>
  );
};

export default WhatsAppContactChooser;
