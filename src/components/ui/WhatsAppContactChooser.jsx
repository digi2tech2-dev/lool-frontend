import React from 'react';
import { ArrowUpRight, Headphones, MessageCircle } from 'lucide-react';
import Modal from './Modal';
import logo from '../../assets/lool-store-logo.webp';
import supportRobot from '../../assets/lool-support-robot.webp';
import managerRobot from '../../assets/lool-welcome-robot.webp';
import { buildWhatsAppLink, SUPPORT_WHATSAPP_NUMBER } from '../../utils/whatsapp';
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
          <div className="support-contact__welcome">
            <div className="support-contact__intro">
              <span className="support-contact__eyebrow">{isArabic ? 'نحن هنا لمساعدتك' : 'WE ARE HERE TO HELP'}</span>
              <h4>{isArabic ? 'كيف نقدر نساعدك؟' : 'How can we help?'}</h4>
              <p>{isArabic ? 'فريق خدمة العملاء على بُعد رسالة واحدة منك.' : 'Our customer support team is just a message away.'}</p>
            </div>
            <img className="support-contact__robot" src={supportRobot} alt="" width="512" height="512" decoding="async" />
          </div>
        </div>

        <div className="support-contact__body">
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" onClick={onClose} className="support-contact__number">
            <img className="support-contact__manager-avatar" src={managerRobot} alt="" width="512" height="512" decoding="async" />
            <div className="support-contact__number-text">
              <strong>{isArabic ? 'مدير المنصة (لول)' : 'Platform manager (Lool)'}</strong>
            </div>
          </a>
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
