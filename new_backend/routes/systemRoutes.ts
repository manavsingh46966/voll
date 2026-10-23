import { Router } from "express";
import mongoose from "mongoose";
import { FEATURE_FLAGS } from "../config/envConfig.ts";
import { metricsSnapshot } from "../observability/metrics.ts";

const systemRouter = Router();

systemRouter.get("/health/live", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

systemRouter.get("/health/ready", (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  if (!ready) {
    res.status(503).json({ status: "not_ready" });
    return;
  }
  res.status(200).json({ status: "ready" });
});

systemRouter.get("/metrics", (_req, res) => {
  res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.status(200).send(metricsSnapshot());
});

systemRouter.get("/feature-flags", (_req, res) => {
  res.status(200).json(FEATURE_FLAGS);
});

export default systemRouter;
