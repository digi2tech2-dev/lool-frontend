import React from 'react';
import BrandMark from './BrandMark';
import { cn } from '../ui/Button';

const HeaderBrand = ({ className, iconClassName, iconSrc }) => (
  <span dir="ltr" className={cn('inline-flex items-center gap-1 rounded-[14px] sm:gap-1.5', className)}>
    <BrandMark
      src={iconSrc}
      size="sm"
      compact
      showCaption={false}
      className={cn('-mx-1 scale-[0.9] min-[380px]:scale-[0.95] sm:scale-100', iconClassName)}
    />
  </span>
);

export default HeaderBrand;
