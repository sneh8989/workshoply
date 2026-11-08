import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
  Ticket
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await logout();
    setIsDropdownOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm group-hover:bg-primary-hover transition">
              <Sparkles className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex items-baseline">
              <span className="text-xl font-extrabold tracking-tight text-primary">
                Workshop<span className="text-secondary">ly</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link
              to="/workshops"
              className={`transition hover:text-secondary ${
                isActive('/workshops') ? 'text-secondary font-semibold' : 'text-main'
              }`}
            >
              Browse Workshops
            </Link>
            <a
              href="/#categories"
              className="text-main hover:text-secondary transition"
            >
              Categories
            </a>
            <a
              href="/#how-it-works"
              className="text-main hover:text-secondary transition"
            >
              How It Works
            </a>
          </nav>

          {/* Desktop User Section */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-stone-100 transition focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold ring-2 ring-secondary/40">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-semibold text-main max-w-[120px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                  {isAdmin && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-secondary tracking-wide">
                      ADMIN
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-surface rounded-xl shadow-modal border border-border py-2 text-sm z-50 animate-fade-in"
                    onMouseLeave={() => setIsDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-border">
                      <p className="font-semibold text-main truncate">{user?.name}</p>
                      <p className="text-xs text-muted truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-main hover:bg-stone-100 transition"
                    >
                      <Ticket className="w-4 h-4 text-muted" />
                      My Bookings & Profile
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-secondary font-medium hover:bg-orange-50 transition"
                      >
                        <ShieldCheck className="w-4 h-4 text-secondary" />
                        Admin Dashboard
                      </Link>
                    )}

                    <div className="border-t border-border my-1"></div>

                    <button
                      onClick={handleSignOut}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-main hover:text-secondary px-3 py-2 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-main hover:bg-stone-100"
              aria-label="Toggle Navigation Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="md:hidden bg-surface border-b border-border px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/workshops"
            onClick={() => setIsMenuOpen(false)}
            className="block px-3 py-2 rounded-lg font-medium text-main hover:bg-stone-100"
          >
            Browse Workshops
          </Link>
          <a
            href="/#categories"
            onClick={() => setIsMenuOpen(false)}
            className="block px-3 py-2 rounded-lg font-medium text-main hover:bg-stone-100"
          >
            Categories
          </a>
          <a
            href="/#how-it-works"
            onClick={() => setIsMenuOpen(false)}
            className="block px-3 py-2 rounded-lg font-medium text-main hover:bg-stone-100"
          >
            How It Works
          </a>

          <div className="pt-4 border-t border-border">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <p className="font-bold text-main">{user?.name}</p>
                  <p className="text-xs text-muted">{user?.email}</p>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-main hover:bg-stone-100 font-medium"
                >
                  <Ticket className="w-4 h-4 text-muted" />
                  My Bookings
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-secondary bg-orange-50 font-semibold"
                  >
                    <ShieldCheck className="w-4 h-4 text-secondary" />
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 font-medium hover:bg-rose-50 rounded-lg text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="btn-outline text-center text-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="btn-primary text-center text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
