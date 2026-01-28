import { PerplexityClient } from "./src/perplexity.js";
import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const SETTINGS_PATH = join(homedir(), ".ppx-mcp", "settings.json");
const settings = JSON.parse(readFileSync(SETTINGS_PATH, "utf-8"));

const client = new PerplexityClient(settings.cookies);

async function test() {
  console.log("Testing Perplexity client...");
  const result = await client.ask("What is 2 + 2?", "turbo");
  console.log("Result:", result);
}

test().catch(console.error);
