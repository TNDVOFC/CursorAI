import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import OpenAI from "openai";
import { createReadStream, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import Tesseract from "tesseract.js";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../config/prisma.js";

ffmpeg.setFfmpegPath(ffmpegPath as string);

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const textSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
  imageUrls: z.array(z.string().url()).optional(),
});

router.post("/chat", requireAuth, async (req, res) => {
  const parsed = textSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }

  const userId = (req as any).user.userId as string;
  const { message, conversationId, imageUrls } = parsed.data;

  // Load user preferences for system prompt and parameters
  const prefs = await prisma.preference.findUnique({ where: { userId } });
  const systemPrompt = prefs?.persona || "You are a helpful AI assistant.";
  const modelName = prefs?.modelName || "gpt-4o-mini";
  const temperature = prefs?.temperature ?? 0.3;

  // Ensure conversation exists
  let convId = conversationId;
  if (!convId) {
    const created = await prisma.conversation.create({
      data: { title: message.slice(0, 40), userId },
      select: { id: true },
    });
    convId = created.id;
  }

  // Store user message
  await prisma.message.create({
    data: { conversationId: convId!, userId, role: "user", content: message },
  });

  const contentParts: any[] = [{ type: "text", text: message }];
  if (imageUrls?.length) {
    for (const url of imageUrls) {
      contentParts.push({ type: "image_url", image_url: { url } });
    }
  }

  const response = await openai.chat.completions.create({
    model: modelName,
    temperature,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: contentParts as any },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "";

  // Store assistant message
  await prisma.message.create({
    data: { conversationId: convId!, userId, role: "assistant", content },
  });

  res.json({ content, conversationId: convId });
});

router.post("/vision", requireAuth, upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "image file is required" });
  const tmpPath = join(tmpdir(), `img-${Date.now()}.png`);
  writeFileSync(tmpPath, req.file.buffer);

  // OCR text
  const ocr = await Tesseract.recognize(tmpPath, "eng");
  const ocrText = ocr.data.text;

  // Vision captioning via OpenAI
  const base64 = req.file.buffer.toString("base64");
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Describe this image and extract useful info." },
          { type: "image_url", image_url: { url: `data:${req.file.mimetype};base64,${base64}` } },
        ] as any,
      },
    ],
  });
  const content = response.choices[0]?.message?.content ?? "";

  res.json({ text: content, ocrText });
});

router.post("/transcribe", requireAuth, upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "audio file is required" });
  const inputPath = join(tmpdir(), `in-${Date.now()}.webm`);
  writeFileSync(inputPath, req.file.buffer);

  // Convert to mp3 for better compatibility
  const outPath = join(tmpdir(), `out-${Date.now()}.mp3`);
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath).output(outPath).on("end", () => resolve()).on("error", reject).run();
  });

  const response = await openai.audio.transcriptions.create({
    model: "gpt-4o-transcribe",
    file: createReadStream(outPath) as any,
  });

  res.json({ text: response.text });
});

router.post("/image-gen", requireAuth, async (req, res) => {
  const schema = z.object({ prompt: z.string().min(5) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.format());

  const { prompt } = parsed.data;
  const result = await openai.images.generate({ model: "gpt-image-1", prompt, size: "1024x1024" });
  const imageBase64 = result?.data && result.data[0] ? result.data[0].b64_json : undefined;
  res.json({ imageBase64 });
});

router.post("/tts", requireAuth, async (req, res) => {
  const schema = z.object({ text: z.string().min(1), voice: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.format());
  const { text, voice } = parsed.data;
  const prefs = await prisma.preference.findUnique({ where: { userId: (req as any).user.userId } });
  const useVoice = voice || prefs?.voice || "alloy";

  const speech = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: useVoice,
    input: text,
    format: "mp3",
  } as any);

  // openai sdk may return ArrayBuffer or Readable; normalize to Buffer
  const arrayBuffer = (speech as any).arrayBuffer ? await (speech as any).arrayBuffer() : undefined;
  const buffer = arrayBuffer ? Buffer.from(arrayBuffer) : Buffer.from(await (speech as any).value());
  res.setHeader("Content-Type", "audio/mpeg");
  res.send(buffer);
});

export default router;
