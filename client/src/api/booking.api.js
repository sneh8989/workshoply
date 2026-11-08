import api from './axios';

export const bookingApi = {
  createBooking: async (bookingData) => {
    const res = await api.post('/bookings', bookingData);
    return res.data;
  },
  getMyBookings: async (params) => {
    const res = await api.get('/bookings/my', { params });
    return res.data;
  },
  getBookingDetails: async (bookingRef) => {
    const res = await api.get(`/bookings/${bookingRef}`);
    return res.data;
  },
  cancelBooking: async (bookingRef, reason) => {
    const res = await api.post(`/bookings/${bookingRef}/cancel`, { reason });
    return res.data;
  },
  verifyPayment: async (paymentData) => {
    const res = await api.post('/payments/verify', paymentData);
    return res.data;
  },
  getPaymentConfig: async () => {
    const res = await api.get('/payments/config');
    return res.data;
  }
};
