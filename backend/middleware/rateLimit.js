// =========================================
// FIXED WINDOW RATE LIMITER
// =========================================
// Self-contained on purpose: the project has
// no express-rate-limit dependency, and adding
// one for a single route would be heavier than
// the protection is worth.
//
// Purpose: slow down casual abuse of the
// PUBLIC subscribe endpoint. It is deliberately
// NOT aggressive, because a shared office or
// mobile-carrier NAT can put many real people
// behind one IP address.
//
// This is a best-effort in-memory limiter. It
// resets when the process restarts and is not
// shared across instances. Swapping it for
// express-rate-limit backed by Redis later only
// requires changing this one file.

const buckets = new Map();


// Stop the Map growing without bound on a
// long-running process.
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;

const sweep = setInterval(() => {
  const now = Date.now();

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}, SWEEP_INTERVAL_MS);

// Do not hold the event loop open for this timer.
sweep.unref?.();


const resolveClientIp = (req) => {
  // Only the first hop is trustworthy, and only
  // when the app sits behind a proxy that sets
  // it. Spoofable otherwise, which is why the
  // limit is generous.
  const forwarded = req.headers["x-forwarded-for"];

  if (
    typeof forwarded === "string" &&
    forwarded.length > 0
  ) {
    const first = forwarded.split(",")[0].trim();

    if (first) {
      return first;
    }
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
};


const rateLimit = ({
  windowMs = 60 * 60 * 1000,
  max = 10,
  message = "Too many requests. Please try again later.",
  keyPrefix = "rl",
} = {}) => {
  return (req, res, next) => {
    const now = Date.now();

    const key = `${keyPrefix}:${resolveClientIp(req)}`;

    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = {
        count: 0,
        resetAt: now + windowMs,
      };

      buckets.set(key, bucket);
    }

    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);

    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader(
      "X-RateLimit-Remaining",
      String(remaining)
    );
    res.setHeader(
      "X-RateLimit-Reset",
      String(Math.ceil(bucket.resetAt / 1000))
    );

    if (bucket.count > max) {
      res.setHeader(
        "Retry-After",
        String(
          Math.max(
            1,
            Math.ceil((bucket.resetAt - now) / 1000)
          )
        )
      );

      return res.status(429).json({
        success: false,
        message,
      });
    }

    next();
  };
};


export default rateLimit;