import { sendError } from '../utils/response.utils.js';

export const validateBody = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formattedErrors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return sendError(res, 400, 'Validation failed', formattedErrors);
    }
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const formattedErrors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return sendError(res, 400, 'Invalid query parameters', formattedErrors);
    }
    req.query = result.data;
    next();
  };
};
