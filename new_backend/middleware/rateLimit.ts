import type { NextFunction, Request, Response } from "express";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  scope: "ip" | "user_or_ip";
}

type Bucket = { count: number; resetAt: number };

// 1. Map is stored outside the function so it persists
const buckets = new Map<string, Bucket>();

// 2. Background cleanup task runs every 1 minute.
// This prevents the "Event Loop Blocking" bug when you get lots of users!
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of buckets.entries()) {
    if (now >= value.resetAt) {
      buckets.delete(key);
    }
  }
}, 60_000);

function resolveKey(req: Request, scope: RateLimitOptions["scope"]): string {
  // 3. Safely check for proxy IPs (like Render, AWS, or Nginx)
  const ip = req.headers['x-forwarded-for'] || req.ip || "unknown";
  
  if (scope === "user_or_ip" && req.user?.id) {
    return `user:${req.user.id}`;
  }
  return `ip:${ip}`;
}

export function createRateLimit(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = resolveKey(req, options.scope);
    const existing = buckets.get(key);

    if (!existing || now >= existing.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (existing.count >= options.max) {
      const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(Math.max(retryAfterSeconds, 1)));
      
      // I updated this to standard JSON response format, adjust to your sendError utility if needed
      res.status(429).json({
        error: "RATE_LIMITED",
        message: "Too many requests. Please try again later."
      });
      return;
    }

    existing.count += 1;
    buckets.set(key, existing);
    next();
  };
}