import React from 'react';
import logo from '../../assets/lool-store-logo.webp';
import { usePlatformBrand } from '../../context/ThemeContext';
import { resolveImageUrl } from '../../utils/imageUrl';

const NavigationOverlay = ({ active }) => {
  const brand = usePlatformBrand();
  return (
  <div
    className={`page-transition-overlay${active ? ' is-active' : ''}`}
    aria-hidden={!active}
  >
    <div className="page-transition-overlay__card" role="status" aria-live="polite">
      <img
        className="page-transition-overlay__logo"
        src={brand.logoPath ? resolveImageUrl(brand.logoPath) : logo}
        alt=""
        width="54"
        height="54"
      />
      <div className="page-transition-overlay__track" aria-hidden="true">
        <span className="page-transition-overlay__progress" />
      </div>
      <span className="sr-only">Loading page</span>
    </div>
  </div>
  );
};

export default NavigationOverlay;
