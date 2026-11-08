import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin.api';
import { useAuth } from '../../context/AuthContext';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { formatDate } from '../../utils/formatters';
import {
  Users,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  Search,
  UserCheck,
  Shield,
  Loader2,
  Calendar
} from 'lucide-react';

export const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Delete User Dialog State
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getUsers();
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Failed to load user directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteUser(deleteTargetUser._id);
      toast.success(`User "${deleteTargetUser.name}" deleted successfully.`);
      setUsers((prev) => prev.filter((u) => u._id !== deleteTargetUser._id));
      setDeleteTargetUser(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered users by search query and role
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        (u.phone && u.phone.includes(search));

      const matchesRole = !roleFilter || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  // Genuine Summary Statistics
  const totalUsersCount = users.length;
  const regularUsersCount = users.filter((u) => u.role === 'USER').length;
  const adminUsersCount = users.filter((u) => u.role === 'ADMIN').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-primary tracking-tight">
          Registered User Directory
        </h1>
        <p className="text-xs text-muted">
          Manage registered customer accounts, view roles, and remove unauthorized or test users.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="card-surface p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider truncate">
              Total Accounts
            </p>
            <p className="text-xl font-extrabold text-primary">{totalUsersCount}</p>
          </div>
        </div>

        <div className="card-surface p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider truncate">
              Students / Learners
            </p>
            <p className="text-xl font-extrabold text-main">{regularUsersCount}</p>
          </div>
        </div>

        <div className="card-surface p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-secondary flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-secondary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider truncate">
              Administrators
            </p>
            <p className="text-xl font-extrabold text-main">{adminUsersCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-surface p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, or phone..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs p-2 bg-background border border-border rounded-lg focus:outline-none w-full sm:w-auto"
          >
            <option value="">All Roles ({totalUsersCount})</option>
            <option value="USER">Students / Users ({regularUsersCount})</option>
            <option value="ADMIN">Administrators ({adminUsersCount})</option>
          </select>
        </div>
      </div>

      {/* Users Table Container */}
      <div className="card-surface overflow-hidden shadow-card border border-border">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[760px] text-left text-xs divide-y divide-border">
            <thead className="bg-stone-100/90 border-b border-border text-muted uppercase font-bold tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="py-3 px-4 whitespace-nowrap min-w-[180px]">
                  User
                </th>
                <th scope="col" className="py-3 px-4 whitespace-nowrap min-w-[200px]">
                  Email
                </th>
                <th scope="col" className="py-3 px-4 whitespace-nowrap min-w-[130px]">
                  Phone
                </th>
                <th scope="col" className="py-3 px-4 whitespace-nowrap min-w-[110px]">
                  Role
                </th>
                <th scope="col" className="py-3 px-4 whitespace-nowrap min-w-[120px]">
                  Joined Date
                </th>
                <th
                  scope="col"
                  className="py-3 px-4 text-right whitespace-nowrap min-w-[90px] sticky right-0 bg-stone-100 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.08)] z-10"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-14 text-center text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-secondary" />
                      <span>Loading user directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-14 text-center text-muted">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Users className="w-8 h-8 text-stone-300" />
                      <p className="font-semibold text-main">No users found</p>
                      <p className="text-[11px] text-muted">
                        Try adjusting your search query or role filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrentSessionUser =
                    currentUser &&
                    (currentUser._id === u._id || currentUser.email === u.email);

                  return (
                    <tr key={u._id} className="group hover:bg-stone-50/90 transition-colors">
                      {/* Name with Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-main block truncate">{u.name}</span>
                            {isCurrentSessionUser && (
                              <span className="text-[10px] font-bold text-emerald-600 block">
                                You (Current Session)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-muted">
                        <span className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 flex-shrink-0 text-stone-400" />
                          <span className="truncate">{u.email}</span>
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 text-muted whitespace-nowrap">
                        {u.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 flex-shrink-0 text-stone-400" />
                            <span>{u.phone}</span>
                          </span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-primary text-secondary border border-secondary/30'
                              : 'bg-stone-100 text-stone-700 border border-stone-200'
                          }`}
                        >
                          {u.role === 'ADMIN' && <ShieldCheck className="w-3 h-3 text-secondary" />}
                          {u.role}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-muted whitespace-nowrap text-[11px]">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Actions: Delete Button */}
                      <td className="py-3 px-4 text-right whitespace-nowrap sticky right-0 bg-surface group-hover:bg-stone-50/90 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.08)] z-10 transition-colors">
                        <div className="flex items-center justify-end">
                          {isCurrentSessionUser ? (
                            <span
                              className="text-[11px] text-stone-400 font-medium px-2 py-1 bg-stone-100 rounded-lg cursor-not-allowed"
                              title="You cannot delete your own active administrator account"
                            >
                              Current
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteTargetUser(u)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer border border-transparent hover:border-rose-600 shadow-xs"
                              title={`Delete user account ${u.name}`}
                              aria-label={`Delete user ${u.name}`}
                            >
                              <Trash2 className="w-4 h-4 flex-shrink-0" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete User Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(deleteTargetUser)}
        title="Delete User Account?"
        message={`Are you sure you want to permanently delete user "${deleteTargetUser?.name}" (${deleteTargetUser?.email})? All user profile data will be permanently removed from Workshoply. This action cannot be undone.`}
        confirmText="Delete User"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteTargetUser(null)}
      />
    </div>
  );
};
