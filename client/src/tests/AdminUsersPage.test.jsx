import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { adminApi } from '../api/admin.api';
import { AuthContext } from '../context/AuthContext';

// Mock adminApi
vi.mock('../api/admin.api', () => ({
  adminApi: {
    getUsers: vi.fn(),
    deleteUser: vi.fn()
  }
}));

const mockCurrentUser = {
  _id: 'admin-1',
  name: 'Super Admin',
  email: 'admin@workshoply.dev',
  role: 'ADMIN'
};

const mockUsersData = [
  {
    _id: 'admin-1',
    name: 'Super Admin',
    email: 'admin@workshoply.dev',
    role: 'ADMIN',
    phone: '+91 99999 00000',
    createdAt: '2026-10-01T10:00:00.000Z'
  },
  {
    _id: 'user-2',
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: 'USER',
    phone: '+91 88888 11111',
    createdAt: '2026-10-15T12:00:00.000Z'
  },
  {
    _id: 'user-3',
    name: 'John Smith',
    email: 'john@example.com',
    role: 'USER',
    phone: '',
    createdAt: '2026-10-20T14:00:00.000Z'
  }
];

const renderWithAuth = (ui, user = mockCurrentUser) => {
  return render(
    <AuthContext.Provider value={{ user, isAuthenticated: true, isAdmin: true }}>
      {ui}
    </AuthContext.Provider>
  );
};

describe('AdminUsersPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.getUsers.mockResolvedValue({
      data: mockUsersData
    });
  });

  it('renders summary statistics cards with user counts', async () => {
    renderWithAuth(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Accounts')).toBeInTheDocument();
    });

    expect(screen.getByText('Students / Learners')).toBeInTheDocument();
    expect(screen.getByText('Administrators')).toBeInTheDocument();
  });

  it('renders user table with names, emails, roles, and actions', async () => {
    renderWithAuth(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Super Admin')).toBeInTheDocument();
    });

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('prevents current administrator from deleting their own account', async () => {
    renderWithAuth(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('You (Current Session)')).toBeInTheDocument();
    });

    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.queryByLabelText('Delete user Super Admin')).not.toBeInTheDocument();
  });

  it('shows delete button for other users', async () => {
    renderWithAuth(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Delete user Jane Doe')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Delete user John Smith')).toBeInTheDocument();
  });

  it('opens confirmation modal and deletes user when confirmed', async () => {
    adminApi.deleteUser.mockResolvedValue({ success: true });
    renderWithAuth(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Delete user Jane Doe')).toBeInTheDocument();
    });

    // Click delete on Jane Doe
    const deleteBtn = screen.getByLabelText('Delete user Jane Doe');
    fireEvent.click(deleteBtn);

    // Confirmation dialog should be visible
    expect(screen.getByText('Delete User Account?')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to permanently delete user "Jane Doe"/)
    ).toBeInTheDocument();

    // Confirm deletion
    const confirmBtn = screen.getByText('Delete User');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminApi.deleteUser).toHaveBeenCalledWith('user-2');
    });

    // Jane Doe should be removed from view
    await waitFor(() => {
      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    });
  });

  it('cancels deletion when Cancel button is clicked in confirmation dialog', async () => {
    renderWithAuth(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Delete user John Smith')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Delete user John Smith'));

    expect(screen.getByText('Delete User Account?')).toBeInTheDocument();

    // Click cancel
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText('Delete User Account?')).not.toBeInTheDocument();
    });

    expect(adminApi.deleteUser).not.toHaveBeenCalled();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('filters users by search query', async () => {
    renderWithAuth(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search users by name, email, or phone/i);
    fireEvent.change(searchInput, { target: { value: 'john' } });

    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });
});
