import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TicketModal } from '../components/booking/TicketModal';

describe('TicketModal Component', () => {
  const mockBooking = {
    _id: 'booking-123',
    bookingRef: 'WKL-20261027-FA8B32',
    razorpayPaymentId: 'pay_test_99887766',
    paymentStatus: 'PAID',
    seatQuantity: 2,
    totalAmountInPaise: 399800,
    attendeeDetails: [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Smith', email: 'jane@example.com' }
    ],
    workshop: {
      title: 'Mastering Full-Stack React & Node.js Architecture',
      category: 'Web Development',
      deliveryMode: 'ONLINE',
      startDateTime: '2026-11-01T10:20:00.000Z',
      endDateTime: '2026-11-01T14:20:00.000Z',
      instructor: {
        name: 'Vikram Sengupta'
      },
      venue: {
        meetingLink: 'https://meet.google.com/xyz-workshops'
      }
    }
  };

  beforeEach(() => {
    document.body.style.overflow = '';
    document.body.className = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render anything when isOpen is false', () => {
    render(<TicketModal booking={mockBooking} isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText(/Official Workshoply Ticket/i)).not.toBeInTheDocument();
  });

  it('does not render anything when booking is null', () => {
    render(<TicketModal booking={null} isOpen={true} onClose={vi.fn()} />);
    expect(screen.queryByText(/Official Workshoply Ticket/i)).not.toBeInTheDocument();
  });

  it('renders ticket details through portal into document.body when isOpen is true', () => {
    render(<TicketModal booking={mockBooking} isOpen={true} onClose={vi.fn()} />);

    // Check modal heading and branding
    expect(screen.getByText('Official Workshoply Ticket')).toBeInTheDocument();
    expect(screen.getByText('Booking Confirmation & Admission Pass')).toBeInTheDocument();

    // Check workshop information
    expect(screen.getByText('Web Development')).toBeInTheDocument();
    expect(screen.getByText('Mastering Full-Stack React & Node.js Architecture')).toBeInTheDocument();
    expect(screen.getByText(/Vikram Sengupta/)).toBeInTheDocument();
    expect(screen.getByText('Online Masterclass')).toBeInTheDocument();
    expect(screen.getByText(/Link: https:\/\/meet.google.com\/xyz-workshops/)).toBeInTheDocument();

    // Check attendees
    expect(screen.getByText(/Registered Attendees \(2 seats\)/i)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Seat #1')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Seat #2')).toBeInTheDocument();

    // Check booking reference and payment ID
    expect(screen.getByText('WKL-20261027-FA8B32')).toBeInTheDocument();
    expect(screen.getByText(/Razorpay ID: pay_test_99887766/)).toBeInTheDocument();
    expect(screen.getByText('Scan at check-in')).toBeInTheDocument();

    // Check portal placement directly on document.body
    const portal = document.getElementById('ticket-modal-portal');
    expect(portal).toBeInTheDocument();
    expect(portal.parentElement).toBe(document.body);
  });

  it('locks body scroll and adds class when open, then restores when unmounted', () => {
    const { unmount } = render(
      <TicketModal booking={mockBooking} isOpen={true} onClose={vi.fn()} />
    );

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.classList.contains('ticket-modal-open')).toBe(true);

    unmount();

    expect(document.body.style.overflow).toBe('');
    expect(document.body.classList.contains('ticket-modal-open')).toBe(false);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<TicketModal booking={mockBooking} isOpen={true} onClose={onClose} />);

    const closeBtn = screen.getByLabelText('Close Ticket Modal');
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<TicketModal booking={mockBooking} isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking on the backdrop overlay', () => {
    const onClose = vi.fn();
    render(<TicketModal booking={mockBooking} isOpen={true} onClose={onClose} />);

    const portalBackdrop = document.getElementById('ticket-modal-portal');
    fireEvent.click(portalBackdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the ticket modal card', () => {
    const onClose = vi.fn();
    render(<TicketModal booking={mockBooking} isOpen={true} onClose={onClose} />);

    const title = screen.getByText('Mastering Full-Stack React & Node.js Architecture');
    fireEvent.click(title);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('triggers window.print when Print Ticket button is clicked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<TicketModal booking={mockBooking} isOpen={true} onClose={vi.fn()} />);

    const printBtn = screen.getByLabelText('Print Ticket');
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('renders in-person venue address when deliveryMode is IN_PERSON', () => {
    const inPersonBooking = {
      ...mockBooking,
      workshop: {
        ...mockBooking.workshop,
        deliveryMode: 'IN_PERSON',
        venue: {
          address: '742 Evergreen Terrace, Springfield',
          city: 'Springfield'
        }
      }
    };

    render(<TicketModal booking={inPersonBooking} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('742 Evergreen Terrace, Springfield')).toBeInTheDocument();
  });
});
