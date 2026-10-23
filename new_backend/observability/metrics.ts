import type { NextFunction, Request, Response } from "express";
import { METRICS_ENABLED } from "../config/envConfig.ts";

type CounterMap = Record<string, number>;

const requestCount: CounterMap = {};
const requestDurationMs: CounterMap = {};
const statusCount: CounterMap = {};
const startAt = Date.now();

function inc(store: CounterMap, key: string, amount = 1) {
  store[key] = (store[key] ?? 0) + amount;
}

function normalizePath(path: string) {
  return path
    .replace(/[a-f0-9]{24}/gi, ":id")
    .replace(/\d+/g, ":n");
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!METRICS_ENABLED) {
    next();
    return;
  }

  const begin = Date.now();
  const methodPath = `${req.method} ${normalizePath(req.path)}`;

  res.on("finish", () => {
    const duration = Date.now() - begin;
    inc(requestCount, methodPath);
    inc(requestDurationMs, methodPath, duration);
    inc(statusCount, `${res.statusCode}`);
  });

  next();
}

function toPrometheusMetric(name: string, values: CounterMap, help: string) {
  const lines = [`# HELP ${name} ${help}`, `# TYPE ${name} counter`];
  for (const key of Object.keys(values)) {
    const label = key.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    lines.push(`${name}{key="${label}"} ${values[key]}`);
  }
  return lines.join("\n");
}

export function metricsSnapshot() {
  const uptimeSec = Math.floor((Date.now() - startAt) / 1000);
  const blocks = [
    toPrometheusMetric("volstory_requests_total", requestCount, "Total requests by route"),
    toPrometheusMetric("volstory_request_duration_ms_total", requestDurationMs, "Accumulated request duration"),
    toPrometheusMetric("volstory_response_status_total", statusCount, "Response status count"),
    "# HELP volstory_uptime_seconds Process uptime in seconds",
    "# TYPE volstory_uptime_seconds gauge",
    `volstory_uptime_seconds ${uptimeSec}`,
  ];
  return `${blocks.join("\n")}\n`;
}
