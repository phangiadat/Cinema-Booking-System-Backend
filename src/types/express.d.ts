import { AccessTokenPayload } from '../utils/jwt';

// Extend Express Request to include user info from JWT
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export {};
