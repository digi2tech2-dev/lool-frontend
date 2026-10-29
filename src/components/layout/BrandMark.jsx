import React from 'react';
import { cn } from '../ui/Button';
import brandIconImage from '../../assets/lool-store-logo.webp';

const sizes = {
  xs: 'h-12 w-[4.5rem]',
  sm: 'h-14 w-[5.25rem]',
  md: 'h-16 w-24',
  lg: 'h-20 w-[7.5rem]',
};

const BrandMark = ({ className, size = 'md', src = brandIconImage }) => (
  <div className={cn('relative overflow-hidden', sizes[size] || sizes.md, className)}>
    <img
      src={src}
      alt="Lool Store"
      loading="eager"
      decoding="async"
      className="h-full w-full object-contain"
    />
  </div>
);

export default BrandMark;
