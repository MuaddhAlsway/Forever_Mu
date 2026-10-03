import "dotenv/config";
import fs from "fs";
import http from "node:http";

const ASSETS = "C:/Users/irahm/Downloads/ecommerance-app/frontend/src/assets/frontend_assets";
const HOST = { host: "localhost", port: 4000 };

const call = (method, pathname, body, headers) =>
  new Promise((resolve) => {
    const req = http.request(
      { ...HOST, path: pathname, method, headers: { ...headers, "Content-Length": body.length } },
      (res) => {
        const c = [];
        res.on("data", (d) => c.push(d));
        res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(c).toString("utf8") }));
      }
    );
    req.on("error", (e) => resolve({ status: 0, body: "ERR " + e.message }));
    req.end(body);
  });

const json = (o) => Buffer.from(JSON.stringify(o), "utf8");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- 1. parse the frontend catalog ----------
const src = fs.readFileSync(`${ASSETS}/assets.js`, "utf8");
const body = src.slice(src.indexOf("export const products = ["));

const catalog = body
  .split(/\{\s*\r?\n\s*_id:/)
  .slice(1)
  .map((block) => {
    const pick = (re) => (block.match(re) || [])[1];
    return {
      _id: pick(/_id:\s*"([^"]+)"/),
      name: pick(/name:\s*"([^"]*)"/),
      description: pick(/description:\s*"([^"]*)"/),
      price: pick(/price:\s*([\d.]+)/),
      images: (pick(/image:\s*\[([^\]]*)\]/) || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      category: pick(/category:\s*"([^"]+)"/),
      subCategory: pick(/subCategory:\s*"([^"]+)"/),
      sizes: (pick(/sizes:\s*\[([^\]]*)\]/) || "")
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean),
      bestseller: pick(/bestseller:\s*(true|false)/) === "true",
    };
  })
  .filter((p) => p.name && p.images.length);

console.log(`parsed ${catalog.length} products from frontend catalog`);

const missing = catalog.filter((p) => p.images.some((i) => !fs.existsSync(`${ASSETS}/${i}.png`)));
if (missing.length) {
  console.log("MISSING IMAGE FILES:", missing.map((p) => p._id).join(", "));
}

// ---------- 2. admin token ----------
let r = await call("POST", "/api/user/admin",
  json({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
  { "Content-Type": "application/json" });
const token = JSON.parse(r.body).token;
if (!token) { console.log("admin login FAILED:", r.body); process.exit(1); }
console.log("admin token obtained\n");

// ---------- 3. guard against duplicates ----------
r = await call("GET", "/api/product/list", Buffer.alloc(0), {});
const existing = JSON.parse(r.body).products.length;
if (existing > 0) {
  console.log(`ABORT: MongoDB already has ${existing} products. Delete them first to avoid duplicates.`);
  process.exit(1);
}

// ---------- 4. seed ----------
const field = (b, name, val) =>
  Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${val}\r\n`, "utf8");

let ok = 0;
const failures = [];

for (const [i, p] of catalog.entries()) {
  const b = "----seed" + Math.random().toString(36).slice(2);
  const chunks = [
    field(b, "name", p.name),
    field(b, "description", p.description),
    field(b, "price", p.price),
    field(b, "category", p.category),
    field(b, "subCategory", p.subCategory),
    field(b, "sizes", JSON.stringify(p.sizes)),
    field(b, "bestseller", String(p.bestseller)),
  ];

  p.images.slice(0, 4).forEach((tokenName, n) => {
    chunks.push(
      Buffer.from(
        `--${b}\r\nContent-Disposition: form-data; name="image${n + 1}"; filename="${tokenName}.png"\r\n` +
        `Content-Type: image/png\r\n\r\n`, "utf8"),
      fs.readFileSync(`${ASSETS}/${tokenName}.png`),
      Buffer.from("\r\n", "utf8")
    );
  });
  chunks.push(Buffer.from(`--${b}--\r\n`, "utf8"));

  const payload = Buffer.concat(chunks);
  const res2 = await call("POST", "/api/product/add", payload,
    { "Content-Type": `multipart/form-data; boundary=${b}`, token });

  let parsed = {};
  try { parsed = JSON.parse(res2.body); } catch {}

  if (parsed.success) {
    ok++;
    console.log(`  [${String(i + 1).padStart(2)}/${catalog.length}] OK   $${String(p.price).padEnd(4)} ${p.category.padEnd(5)} ${p.name.slice(0, 42)}`);
  } else {
    failures.push({ id: p._id, name: p.name, msg: (parsed.message || res2.body).slice(0, 120) });
    console.log(`  [${String(i + 1).padStart(2)}/${catalog.length}] FAIL ${p.name} -> ${failures.at(-1).msg}`);
  }

  await sleep(120);
}

console.log(`\nseeded ${ok}/${catalog.length}`);
if (failures.length) console.log("failures:", JSON.stringify(failures, null, 2));

// ---------- 5. verify through the endpoint List.jsx calls ----------
r = await call("GET", "/api/product/list", Buffer.alloc(0), {});
const list = JSON.parse(r.body);
console.log(`\nGET /api/product/list -> success: ${list.success} | count: ${list.products.length}`);
console.log("sample rows:");
for (const p of list.products.slice(0, 6)) {
  console.log(`  ${String(p.category).padEnd(5)} $${String(p.price).padEnd(4)} ${String(p.name).slice(0, 38).padEnd(40)} ${String(p.image?.[0]).slice(0, 58)}`);
}
console.log("rows with images:", list.products.filter((p) => p.image?.[0]).length);
console.log("rows with sizes :", list.products.filter((p) => Array.isArray(p.sizes) && p.sizes.length).length);
console.log("bestsellers     :", list.products.filter((p) => p.bestseller).length);