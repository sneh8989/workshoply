import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { Navbar } from '../components/common/Navbar';
import { EmptyState } from '../components/common/EmptyState';

describe('Navigation & Layout Tests', () => {
  it('Navbar renders branding and navigation links', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getAllByText(/Workshop/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Browse Workshops')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('EmptyState renders custom message and action button', () => {
    const handleAction = () => {};
    render(
      <EmptyState
        title="Custom Empty State"
        description="Nothing here right now."
        actionText="Try Again"
        onAction={handleAction}
      />
    );

    expect(screen.getByText('Custom Empty State')).toBeInTheDocument();
    expect(screen.getByText('Nothing here right now.')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });
});
