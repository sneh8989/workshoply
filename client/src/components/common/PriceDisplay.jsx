import React from 'react';
import { formatPrice } from '../../utils/formatters';

export const PriceDisplay = ({ priceInPaise, currency = 'INR', size = 'md' }) => {
  const isFree = priceInPaise === 0 || priceInPaise === '0';
  const formatted = formatPrice(priceInPaise, currency);

  if (size === 'lg') {
    return (
      <span className={`text-2xl font-bold tracking-tight ${isFree ? 'text-accent' : 'text-primary'}`}>
        {formatted}
      </span>
    );
  }

  return (
    <span className={`font-bold ${isFree ? 'text-accent font-semibold' : 'text-primary'}`}>
      {formatted}
    </span>
  );
};
