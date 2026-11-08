import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  CreditCard,
  Smartphone,
  Building,
  ShieldCheck,
  X,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { formatPrice } from '../../utils/formatters';

export const RazorpaySimulatorModal = ({
  isOpen,
  orderData,
  totalAmountInPaise,
  onSuccess,
  onFailure,
  onClose
}) => {
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const modalRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  // Manage body scroll lock, focus restoration, focus trapping, and Escape key
  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element to restore focus when modal closes
    previousActiveElementRef.current = document.activeElement;

    // Disable background scrolling while modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Mark background root as aria-hidden for assistive technologies
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.setAttribute('aria-hidden', 'true');
    }

    // Place initial focus on the modal dialog or first interactive element
    const focusTimer = setTimeout(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 50);

    const handleKeyDown = (e) => {
      // Safe Escape key behavior: only close if not currently processing payment
      if (e.key === 'Escape') {
        if (!isProcessing) {
          e.preventDefault();
          onClose?.();
        }
        return;
      }

      // Accessible Focus Trap: cycle Tab / Shift+Tab within modal elements only
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      if (rootElement) {
        rootElement.removeAttribute('aria-hidden');
      }
      window.removeEventListener('keydown', handleKeyDown);

      // Return focus to previous trigger element
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, isProcessing, onClose]);

  const handleBackdropClick = (e) => {
    // Backdrop click safely dismissed only when clicking backdrop overlay and not processing
    if (e.target === e.currentTarget && !isProcessing) {
      onClose?.();
    }
  };

  const handleSimulateSuccess = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setTimeout(async () => {
      try {
        const paymentId = 'pay_sim_' + Math.random().toString(36).substring(2, 10);
        await onSuccess?.({
          razorpay_order_id: orderData.id,
          razorpay_payment_id: paymentId,
          razorpay_signature: 'simulated_dev_signature'
        });
      } finally {
        setIsProcessing(false);
      }
    }, 1000);
  };

  const handleSimulateFailure = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setTimeout(() => {
      try {
        onFailure?.({
          code: 'PAYMENT_FAILED',
          description: 'Payment was declined by issuing bank (Simulated failure)'
        });
      } finally {
        setIsProcessing(false);
      }
    }, 800);
  };

  if (!isOpen || !orderData) return null;

  const modalContent = (
    <div
      id="payment-modal-portal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden animate-fade-in"
      onClick={handleBackdropClick}
    >
      {/* Full-screen backdrop covering 100% viewport */}
      <div
        className="fixed inset-0 bg-primary/75 backdrop-blur-md transition-opacity"
        aria-hidden="true"
      />

      {/* Centered Modal Dialog Card */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
        aria-describedby="payment-modal-desc"
        tabIndex="-1"
        className="relative z-10 bg-surface rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden shadow-modal border border-border my-auto transition-all focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Razorpay Brand Header (Pinned top) */}
        <div className="flex-shrink-0 bg-[#0C2340] text-white p-5 flex items-center justify-between border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span id="payment-modal-title" className="font-extrabold tracking-tight text-lg text-white">
                Razorpay
              </span>
              <span className="text-secondary text-[10px] font-bold px-2 py-0.5 rounded bg-surface/10 border border-secondary/30 tracking-wider">
                TEST MODE
              </span>
            </div>
            <p id="payment-modal-desc" className="text-xs text-stone-300 mt-1">
              Workshoply Sandbox Payment Gateway
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-stone-400 block">Total Amount</span>
            <span className="text-xl font-extrabold text-white">
              {formatPrice(totalAmountInPaise)}
            </span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Choose Test Payment Method
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              aria-label="Close payment modal"
              className="text-muted hover:text-main p-1.5 rounded-lg hover:bg-stone-100 transition disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Payment Methods">
            {[
              { id: 'upi', label: 'UPI / QR', icon: Smartphone },
              { id: 'card', label: 'Cards', icon: CreditCard },
              { id: 'netbanking', label: 'Netbanking', icon: Building }
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = selectedMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isProcessing}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition disabled:opacity-50 cursor-pointer ${
                    isSelected
                      ? 'border-secondary bg-orange-50 text-secondary shadow-xs'
                      : 'border-border bg-surface text-muted hover:bg-stone-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Method Details Info */}
          <div className="p-3.5 bg-background rounded-xl border border-border text-xs text-muted space-y-1.5">
            <p className="font-semibold text-main">
              {selectedMethod === 'upi' && 'Instant UPI Simulation (Google Pay, PhonePe, Paytm, BHIM)'}
              {selectedMethod === 'card' && 'Test Card Simulation (Visa, Mastercard, RuPay)'}
              {selectedMethod === 'netbanking' && 'Netbanking Simulation (SBI, HDFC, ICICI, Axis & All Major Banks)'}
            </p>
            <p className="text-[11px] leading-relaxed">
              {selectedMethod === 'upi' &&
                'Simulates instant UPI authorization. Verifies cryptographic signature with the backend without real currency deductions.'}
              {selectedMethod === 'card' &&
                'Simulates standard 3D-Secure card verification flow using mock credentials in sandbox mode.'}
              {selectedMethod === 'netbanking' &&
                'Simulates direct bank portal redirect and authorization under Razorpay test environment rules.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleSimulateSuccess}
              disabled={isProcessing}
              className="w-full btn-secondary text-sm py-3.5 flex items-center justify-center gap-2 shadow-sm font-bold cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Test Payment...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Authorize Test Payment • {formatPrice(totalAmountInPaise)}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSimulateFailure}
              disabled={isProcessing}
              className="w-full text-xs font-semibold py-2.5 text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center justify-center gap-1.5 border border-transparent hover:border-rose-200 disabled:opacity-40 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulate Payment Failure / Bank Decline</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted pt-2 border-t border-border">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit SSL Simulation • Razorpay Sandbox Test Environment</span>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
