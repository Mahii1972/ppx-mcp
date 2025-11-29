// Quick test of the Perplexity client
import { PerplexityClient } from "./src/perplexity.js";

const cookies = process.env.PERPLEXITY_COOKIES;
if (!cookies) {
  console.error("Set PERPLEXITY_COOKIES env var");
  process.exit(1);
}

const client = new PerplexityClient(cookies);

console.log("Testing Perplexity API...");
try {
  const result = await client.ask("What is 2+2?", "turbo");
  console.log("Answer:", result.answer);
} catch (e) {
  console.error("Error:", e);
}
