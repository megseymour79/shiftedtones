const args = process.argv.slice(2);
const urlIndex = args.indexOf("--url");
const baseUrl = urlIndex >= 0 ? args[urlIndex + 1] : process.env.SMOKE_TEST_URL;

if (args.includes("--help") || args.includes("-h")) {
  console.log("Usage: npm run smoke-test -- --url https://shiftedtone.com");
  console.log("Alternatively set SMOKE_TEST_URL. Checks public routes and metadata.");
  process.exit(0);
}

if (!baseUrl) {
  console.error("Provide --url <deployed-origin> or set SMOKE_TEST_URL.");
  process.exit(2);
}

let origin;
try {
  origin = new URL(baseUrl);
  if (!["http:", "https:"].includes(origin.protocol)) throw new Error();
} catch {
  console.error("The smoke-test URL must be a valid HTTP(S) URL.");
  process.exit(2);
}

const checks = [
  { path: "/", kind: "html" },
  { path: "/auth", kind: "html" },
  { path: "/dashboard", kind: "html" },
  { path: "/robots.txt", kind: "robots" },
  { path: "/sitemap.xml", kind: "sitemap" },
  { path: "/manifest.webmanifest", kind: "manifest" },
  { path: "/og.png", kind: "image" },
];
let failed = false;
let rootHtml = "";

for (const check of checks) {
  const url = new URL(check.path, origin);
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    if (check.kind === "html") {
      const body = await response.text();
      if (!body.toLowerCase().includes("<!doctype html")) {
        throw new Error("response is not an HTML SPA document");
      }
      if (check.path === "/") rootHtml = body;
    } else if (check.kind === "robots") {
      const body = await response.text();
      if (!/sitemap:\s*https:\/\/shiftedtone\.com\/sitemap\.xml/i.test(body)) {
        throw new Error("does not reference the production sitemap");
      }
    } else if (check.kind === "sitemap") {
      const body = await response.text();
      if (!body.includes("<urlset") || !body.includes("https://shiftedtone.com/")) {
        throw new Error("missing urlset or production canonical URL");
      }
    } else if (check.kind === "manifest") {
      const body = await response.text();
      if (!body.includes('"name"') || !body.includes("ShiftedTone")) {
        throw new Error("manifest does not identify ShiftedTone");
      }
    } else if (check.kind === "image") {
      const signature = new Uint8Array(await response.arrayBuffer()).subarray(0, 8);
      if (signature.join(",") !== "137,80,78,71,13,10,26,10") {
        throw new Error("response is not a PNG image");
      }
    }

    console.log(`PASS ${check.path}`);
  } catch (error) {
    failed = true;
    console.error(`FAIL ${check.path}: ${error.message}`);
  }
}

for (const [name, pattern] of [
  ["page title", /<title>[^<]*ShiftedTone/i],
  ["canonical URL", /<link[^>]+rel=["']canonical["'][^>]+https:\/\/shiftedtone\.com\//i],
  ["description", /<meta[^>]+name=["']description["'][^>]+content=["'][^"']+/i],
  ["Open Graph image", /<meta[^>]+property=["']og:image["'][^>]+https:\/\/shiftedtone\.com\/og\.png/i],
  ["Twitter card", /<meta[^>]+name=["']twitter:card["'][^>]+summary_large_image/i],
]) {
  if (pattern.test(rootHtml)) {
    console.log(`PASS ${name}`);
  } else {
    failed = true;
    console.error(`FAIL ${name}: missing or invalid in the root HTML`);
  }
}

if (failed) process.exitCode = 1;
else console.log(`All public smoke checks passed for ${origin.origin}.`);
