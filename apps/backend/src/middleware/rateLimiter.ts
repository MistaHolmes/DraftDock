import { RequestHandler } from 'express';

// Rate limiting disabled — all limiters are no-op pass-through middleware.
const noopLimiter: RequestHandler = (_req, _res, next) => next();

export const globalLimiter = noopLimiter;
export const writeLimiter  = noopLimiter;
export const authLimiter   = noopLimiter;
