import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const hasBearer = Boolean(authHeader && authHeader.startsWith("Bearer ") && authHeader.length > 7);
  if (!req.session?.userId && !hasBearer) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const hasBearer = Boolean(authHeader && authHeader.startsWith("Bearer ") && authHeader.length > 7);
  if (!req.session?.isAdmin && !hasBearer) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
