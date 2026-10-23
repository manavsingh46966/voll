import cors from "cors";
import express from "express";
import { CORS_ORIGIN } from "./config/envConfig.ts";
import { globalErrorHandler } from "./middleware/errorMiddleware.ts";
// import { requestLogger } from "./middleware/requestLogger.ts";
import { securityHeaders } from "./middleware/securityHeaders.ts";
import { metricsMiddleware } from "./observability/metrics.ts";
import groupRouter from "./routes/groupRoutes.ts";
import { authRouter } from "./routes/authRoutes.ts";
import commentRouter from "./routes/commentRoutes.ts";
import eventRouter from "./routes/eventRoutes.ts";
import s3Router from "./routes/s3Routes.ts";
import storyRouter from "./routes/storyRoutes.ts";
import systemRouter from "./routes/systemRoutes.ts";
import { userRouter } from "./routes/userRoutes.ts";
import { notificationRouter } from "./routes/notificationRoutes.ts";
import { sendError } from "./utils/http.ts";

export const app = express();

app.use(
  cors({
    origin: CORS_ORIGIN ? CORS_ORIGIN.split(",").map((item) => item.trim()) : true,
    credentials: true,
  }),
);
app.use(securityHeaders);
// app.use(requestLogger);
app.use(express.json({ limit: "2mb" }));
app.use(metricsMiddleware);
app.use((_req, res, next) => {
  res.setHeader("X-API-Version", "v1");
  next();
});

app.get("/", (_req, res) => {
  res.json({ message: "Backend is up.", status: "OK" });
});

app.use("/api", systemRouter);
app.use("/api/v1", systemRouter);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/stories", storyRouter);
app.use("/api/comments", commentRouter);
app.use("/api/groups", groupRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/stories", storyRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/groups", groupRouter);
app.use("/api/events", eventRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/s3", s3Router);
app.use("/api/v1/s3", s3Router);

app.use((_req, res) => {
  sendError(res, 404, "NOT_FOUND", "Route not found.");
});

app.use(globalErrorHandler);
