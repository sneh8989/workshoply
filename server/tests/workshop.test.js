import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { Workshop } from '../src/models/Workshop.js';
import { env } from '../src/config/env.js';

describe('Workshop Catalog Endpoints', () => {
  let sampleWorkshopId;
  let sampleSlug;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    const workshop = await Workshop.findOne({ status: 'PUBLISHED' });
    if (workshop) {
      sampleWorkshopId = workshop._id.toString();
      sampleSlug = workshop.slug;
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('GET /api/v1/workshops should return a paginated list of published workshops', async () => {
    const res = await request(app).get('/api/v1/workshops');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  it('GET /api/v1/workshops with category filter should filter properly', async () => {
    const res = await request(app)
      .get('/api/v1/workshops')
      .query({ category: 'Web Development' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.forEach((w) => {
      expect(w.category).toBe('Web Development');
    });
  });

  it('GET /api/v1/workshops/:identifier should return single workshop details', async () => {
    const res = await request(app).get(`/api/v1/workshops/${sampleSlug}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(sampleWorkshopId);
    expect(res.body.data.title).toBeDefined();
    expect(res.body.data.priceInPaise).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/v1/workshops/:identifier/availability should return real-time seat numbers', async () => {
    const res = await request(app).get(`/api/v1/workshops/${sampleSlug}/availability`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.capacity).toBeDefined();
    expect(res.body.data.availableSeats).toBeDefined();
    expect(res.body.data.availabilityState).toBeDefined();
  });

  it('GET /api/v1/workshops/featured should return featured workshops', async () => {
    const res = await request(app).get('/api/v1/workshops/featured');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
