import React from 'react';
import { ArrowUpRight, Headphones, MessageCircle, Phone } from 'lucide-react';
import Modal from './Modal';
import logo from '../../assets/lool-store-logo.webp';
import { buildWhatsAppLink, SUPPORT_WHATSAPP_DISPLAY, SUPPORT_WHATSAPP_NUMBER } from '../../utils/whatsapp';
import './WhatsAppContactChooser.css';

const WhatsAppContactChooser = ({ isOpen, onClose, message = '', isArabic = true }) => {
  const whatsappLink = buildWhatsAppLink({ number: SUPPORT_WHATSAPP_NUMBER, message });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xs"
      title={isArabic ? 'خدمة العملاء' : 'Customer support'}
    >
      <div dir={isArabic ? 'rtl' : 'ltr'} className="support-contact">
        <div className="support-contact__hero">
          <div className="support-contact__topline">
            <div className="support-contact__brand" dir="ltr">
              <img src={logo} alt="Lool Store" className="support-contact__logo" />
              <span><small>CLIENT CARE</small></span>
            </div>
            <span className="support-contact__icon" aria-hidden="true"><Headphones /></span>
          </div>
          <div className="support-contact__intro">
            <span className="support-contact__eyebrow">{isArabic ? 'نحن هنا لمساعدتك' : 'WE ARE HERE TO HELP'}</span>
            <h4>{isArabic ? 'كيف نقدر نساعدك؟' : 'How can we help?'}</h4>
            <p>{isArabic ? 'فريق خدمة العملاء على بُعد رسالة واحدة منك.' : 'Our customer support team is just a message away.'}</p>
          </div>
        </div>

        <div className="support-contact__body">
          <div className="support-contact__number">
            <span className="support-contact__phone-icon" aria-hidden="true"><Phone /></span>
            <div className="support-contact__number-text">
              <span>{isArabic ? 'رقم خدمة العملاء' : 'Customer support number'}</span>
              <strong dir="ltr">{SUPPORT_WHATSAPP_DISPLAY}</strong>
            </div>
          </div>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="support-contact__action"
          >
            <MessageCircle aria-hidden="true" />
            <span>{isArabic ? 'ابدأ المحادثة على واتساب' : 'Start a WhatsApp chat'}</span>
            <ArrowUpRight className="support-contact__arrow" aria-hidden="true" />
          </a>
          <p className="support-contact__hint">{isArabic ? 'سيتم فتح محادثة واتساب مباشرة' : 'Opens a WhatsApp conversation directly'}</p>
        </div>
      </div>
    </Modal>
  );
};

export default WhatsAppContactChooser;
