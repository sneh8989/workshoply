import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminBookingsPage } from '../pages/admin/AdminBookingsPage';
import { adminApi } from '../api/admin.api';

// Mock adminApi
vi.mock('../api/admin.api', () => ({
  adminApi: {
    getBookings: vi.fn(),
    exportBookingsCsv: vi.fn(),
    updateBookingStatus: vi.fn()
  }
}));

describe('AdminBookingsPage Component', () => {
  const mockBookingsData = [
    {
      _id: 'booking-1',
      bookingRef: 'WKL-20261027-FA8B32',
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      seatQuantity: 1,
      totalAmountInPaise: 199900,
      createdAt: '2026-10-27T10:00:00.000Z',
      user: { name: 'Refund Test User', email: 'refund.tester@workshoply.dev' },
      workshop: {
        title: 'Mastering Full-Stack React & Node.js Architecture',
        category: 'Web Development'
      }
    },
    {
      _id: 'booking-2',
      bookingRef: 'WKL-20261027-80E5F0',
      bookingStatus: 'CANCELLED',
      paymentStatus: 'REFUNDED',
      seatQuantity: 2,
      totalAmountInPaise: 199800,
      createdAt: '2026-10-27T11:00:00.000Z',
      user: { name: 'Aarav Sharma', email: 'aarav@example.com' },
      workshop: {
        title: 'The Confident Speaker: Executive Communication',
        category: 'Leadership'
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.getBookings.mockResolvedValue({
      data: mockBookingsData,
      meta: { page: 1, pages: 1, total: 2 }
    });
  });

  it('renders summary statistics cards with genuine booking data', async () => {
    render(<AdminBookingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Records')).toBeInTheDocument();
    });

    // 2 total records (also appears in seats badge)
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    // Confirmed count card
    expect(screen.getAllByText('Confirmed').length).toBeGreaterThanOrEqual(1);
    // Paid / captured count card
    expect(screen.getAllByText('Paid / Captured').length).toBeGreaterThanOrEqual(1);
    // Paid revenue
    expect(screen.getByText('Paid Revenue')).toBeInTheDocument();
  });

  it('renders all table headers including Actions without truncation', async () => {
    render(<AdminBookingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Booking Ref')).toBeInTheDocument();
    });

    expect(screen.getByText('Workshop')).toBeInTheDocument();
    expect(screen.getByText('Attendee')).toBeInTheDocument();
    expect(screen.getByText('Seats')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Booking Status')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders booking references without wrapping and includes copy button', async () => {
    render(<AdminBookingsPage />);

    await waitFor(() => {
      expect(screen.getByText('WKL-20261027-FA8B32')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Copy booking reference WKL-20261027-FA8B32')).toBeInTheDocument();
    expect(screen.getByLabelText('Copy booking reference WKL-20261027-80E5F0')).toBeInTheDocument();
  });

  it('renders workshop title with title attribute tooltip for full text accessibility', async () => {
    render(<AdminBookingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Mastering Full-Stack React & Node.js Architecture')).toBeInTheDocument();
    });

    const workshopContainer = screen.getByTitle('Mastering Full-Stack React & Node.js Architecture');
    expect(workshopContainer).toBeInTheDocument();
  });

  it('renders Status button and View Details button with accessible labels in Actions column', async () => {
    render(<AdminBookingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Change status for booking WKL-20261027-FA8B32')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('View details for booking WKL-20261027-FA8B32')).toBeInTheDocument();
    expect(screen.getByLabelText('Change status for booking WKL-20261027-80E5F0')).toBeInTheDocument();
    expect(screen.getByLabelText('View details for booking WKL-20261027-80E5F0')).toBeInTheDocument();
  });

  it('calls exportBookingsCsv when Export CSV button is clicked', async () => {
    adminApi.exportBookingsCsv.mockResolvedValue({});
    render(<AdminBookingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Export Bookings CSV')).toBeInTheDocument();
    });

    const exportBtn = screen.getByText('Export Bookings CSV');
    fireEvent.click(exportBtn);

    expect(adminApi.exportBookingsCsv).toHaveBeenCalledTimes(1);
  });

  it('opens status modal when Status button is clicked', async () => {
    render(<AdminBookingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Change status for booking WKL-20261027-FA8B32')).toBeInTheDocument();
    });

    const statusBtn = screen.getByLabelText('Change status for booking WKL-20261027-FA8B32');
    fireEvent.click(statusBtn);

    expect(screen.getByText('Change Booking & Payment Status')).toBeInTheDocument();
    expect(screen.getByText('Save Status Changes')).toBeInTheDocument();
  });

  it('opens details modal when View Details button is clicked', async () => {
    render(<AdminBookingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('View details for booking WKL-20261027-FA8B32')).toBeInTheDocument();
    });

    const detailsBtn = screen.getByLabelText('View details for booking WKL-20261027-FA8B32');
    fireEvent.click(detailsBtn);

    expect(screen.getByText('Booking Details')).toBeInTheDocument();
    expect(screen.getByText('Seats Reserved:')).toBeInTheDocument();
  });

  it('triggers search query filtering when user types in search input', async () => {
    render(<AdminBookingsPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by ref or transaction ID/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by ref or transaction ID/i);
    fireEvent.change(searchInput, { target: { value: 'FA8B32' } });

    await waitFor(() => {
      expect(adminApi.getBookings).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'FA8B32' })
      );
    });
  });
});
