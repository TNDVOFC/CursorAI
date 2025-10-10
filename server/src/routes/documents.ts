import { Router } from "express";
import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { z } from "zod";
import { Readable } from "stream";

const router = Router();

const schema = z.object({
  filename: z.string().default("document"),
  content: z.string().min(1),
});

router.post("/generate", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.format());
  const { filename, content } = parsed.data;
  res.json({ message: "ok", filename, bytes: content.length });
});

router.post("/pdf", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.format());
  const { filename, content } = parsed.data;

  const doc = new PDFDocument();
  const chunks: Buffer[] = [];
  doc.on("data", (d: Buffer) => chunks.push(d));
  doc.on("end", () => {
    const buffer = Buffer.concat(chunks);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}.pdf`);
    res.send(buffer);
  });

  doc.fontSize(12).text(content);
  doc.end();
});

router.post("/docx", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.format());
  const { filename, content } = parsed.data;

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [new Paragraph({ children: [new TextRun(content)] })],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}.docx`);
  res.send(buffer);
});

router.post("/txt", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.format());
  const { filename, content } = parsed.data;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}.txt`);
  res.send(content);
});

router.post("/md", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.format());
  const { filename, content } = parsed.data;

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}.md`);
  res.send(content);
});

export default router;
