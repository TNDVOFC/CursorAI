import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(["user", "admin"]).optional(),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.format());
  const { email, password, name, role } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already in use" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role: role ?? "user" },
    select: { id: true, email: true, name: true, role: true },
  });
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: "7d" });
  res.json({ user, token });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.format());
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: "7d" });
  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  });
});

export default router;
