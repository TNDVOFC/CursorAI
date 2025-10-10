import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { getEnv } from "./config/env.js";
import { requestLogger } from "./middleware/requestLogger.js";
import preferencesRouter from "./routes/preferences.js";
import authRouter from "./routes/auth.js";
import aiRouter from "./routes/ai.js";
import conversationsRouter from "./routes/conversations.js";
import documentsRouter from "./routes/documents.js";
import adminRouter from "./routes/admin.js";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(requestLogger);
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.use("/api/auth", authRouter);
app.use("/api/ai", aiRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/preferences", preferencesRouter);
// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
});
const { PORT, NODE_ENV } = getEnv();
const port = Number(PORT || 3001);
app.listen(port, () => {
    console.log(`server listening on http://localhost:${port} (${NODE_ENV})`);
});
