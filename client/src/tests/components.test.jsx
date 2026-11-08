import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AvailabilityBadge } from '../components/common/AvailabilityBadge';
import { PriceDisplay } from '../components/common/PriceDisplay';
import { PaymentStatusBadge } from '../components/common/PaymentStatusBadge';
import { WorkshopCard } from '../components/workshop/WorkshopCard';

describe('Common UI Components', () => {
  it('AvailabilityBadge renders Available with seats count', () => {
    render(<AvailabilityBadge state="AVAILABLE" availableSeats={15} />);
    expect(screen.getByText(/15 seats left/i)).toBeInTheDocument();
  });

  it('AvailabilityBadge renders Filling Fast', () => {
    render(<AvailabilityBadge state="FILLING_FAST" availableSeats={2} />);
    expect(screen.getByText(/Filling Fast/i)).toBeInTheDocument();
  });

  it('AvailabilityBadge renders Sold Out', () => {
    render(<AvailabilityBadge state="SOLD_OUT" />);
    expect(screen.getByText(/Sold Out/i)).toBeInTheDocument();
  });

  it('PriceDisplay formats integer paise into INR currency', () => {
    render(<PriceDisplay priceInPaise={149900} currency="INR" />);
    expect(screen.getByText(/1,499/)).toBeInTheDocument();
  });

  it('PriceDisplay displays Free when price is 0', () => {
    render(<PriceDisplay priceInPaise={0} currency="INR" />);
    expect(screen.getByText(/Free/i)).toBeInTheDocument();
  });

  it('PaymentStatusBadge displays Paid for captured payment', () => {
    render(<PaymentStatusBadge status="PAID" />);
    expect(screen.getByText(/Paid/i)).toBeInTheDocument();
  });

  it('PaymentStatusBadge displays Pending for created payment', () => {
    render(<PaymentStatusBadge status="PENDING" />);
    expect(screen.getByText(/Pending/i)).toBeInTheDocument();
  });

  it('WorkshopCard renders title, instructor, and price', () => {
    const mockWorkshop = {
      _id: 'test-123',
      title: 'Advanced Full-Stack Engineering',
      slug: 'advanced-full-stack-engineering',
      category: 'Web Development',
      shortDescription: 'Master modern fullstack architectures.',
      coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
      instructor: { name: 'Vikram S.' },
      priceInPaise: 199900,
      currency: 'INR',
      deliveryMode: 'ONLINE',
      startDateTime: new Date().toISOString(),
      endDateTime: new Date().toISOString(),
      capacity: 30,
      bookedSeats: 5,
      availableSeats: 25,
      availabilityState: 'AVAILABLE',
      ratingAverage: 4.9,
      ratingCount: 15
    };

    render(
      <BrowserRouter>
        <WorkshopCard workshop={mockWorkshop} />
      </BrowserRouter>
    );

    expect(screen.getByText('Advanced Full-Stack Engineering')).toBeInTheDocument();
    expect(screen.getByText('Vikram S.')).toBeInTheDocument();
    expect(screen.getByText('Web Development')).toBeInTheDocument();
    expect(screen.getByText(/1,999/)).toBeInTheDocument();
  });
});
