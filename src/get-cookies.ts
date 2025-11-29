import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { Cookie } from "puppeteer-core";

// @ts-ignore - puppeteer-extra types are incomplete
puppeteer.use(StealthPlugin());

const CONFIG_DIR = join(homedir(), ".ppx-mcp");
const SETTINGS_PATH = join(CONFIG_DIR, "settings.json");

// Ensure config directory exists
if (!existsSync(CONFIG_DIR)) {
  mkdirSync(CONFIG_DIR, { recursive: true });
}

// Common Chrome paths on Windows
const CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
];

function findChrome(): string {
  for (const p of CHROME_PATHS) {
    if (p && existsSync(p)) return p;
  }
  throw new Error("Chrome not found. Install Chrome or set path manually.");
}

async function getCookies() {
  console.log("Launching browser...");

  // @ts-ignore - puppeteer-extra types are incomplete
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: findChrome(),
    defaultViewport: null,
    args: [
      "--start-maximized",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const page = await browser.newPage();
  await page.goto("https://www.perplexity.ai", { waitUntil: "networkidle2" });

  console.log("\n===========================================");
  console.log("Please log in to Perplexity in the browser.");
  console.log("Once logged in, press ENTER here to continue...");
  console.log("===========================================\n");

  // Wait for user input
  await new Promise<void>((resolve) => {
    process.stdin.once("data", () => resolve());
  });

  // Get all cookies
  const cookies = await page.cookies();
  const cookieString = cookies.map((c: Cookie) => `${c.name}=${c.value}`).join("; ");

  // Save to settings.json
  const settings = existsSync(SETTINGS_PATH)
    ? JSON.parse(readFileSync(SETTINGS_PATH, "utf-8"))
    : {};
  settings.cookies = cookieString;
  writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));

  console.log(`\n✓ Cookies saved to ${SETTINGS_PATH}`);
  console.log(`  Found ${cookies.length} cookies`);

  await browser.close();
  process.exit(0);
}

getCookies().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
