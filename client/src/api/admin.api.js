import api from './axios';

export const adminApi = {
  getAnalytics: async () => {
    const res = await api.get('/admin/analytics/overview');
    return res.data;
  },
  getWorkshops: async (params) => {
    const res = await api.get('/admin/workshops', { params });
    return res.data;
  },
  createWorkshop: async (workshopData) => {
    const res = await api.post('/admin/workshops', workshopData);
    return res.data;
  },
  updateWorkshop: async (id, workshopData) => {
    const res = await api.patch(`/admin/workshops/${id}`, workshopData);
    return res.data;
  },
  togglePublish: async (id) => {
    const res = await api.patch(`/admin/workshops/${id}/toggle-publish`);
    return res.data;
  },
  cancelWorkshop: async (id) => {
    const res = await api.delete(`/admin/workshops/${id}`);
    return res.data;
  },
  getBookings: async (params) => {
    const res = await api.get('/admin/bookings', { params });
    return res.data;
  },
  exportBookingsCsv: async () => {
    const res = await api.get('/admin/bookings/export-csv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `workshoply-bookings-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  getUsers: async () => {
    const res = await api.get('/admin/users');
    return res.data;
  },
  deleteUser: async (id) => {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },
  updateBookingStatus: async (bookingId, data) => {
    const res = await api.patch(`/admin/bookings/${bookingId}/status`, data);
    return res.data;
  }
};
