import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  role: "user" | "admin";
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }
  const token = header.slice("Bearer ".length);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    (req as any).user = { userId: decoded.userId, role: decoded.role };
    return next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  if (user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  next();
}
