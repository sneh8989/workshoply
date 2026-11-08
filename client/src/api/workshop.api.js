import api from './axios';

export const workshopApi = {
  getWorkshops: async (params) => {
    const res = await api.get('/workshops', { params });
    return res.data;
  },
  getFeaturedWorkshops: async () => {
    const res = await api.get('/workshops/featured');
    return res.data;
  },
  getWorkshop: async (slugOrId) => {
    const res = await api.get(`/workshops/${slugOrId}`);
    return res.data;
  },
  getAvailability: async (slugOrId) => {
    const res = await api.get(`/workshops/${slugOrId}/availability`);
    return res.data;
  },
  getReviews: async (slugOrId) => {
    const res = await api.get(`/workshops/${slugOrId}/reviews`);
    return res.data;
  },
  addReview: async (slugOrId, reviewData) => {
    const res = await api.post(`/workshops/${slugOrId}/reviews`, reviewData);
    return res.data;
  }
};
