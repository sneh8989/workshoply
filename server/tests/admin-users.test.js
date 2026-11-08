import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { env } from '../src/config/env.js';
import { generateAccessToken } from '../src/utils/jwt.utils.js';

describe('Admin User Management & Deletion API', () => {
  let adminUser;
  let adminToken;
  let regularUser;
  let regularToken;
  let targetUserToDelete;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    // 1. Create or ensure an admin user
    adminUser = await User.create({
      name: 'Admin Test Manager',
      email: `admin-mgr-${Date.now()}@test.com`,
      passwordHash: 'dummyhash123',
      role: 'ADMIN'
    });
    adminToken = generateAccessToken(adminUser);

    // 2. Create a regular customer user
    regularUser = await User.create({
      name: 'Regular Customer',
      email: `customer-${Date.now()}@test.com`,
      passwordHash: 'dummyhash123',
      role: 'USER'
    });
    regularToken = generateAccessToken(regularUser);

    // 3. Create a target user specifically to be deleted
    targetUserToDelete = await User.create({
      name: 'User To Be Deleted',
      email: `delete-me-${Date.now()}@test.com`,
      passwordHash: 'dummyhash123',
      role: 'USER'
    });
  });

  afterAll(async () => {
    await User.deleteMany({
      _id: { $in: [adminUser._id, regularUser._id, targetUserToDelete._id] }
    });
    await mongoose.disconnect();
  });

  it('GET /api/v1/admin/users should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/admin/users');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/admin/users should reject regular USER role with 403', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${regularToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/admin/users should allow ADMIN to fetch user directory', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const emails = res.body.data.map((u) => u.email);
    expect(emails).toContain(adminUser.email);
    expect(emails).toContain(targetUserToDelete.email);
  });

  it('DELETE /api/v1/admin/users/:id should reject unauthenticated requests with 401', async () => {
    const res = await request(app).delete(`/api/v1/admin/users/${targetUserToDelete._id}`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('DELETE /api/v1/admin/users/:id should reject regular USER role with 403', async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/users/${targetUserToDelete._id}`)
      .set('Authorization', `Bearer ${regularToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('DELETE /api/v1/admin/users/:id should prevent admin from deleting their own account (400)', async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/users/${adminUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot delete their own account/i);

    // Verify admin user still exists in database
    const checkAdmin = await User.findById(adminUser._id);
    expect(checkAdmin).not.toBeNull();
  });

  it('DELETE /api/v1/admin/users/:id should return 404 when target user is not found', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/v1/admin/users/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/user not found/i);
  });

  it('DELETE /api/v1/admin/users/:id should allow ADMIN to delete a user successfully', async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/users/${targetUserToDelete._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deletedUserId).toBe(targetUserToDelete._id.toString());

    // Verify user is actually removed from database
    const deletedUser = await User.findById(targetUserToDelete._id);
    expect(deletedUser).toBeNull();
  });
});
