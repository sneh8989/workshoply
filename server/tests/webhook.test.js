import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import crypto from 'crypto';
import app from '../src/app.js';
import { WebhookEvent } from '../src/models/WebhookEvent.js';
import { env } from '../src/config/env.js';

describe('Razorpay Webhooks & Idempotency', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await WebhookEvent.deleteMany({ eventId: /^test_evt_/ });
    await mongoose.disconnect();
  });

  it('POST /api/v1/webhooks/razorpay should reject requests with invalid signature', async () => {
    const payload = JSON.stringify({
      id: 'test_evt_invalid_sig',
      event: 'payment.captured',
      payload: {}
    });

    const res = await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', 'invalid_signature_hex')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/webhooks/razorpay should verify authentic signature and process event', async () => {
    const eventId = `test_evt_${Date.now()}`;
    const payloadObj = {
      id: eventId,
      event: 'payment.captured',
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        payment: {
          entity: {
            id: 'pay_test_webhook_' + Date.now(),
            order_id: 'order_test_webhook_' + Date.now(),
            amount: 199900,
            status: 'captured'
          }
        }
      }
    };

    const rawBody = JSON.stringify(payloadObj);
    const signature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    const res = await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify event is stored in WebhookEvent collection
    const storedEvent = await WebhookEvent.findOne({ eventId });
    expect(storedEvent).toBeDefined();
    expect(storedEvent.status).toBe('PROCESSED');
  });

  it('POST /api/v1/webhooks/razorpay should handle duplicate events idempotently without error', async () => {
    const eventId = `test_evt_duplicate_${Date.now()}`;
    const payloadObj = {
      id: eventId,
      event: 'payment.captured',
      created_at: Math.floor(Date.now() / 1000),
      payload: {}
    };

    const rawBody = JSON.stringify(payloadObj);
    const signature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    // First call
    await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signature)
      .send(rawBody);

    // Duplicate call with exact same event
    const dupRes = await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signature)
      .send(rawBody);

    expect(dupRes.status).toBe(200);
    expect(dupRes.body.data.status).toBe('ALREADY_PROCESSED');
  });
});
