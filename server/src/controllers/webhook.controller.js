import * as webhookService from '../services/webhook.service.js';
import { sendSuccess, sendError } from '../utils/response.utils.js';

export const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return sendError(res, 400, 'Missing x-razorpay-signature header');
    }

    const rawBody = req.rawBody ? req.rawBody.toString('utf-8') : JSON.stringify(req.body);
    const eventPayload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const result = await webhookService.handleRazorpayWebhook({
      rawBody,
      signature,
      eventPayload
    });

    return sendSuccess(res, 200, 'Webhook processed', result);
  } catch (error) {
    next(error);
  }
};
