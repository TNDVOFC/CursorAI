import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.get("/me", requireAuth, async (req, res) => {
    const userId = req.user.userId;
    let prefs = await prisma.preference.findUnique({ where: { userId } });
    if (!prefs) {
        prefs = await prisma.preference.create({ data: { userId } });
    }
    res.json({ preferences: prefs });
});
const updateSchema = z.object({
    modelName: z.string().optional(),
    temperature: z.number().min(0).max(1).optional(),
    voice: z.string().optional(),
    persona: z.string().optional(),
});
router.put("/me", requireAuth, async (req, res) => {
    const userId = req.user.userId;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json(parsed.error.format());
    const data = parsed.data;
    const updated = await prisma.preference.upsert({
        where: { userId },
        update: data,
        create: { userId, ...data },
    });
    res.json({ preferences: updated });
});
export default router;
