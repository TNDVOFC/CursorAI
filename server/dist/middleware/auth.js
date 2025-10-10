import jwt from "jsonwebtoken";
export function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing token" });
    }
    const token = header.slice("Bearer ".length);
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { userId: decoded.userId, role: decoded.role };
        return next();
    }
    catch (e) {
        return res.status(401).json({ error: "Invalid token" });
    }
}
export function requireAdmin(req, res, next) {
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: "Unauthorized" });
    if (user.role !== "admin")
        return res.status(403).json({ error: "Forbidden" });
    next();
}
