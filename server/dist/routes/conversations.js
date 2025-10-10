import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { z } from "zod";
const router = Router();
router.get("/", requireAuth, async (req, res) => {
    const userId = req.user.userId;
    const items = await prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
    });
    res.json({ items });
});
router.post("/", requireAuth, async (req, res) => {
    const schema = z.object({ title: z.string().min(1) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json(parsed.error.format());
    const userId = req.user.userId;
    const created = await prisma.conversation.create({ data: { title: parsed.data.title, userId } });
    res.json({ conversation: created });
});
router.get("/:id/messages", requireAuth, async (req, res) => {
    const userId = req.user.userId;
    const id = req.params.id;
    const messages = await prisma.message.findMany({ where: { conversationId: id, userId }, orderBy: { createdAt: "asc" } });
    res.json({ messages });
});
router.post("/:id/messages", requireAuth, async (req, res) => {
    const schema = z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json(parsed.error.format());
    const userId = req.user.userId;
    const id = req.params.id;
    const created = await prisma.message.create({ data: { conversationId: id, userId, ...parsed.data } });
    res.json({ message: created });
});
export default router;
