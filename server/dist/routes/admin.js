import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { requireAdmin } from "../middleware/auth.js";
const router = Router();
router.get("/stats", requireAdmin, async (_req, res) => {
    const [users, conversations, messages, recentRequests, avgDuration] = await Promise.all([
        prisma.user.count(),
        prisma.conversation.count(),
        prisma.message.count(),
        prisma.requestLog.count({
            where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        }),
        prisma.requestLog.aggregate({ _avg: { durationMs: true } }),
    ]);
    res.json({
        users,
        conversations,
        messages,
        requestsLast24h: recentRequests,
        avgDurationMs: Math.round(avgDuration._avg.durationMs ?? 0),
    });
});
export default router;
