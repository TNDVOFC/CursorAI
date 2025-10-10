import { prisma } from "../config/prisma.js";
export function requestLogger(req, res, next) {
    const start = Date.now();
    res.on("finish", async () => {
        try {
            const userId = req?.user?.userId;
            const durationMs = Date.now() - start;
            await prisma.requestLog.create({
                data: {
                    userId: userId ?? null,
                    method: req.method,
                    path: req.path,
                    status: res.statusCode,
                    durationMs,
                },
            });
        }
        catch (err) {
            // log but do not block response lifecycle
            // eslint-disable-next-line no-console
            console.error("requestLogger error", err);
        }
    });
    next();
}
