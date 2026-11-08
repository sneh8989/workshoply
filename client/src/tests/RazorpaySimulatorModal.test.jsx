import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RazorpaySimulatorModal } from '../components/booking/RazorpaySimulatorModal';

describe('RazorpaySimulatorModal Component', () => {
  const mockOrderData = {
    id: 'order_test_123456789',
    amount: 199900,
    currency: 'INR'
  };

  beforeEach(() => {
    document.body.style.overflow = '';
    // Ensure #root exists if not already present
    let root = document.getElementById('root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'root';
      document.body.appendChild(root);
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    const root = document.getElementById('root');
    if (root) {
      root.removeAttribute('aria-hidden');
    }
  });

  it('does not render when isOpen is false', () => {
    render(
      <RazorpaySimulatorModal
        isOpen={false}
        orderData={mockOrderData}
        totalAmountInPaise={199900}
        onSuccess={vi.fn()}
        onFailure={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not render when orderData is null', () => {
    render(
      <RazorpaySimulatorModal
        isOpen={true}
        orderData={null}
        totalAmountInPaise={199900}
        onSuccess={vi.fn()}
        onFailure={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders through portal into document.body with proper ARIA attributes when isOpen is true', () => {
    render(
      <RazorpaySimulatorModal
        isOpen={true}
        orderData={mockOrderData}
        totalAmountInPaise={199900}
        onSuccess={vi.fn()}
        onFailure={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'payment-modal-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'payment-modal-desc');

    // Confirm rendered in document.body
    const portal = document.getElementById('payment-modal-portal');
    expect(portal).toBeInTheDocument();
    expect(portal.parentElement).toBe(document.body);
  });

  it('locks body scrolling and sets aria-hidden on #root when open, restoring on unmount', () => {
    const { unmount } = render(
      <RazorpaySimulatorModal
        isOpen={true}
        orderData={mockOrderData}
        totalAmountInPaise={199900}
        onSuccess={vi.fn()}
        onFailure={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.getElementById('root')).toHaveAttribute('aria-hidden', 'true');

    unmount();

    expect(document.body.style.overflow).toBe('');
    expect(document.getElementById('root')).not.toHaveAttribute('aria-hidden');
  });

  it('displays accurate and consistent sandbox test messaging', () => {
    render(
      <RazorpaySimulatorModal
        isOpen={true}
        orderData={mockOrderData}
        totalAmountInPaise={199900}
        onSuccess={vi.fn()}
        onFailure={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Razorpay')).toBeInTheDocument();
    expect(screen.getByText('TEST MODE')).toBeInTheDocument();
    expect(screen.getByText('Workshoply Sandbox Payment Gateway')).toBeInTheDocument();
    expect(screen.getByText(/256-bit SSL Simulation • Razorpay Sandbox Test Environment/i)).toBeInTheDocument();
    expect(screen.getByText(/Authorize Test Payment/i)).toBeInTheDocument();
  });

  it('allows switching payment methods and updates details dynamically', () => {
    render(
      <RazorpaySimulatorModal
        isOpen={true}
        orderData={mockOrderData}
        totalAmountInPaise={199900}
        onSuccess={vi.fn()}
        onFailure={vi.fn()}
        onClose={vi.fn()}
      />
    );

    // Initial is UPI
    expect(screen.getByText(/Instant UPI Simulation/i)).toBeInTheDocument();

    // Switch to Card
    const cardButton = screen.getByRole('radio', { name: /Cards/i });
    fireEvent.click(cardButton);
    expect(screen.getByText(/Test Card Simulation/i)).toBeInTheDocument();

    // Switch to Netbanking
    const netbankingButton = screen.getByRole('radio', { name: /Netbanking/i });
    fireEvent.click(netbankingButton);
    expect(screen.getByText(/Netbanking Simulation/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onCloseMock = vi.fn();
    render(
      <RazorpaySimulatorModal
        isOpen={true}
        orderData={mockOrderData}
        totalAmountInPaise={199900}
        onSuccess={vi.fn()}
        onFailure={vi.fn()}
        onClose={onCloseMock}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Close payment modal/i });
    fireEvent.click(closeBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('safely handles Escape key to close modal', () => {
    const onCloseMock = vi.fn();
    render(
      <RazorpaySimulatorModal
        isOpen={true}
        orderData={mockOrderData}
        totalAmountInPaise={199900}
        onSuccess={vi.fn()}
        onFailure={vi.fn()}
        onClose={onCloseMock}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('does NOT close on Escape or close button while payment is processing', () => {
    vi.useFakeTimers();
    const onCloseMock = vi.fn();
    render(
      <RazorpaySimulatorModal
        isOpen={true}
        orderData={mockOrderData}
        totalAmountInPaise={199900}
        onSuccess={vi.fn()}
        onFailure={vi.fn()}
        onClose={onCloseMock}
      />
    );

    const payButton = screen.getByRole('button', { name: /Authorize Test Payment/i });
    act(() => {
      fireEvent.click(payButton);
    });

    // Now it should be processing
    expect(screen.getByText(/Processing Test Payment/i)).toBeInTheDocument();

    // Attempt close via Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCloseMock).not.toHaveBeenCalled();

    // Close button should be disabled
    const closeBtn = screen.getByRole('button', { name: /Close payment modal/i });
    expect(closeBtn).toBeDisabled();

    // Advance timer to finish processing
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    vi.useRealTimers();
  });

  it('triggers onSuccess with simulated payment details after simulated authorization', () => {
    vi.useFakeTimers();
    const onSuccessMock = vi.fn();
    render(
      <RazorpaySimulatorModal
        isOpen={true}
        orderData={mockOrderData}
        totalAmountInPaise={199900}
        onSuccess={onSuccessMock}
        onFailure={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const payButton = screen.getByRole('button', { name: /Authorize Test Payment/i });
    act(() => {
      fireEvent.click(payButton);
    });

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(onSuccessMock).toHaveBeenCalledTimes(1);
    expect(onSuccessMock).toHaveBeenCalledWith(
      expect.objectContaining({
        razorpay_order_id: mockOrderData.id,
        razorpay_signature: 'simulated_dev_signature',
        razorpay_payment_id: expect.stringMatching(/^pay_sim_/)
      })
    );

    vi.useRealTimers();
  });

  it('triggers onFailure when Simulate Payment Failure is clicked', () => {
    vi.useFakeTimers();
    const onFailureMock = vi.fn();
    render(
      <RazorpaySimulatorModal
        isOpen={true}
        orderData={mockOrderData}
        totalAmountInPaise={199900}
        onSuccess={vi.fn()}
        onFailure={onFailureMock}
        onClose={vi.fn()}
      />
    );

    const failButton = screen.getByRole('button', { name: /Simulate Payment Failure/i });
    act(() => {
      fireEvent.click(failButton);
    });

    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(onFailureMock).toHaveBeenCalledTimes(1);
    expect(onFailureMock).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'PAYMENT_FAILED',
        description: expect.stringContaining('Payment was declined')
      })
    );

    vi.useRealTimers();
  });
});
