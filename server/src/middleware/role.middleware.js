import { sendError } from '../utils/response.utils.js';

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Forbidden. Access requires one of the following roles: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
};

export const requireAdmin = requireRole('ADMIN');
