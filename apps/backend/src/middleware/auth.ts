import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError } from '../errors';

export function authMiddleware(secret: string): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(header.slice(7), secret) as jwt.JwtPayload;
        req.user = { id: Number(payload.sub), role: payload.role === 'admin' ? 'admin' : 'customer' };
      } catch {
        // invalid token: treated as anonymous
      }
    }
    next();
  };
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, 'Authentication required'));
  next();
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, 'Authentication required'));
  if (req.user.role !== 'admin') return next(new HttpError(403, 'Admin access required'));
  next();
};

export function signToken(secret: string, user: { id: number; role: string }): string {
  return jwt.sign({ role: user.role }, secret, { subject: String(user.id), expiresIn: '8h' });
}
