import { verifyAccessToken } from '../utils/jwt.utils.js';
import { sendError } from '../utils/response.utils.js';
import { User } from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 401, 'Authentication required. Please log in.');
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return sendError(res, 401, 'Session expired or invalid token. Please log in again.');
    }

    const user = await User.findById(decoded.id).select('+role');
    if (!user) {
      return sendError(res, 401, 'User account no longer exists.');
    }

    req.user = {
      id: user._id.toString(),
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    };

    next();
  } catch (error) {
    return sendError(res, 401, 'Authentication failed', error.message);
  }
};
