import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Shield, CreditCard, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-primary text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Workshop<span className="text-secondary">ly</span>
              </span>
            </Link>
            <p className="text-sm text-stone-400 leading-relaxed">
              The premier marketplace to discover, book, and elevate your craft with industry-leading instructors and hands-on cohorts.
            </p>
            <div className="flex items-center gap-2 text-xs text-stone-400 pt-2">
              <Shield className="w-4 h-4 text-accent" />
              <span>Verified Instructors & Secure Payments</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/workshops" className="hover:text-secondary transition">
                  All Workshops
                </Link>
              </li>
              <li>
                <Link to="/workshops?category=Web+Development" className="hover:text-secondary transition">
                  Web & Software Engineering
                </Link>
              </li>
              <li>
                <Link to="/workshops?category=Artificial+Intelligence" className="hover:text-secondary transition">
                  Generative AI & LLMs
                </Link>
              </li>
              <li>
                <Link to="/workshops?category=UI%2FUX+Design" className="hover:text-secondary transition">
                  UI/UX & Product Design
                </Link>
              </li>
              <li>
                <Link to="/workshops?deliveryMode=ONLINE" className="hover:text-secondary transition">
                  Online Masterclasses
                </Link>
              </li>
            </ul>
          </div>

          {/* For Learners */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Community & Account
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/dashboard" className="hover:text-secondary transition">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-secondary transition">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-secondary transition">
                  Create Student Account
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-secondary transition">
                  Booking Policies & FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Payment info & Trust */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
              Payment Gateway
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Integrated with Razorpay Standard Checkout supporting UPI, Credit/Debit cards, Netbanking, and Wallets.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-stone-300">
              <CreditCard className="w-4 h-4 text-secondary" />
              <span>Razorpay Test Mode Active</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
          <p>© {new Date().getFullYear()} Workshoply. Crafted for world-class technical education.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-stone-300 transition cursor-pointer">Privacy Policy</span>
            <span className="hover:text-stone-300 transition cursor-pointer">Terms of Service</span>
            <span className="hover:text-stone-300 transition cursor-pointer">Cancellation Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
