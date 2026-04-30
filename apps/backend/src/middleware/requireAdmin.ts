import { Request, Response, NextFunction } from 'express';
import { syncUser } from '../sync';

/**
 * Middleware that ensures the authenticated user has an ADMIN role.
 * Must be used AFTER Clerk's requireAuth() middleware.
 */
export const requireAdmin = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await syncUser(req);
      if (!user) {
        return (res as any).status(401).json({ error: 'Not authenticated' });
      }
      if ((user as any).role !== 'ADMIN') {
        return (res as any).status(403).json({ error: 'Admin access required' });
      }
      // Attach user to request for downstream use
      (req as any).adminUser = user;
      next();
    } catch (err) {
      console.error('Admin auth check failed:', err);
      return (res as any).status(401).json({ error: 'Authentication failed' });
    }
  };
};
