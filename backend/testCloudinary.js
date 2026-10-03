import "dotenv/config";
import fs from "fs";
import os from "os";
import path from "path";
import https from "https";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";

// ---------- STEP 3: configuration ----------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const cfg = cloudinary.config();
console.log("=== CONFIG (no secrets printed) ===");
console.log("cloud_name:", cfg.cloud_name);
console.log("api_key set:", Boolean(cfg.api_key), "(len " + (cfg.api_key || "").length + ")");
console.log("api_secret set:", Boolean(cfg.api_secret), "(len " + (cfg.api_secret || "").length + ")");

// ---------- STEP 4: real local file ----------
const candidates = [
  process.argv[2],
  path.join(os.tmpdir(), "quickshow-tech-stack.png"),
  path.join(process.cwd(), "test-image.jpg.png"),
].filter(Boolean);

let filePath = null;
for (const c of candidates) {
  try {
    const s = fs.statSync(c);
    if (s.isFile() && s.size > 0) {
      fs.accessSync(c, fs.constants.R_OK);
      filePath = path.resolve(c);
      console.log("\nFILE OK:", filePath, "bytes=" + s.size);
      break;
    }
  } catch (e) {
    console.log("FILE MISSING:", c, e.code);
  }
}
if (!filePath) process.exit(1);

// ---------- ping + environment identity ----------
try {
  const ping = await cloudinary.api.ping();
  console.log("\nPING OK:", ping.status);
} catch (e) {
  console.log("\nPING FAILED:", e.message);
}

try {
  const info = await cloudinary.api.config();
  console.log("ENV id:", info.id, "| cloud_name:", info.cloud_name, "| created:", info.created_at);
} catch (e) {
  console.log("CONFIG CALL FAILED:", e.message);
}

// ---------- isolated upload ----------
console.log("\n=== cloudinary.uploader.upload() ===");
try {
  const result = await cloudinary.uploader.upload(filePath, { resource_type: "image" });
  console.log("UPLOAD SUCCESS");
  console.log("secure_url:", result.secure_url);
  console.log("public_id:", result.public_id);
  const head = await fetch(result.secure_url, { method: "HEAD" });
  console.log("URL REACHABLE:", head.status, head.headers.get("content-type"));
  process.exit(0);
} catch (error) {
  console.log("UPLOAD FAILED");
  console.log("http_code:", error.http_code);
  console.log("name:", error.name);
  console.log("message:", error.message);
}

// ---------- raw provider response (x-cld-error is hidden by the SDK) ----------
const ts = Math.round(Date.now() / 1000);
const signature = crypto
  .createHash("sha1")
  .update(`timestamp=${ts}${process.env.CLOUDINARY_SECRET_KEY}`)
  .digest("hex");
const b = "----cl" + Date.now();
const field = (k, v) => Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`, "utf8");
const body = Buffer.concat([
  field("timestamp", String(ts)),
  field("signature", signature),
  field("api_key", process.env.CLOUDINARY_API_KEY),
  Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="file"; filename="probe.png"\r\nContent-Type: image/png\r\n\r\n`, "utf8"),
  fs.readFileSync(filePath),
  Buffer.from(`\r\n--${b}--\r\n`, "utf8"),
]);

await new Promise((resolve) => {
  const req = https.request(
    {
      host: "api.cloudinary.com",
      path: `/v1_1/${process.env.CLOUDINARY_NAME}/image/upload`,
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${b}`,
        "Content-Length": body.length,
      },
    },
    (res) => {
      const c = [];
      res.on("data", (d) => c.push(d));
      res.on("end", () => {
        console.log("\n=== RAW PROVIDER RESPONSE (no SDK) ===");
        console.log("status:", res.statusCode);
        console.log("x-cld-error:", res.headers["x-cld-error"] || "(none)");
        console.log("x-request-id:", res.headers["x-request-id"] || "(none)");
        console.log("body:", Buffer.concat(c).toString("utf8").slice(0, 500));
        resolve();
      });
    }
  );
  req.on("error", (e) => {
    console.log("RAW ERROR", e.message);
    resolve();
  });
  req.end(body);
});
