import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api';
import { formatPrice, formatDate } from '../../utils/formatters';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { Pagination } from '../../components/common/Pagination';
import {
  Plus,
  Edit,
  Eye,
  EyeOff,
  Trash2,
  Calendar,
  X,
  AlertCircle,
  Search
} from 'lucide-react';

const CATEGORIES = [
  'Web Development',
  'Artificial Intelligence',
  'UI/UX Design',
  'Data Science',
  'Digital Marketing',
  'Entrepreneurship',
  'Photography',
  'Personal Development'
];

export const AdminWorkshopsPage = () => {
  const [workshops, setWorkshops] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal create/edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    category: 'Web Development',
    shortDescription: '',
    description: '',
    coverImage: '',
    instructorName: '',
    instructorTitle: '',
    instructorBio: '',
    priceRupees: 999,
    capacity: 30,
    skillLevel: 'ALL_LEVELS',
    deliveryMode: 'ONLINE',
    venueAddress: '',
    venueCity: '',
    meetingLink: '',
    startDateTime: '',
    endDateTime: '',
    registrationDeadline: '',
    cancellationPolicy: 'Full refund if cancelled up to 48 hours prior to start time.'
  });

  // Action dialog state
  const [actionTarget, setActionTarget] = useState(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchWorkshops = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await adminApi.getWorkshops({ search, page, limit: 10 });
      setWorkshops(res.data || []);
      setPagination(res.meta || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load workshops:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops(1);
  }, [search]);

  const getDefaultDates = () => {
    const now = new Date();
    const start = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start.getTime() + 8 * 60 * 60 * 1000);
    const deadline = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    const toLocalISO = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    return {
      startDateTime: toLocalISO(start),
      endDateTime: toLocalISO(end),
      registrationDeadline: toLocalISO(deadline)
    };
  };

  const handleFillSample = () => {
    const defaultDates = getDefaultDates();
    setFormData({
      title: 'Advanced Microservices with Go & Kafka',
      category: 'Web Development',
      shortDescription: 'Build high-throughput distributed microservices with Go and Kafka.',
      description: 'Master distributed systems architecture, event-driven design patterns, consumer groups, and resilience engineering.',
      coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      instructorName: 'Dr. Rajesh Nair',
      instructorTitle: 'Principal Systems Architect',
      instructorBio: 'Over 15 years designing distributed architectures for hyperscale cloud platforms.',
      priceRupees: 2499,
      capacity: 25,
      skillLevel: 'ADVANCED',
      deliveryMode: 'ONLINE',
      venueAddress: '',
      venueCity: '',
      meetingLink: 'https://meet.google.com/xyz-kafka-go',
      startDateTime: defaultDates.startDateTime,
      endDateTime: defaultDates.endDateTime,
      registrationDeadline: defaultDates.registrationDeadline,
      cancellationPolicy: 'Full refund if cancelled up to 48 hours prior to start time.'
    });
  };

  const resetForm = () => {
    const defaultDates = getDefaultDates();
    setFormData({
      title: '',
      category: 'Web Development',
      shortDescription: '',
      description: '',
      coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      instructorName: '',
      instructorTitle: '',
      instructorBio: '',
      priceRupees: 999,
      capacity: 30,
      skillLevel: 'ALL_LEVELS',
      deliveryMode: 'ONLINE',
      venueAddress: '',
      venueCity: '',
      meetingLink: 'https://meet.google.com/demo-workshoply',
      startDateTime: defaultDates.startDateTime,
      endDateTime: defaultDates.endDateTime,
      registrationDeadline: defaultDates.registrationDeadline,
      cancellationPolicy: 'Full refund if cancelled up to 48 hours prior to start time.'
    });
    setEditingWorkshop(null);
    setFormError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w) => {
    setEditingWorkshop(w);
    setFormData({
      title: w.title,
      category: w.category,
      shortDescription: w.shortDescription,
      description: w.description,
      coverImage: w.coverImage,
      instructorName: w.instructor?.name || '',
      instructorTitle: w.instructor?.title || '',
      instructorBio: w.instructor?.bio || '',
      priceRupees: w.priceInPaise / 100,
      capacity: w.capacity,
      skillLevel: w.skillLevel,
      deliveryMode: w.deliveryMode,
      venueAddress: w.venue?.address || '',
      venueCity: w.venue?.city || '',
      meetingLink: w.venue?.meetingLink || '',
      startDateTime: w.startDateTime ? new Date(w.startDateTime).toISOString().slice(0, 16) : '',
      endDateTime: w.endDateTime ? new Date(w.endDateTime).toISOString().slice(0, 16) : '',
      registrationDeadline: w.registrationDeadline ? new Date(w.registrationDeadline).toISOString().slice(0, 16) : '',
      cancellationPolicy: w.cancellationPolicy || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    if (new Date(formData.endDateTime) <= new Date(formData.startDateTime)) {
      setFormError('End date/time must be strictly after start date/time.');
      return;
    }
    if (new Date(formData.registrationDeadline) > new Date(formData.startDateTime)) {
      setFormError('Registration deadline cannot be after start date/time.');
      return;
    }

    setIsSubmittingForm(true);
    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        shortDescription: formData.shortDescription,
        description: formData.description,
        coverImage: formData.coverImage,
        instructor: {
          name: formData.instructorName,
          title: formData.instructorTitle,
          bio: formData.instructorBio,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
        },
        priceInPaise: Math.round(Number(formData.priceRupees) * 100),
        capacity: Number(formData.capacity),
        skillLevel: formData.skillLevel,
        deliveryMode: formData.deliveryMode,
        venue: {
          type: formData.deliveryMode === 'ONLINE' ? 'ONLINE' : 'PHYSICAL',
          address: formData.venueAddress,
          city: formData.venueCity,
          meetingLink: formData.meetingLink
        },
        startDateTime: new Date(formData.startDateTime),
        endDateTime: new Date(formData.endDateTime),
        registrationDeadline: new Date(formData.registrationDeadline),
        cancellationPolicy: formData.cancellationPolicy
      };

      if (editingWorkshop) {
        await adminApi.updateWorkshop(editingWorkshop._id, payload);
      } else {
        await adminApi.createWorkshop(payload);
      }

      setIsModalOpen(false);
      await fetchWorkshops(pagination.page);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save workshop.');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      await adminApi.togglePublish(id);
      await fetchWorkshops(pagination.page);
    } catch (err) {
      alert('Failed to update workshop status.');
    }
  };

  const handleConfirmCancel = async () => {
    if (!actionTarget) return;
    setIsProcessingAction(true);
    try {
      await adminApi.cancelWorkshop(actionTarget._id);
      await fetchWorkshops(pagination.page);
      setActionTarget(null);
    } catch (err) {
      alert('Failed to cancel workshop.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary tracking-tight">
            Workshop Management
          </h1>
          <p className="text-xs text-muted">
            Create, update, publish cohorts, and monitor capacity.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-primary text-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Workshop</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-muted absolute left-3 top-3 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by title..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-surface border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Workshops Data Table */}
      <div className="card-surface overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 border-b border-border text-muted uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Title & Category</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Schedule</th>
                <th className="py-3 px-4">Tuition</th>
                <th className="py-3 px-4">Booked / Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-muted">
                    Loading workshops...
                  </td>
                </tr>
              ) : workshops.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-muted">
                    No workshops found matching search criteria.
                  </td>
                </tr>
              ) : (
                workshops.map((w) => (
                  <tr key={w._id} className="hover:bg-stone-50">
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-bold text-main truncate">{w.title}</p>
                      <span className="text-[10px] uppercase font-bold text-secondary">
                        {w.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted font-medium">
                      {w.instructor?.name}
                    </td>
                    <td className="py-3 px-4 text-muted">
                      {formatDate(w.startDateTime)}
                    </td>
                    <td className="py-3 px-4 font-bold text-primary">
                      {formatPrice(w.priceInPaise)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-main">{w.bookedSeats}</span>
                      <span className="text-muted"> / {w.capacity}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          w.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : w.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTogglePublish(w._id)}
                          title={w.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                          className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-stone-100"
                        >
                          {w.status === 'PUBLISHED' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(w)}
                          title="Edit Workshop"
                          className="p-1.5 rounded-lg text-muted hover:text-secondary hover:bg-stone-100"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {w.status !== 'CANCELLED' && (
                          <button
                            onClick={() => setActionTarget(w)}
                            title="Cancel Workshop"
                            className="p-1.5 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={(page) => fetchWorkshops(page)}
        />
      </div>

      {/* Modal: Create / Edit Workshop */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/50 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-2xl w-full p-6 shadow-modal border border-border my-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-main">
                  {editingWorkshop ? 'Edit Workshop' : 'Create New Masterclass'}
                </h3>
                {!editingWorkshop && (
                  <button
                    type="button"
                    onClick={handleFillSample}
                    className="text-[11px] font-semibold text-secondary bg-orange-50 hover:bg-orange-100 border border-secondary/20 px-2 py-0.5 rounded-lg transition"
                  >
                    Quick Fill Sample Cohort
                  </button>
                )}
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-muted hover:text-main">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-main mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full text-xs p-2.5 bg-background border border-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-main mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs p-2.5 bg-background border border-border rounded-lg"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-main mb-1">Skill Level *</label>
                  <select
                    value={formData.skillLevel}
                    onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value })}
                    className="w-full text-xs p-2.5 bg-background border border-border rounded-lg"
                  >
                    <option value="ALL_LEVELS">All Levels</option>
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-main mb-1">Tuition Fee (₹ INR) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.priceRupees}
                    onChange={(e) => setFormData({ ...formData, priceRupees: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-background border border-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-main mb-1">Capacity (Seats) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-background border border-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-main mb-1">Delivery Format *</label>
                  <select
                    value={formData.deliveryMode}
                    onChange={(e) => setFormData({ ...formData, deliveryMode: e.target.value })}
                    className="w-full text-xs p-2.5 bg-background border border-border rounded-lg"
                  >
                    <option value="ONLINE">Online Masterclass</option>
                    <option value="IN_PERSON">In-Person Workshop</option>
                    <option value="HYBRID">Hybrid Cohort</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-main mb-1">City / Venue Address</label>
                  <input
                    type="text"
                    value={formData.venueCity}
                    onChange={(e) => setFormData({ ...formData, venueCity: e.target.value })}
                    placeholder="e.g. Bengaluru / WeWork Galaxy"
                    className="w-full text-xs p-2.5 bg-background border border-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-main mb-1">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDateTime}
                    onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                    className="w-full text-xs p-2.5 bg-background border border-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-main mb-1">End Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endDateTime}
                    onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
                    className="w-full text-xs p-2.5 bg-background border border-border rounded-lg"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-main mb-1">Registration Deadline *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    className="w-full text-xs p-2.5 bg-background border border-border rounded-lg"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-main mb-1">Short Description (Max 300 chars) *</label>
                  <textarea
                    required
                    rows="2"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    className="w-full text-xs p-2.5 bg-background border border-border rounded-lg"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-main mb-1">Full Curriculum Description *</label>
                  <textarea
                    required
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full text-xs p-2.5 bg-background border border-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-main mb-1">Instructor Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.instructorName}
                    onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                    className="w-full text-xs p-2.5 bg-background border border-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-main mb-1">Instructor Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.instructorTitle}
                    onChange={(e) => setFormData({ ...formData, instructorTitle: e.target.value })}
                    className="w-full text-xs p-2.5 bg-background border border-border rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-outline text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="btn-primary text-xs"
                >
                  {isSubmittingForm ? 'Saving...' : editingWorkshop ? 'Update Workshop' : 'Publish Workshop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Cancellation */}
      <ConfirmationDialog
        isOpen={Boolean(actionTarget)}
        title="Cancel Workshop?"
        message={`Are you sure you want to cancel "${actionTarget?.title}"? The status will be set to CANCELLED and new registrations will be blocked.`}
        confirmText="Yes, Cancel Workshop"
        isDanger={true}
        isLoading={isProcessingAction}
        onConfirm={handleConfirmCancel}
        onCancel={() => setActionTarget(null)}
      />
    </div>
  );
};
