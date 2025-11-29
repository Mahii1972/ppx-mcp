#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { PerplexityClient } from "./perplexity.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SETTINGS_PATH = join(__dirname, "..", "settings.json");

const MODELS: Record<string, { id: string; name: string; desc: string }> = {
  sonar: { id: "turbo", name: "Sonar", desc: "Perplexity's fast model" },
  best: { id: "pplx_pro", name: "Best", desc: "Auto-selects the best model" },
  research: { id: "pplx_alpha", name: "Research", desc: "Deep research" },
  gpt51: { id: "gpt51", name: "GPT-5.1", desc: "OpenAI's latest" },
  "gpt51-thinking": { id: "gpt51_thinking", name: "GPT-5.1 Thinking", desc: "With reasoning" },
  claude: { id: "claude45sonnet", name: "Claude 4.5", desc: "Anthropic's newest" },
  "claude-thinking": { id: "claude45sonnetthinking", name: "Claude 4.5 Thinking", desc: "With reasoning" },
  gemini: { id: "gemini30pro", name: "Gemini 3 Pro", desc: "Google's model" },
  grok: { id: "grok41nonreasoning", name: "Grok 4.1", desc: "xAI's model" },
  kimi: { id: "kimik2thinking", name: "Kimi K2", desc: "Moonshot's model" },
};

function loadCookies(): string {
  // Try settings.json first
  if (existsSync(SETTINGS_PATH)) {
    try {
      const settings = JSON.parse(readFileSync(SETTINGS_PATH, "utf-8"));
      if (settings.cookies) return settings.cookies;
    } catch { /* ignore */ }
  }
  // Fallback to env
  return process.env.PERPLEXITY_COOKIES || "";
}

let cookies = loadCookies();
let client = new PerplexityClient(cookies);

const server = new Server(
  { name: "ppx-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "perplexity_ask",
      description: "Ask Perplexity AI a question with real-time web search. Returns an answer synthesized from multiple online sources.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The question to ask Perplexity",
          },
          model: {
            type: "string",
            description: `Model to use: ${Object.keys(MODELS).join(", ")}. Default: sonar`,
            enum: Object.keys(MODELS),
          },
        },
        required: ["query"],
      },
    },
    {
      name: "perplexity_list_models",
      description: "List all available Perplexity AI models",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "perplexity_set_cookies",
      description: "Set Perplexity cookies for authentication. Get these from Firefox DevTools after logging into perplexity.ai",
      inputSchema: {
        type: "object",
        properties: {
          cookies: {
            type: "string",
            description: "The cookie string from browser DevTools",
          },
        },
        required: ["cookies"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "perplexity_ask") {
    if (!cookies) {
      return {
        content: [{ type: "text", text: "Error: PERPLEXITY_COOKIES environment variable not set" }],
        isError: true,
      };
    }

    const query = args?.query as string;
    if (!query) {
      return {
        content: [{ type: "text", text: "Error: query is required" }],
        isError: true,
      };
    }

    const modelKey = (args?.model as string) || "sonar";
    const model = MODELS[modelKey] || MODELS.sonar;

    try {
      const result = await client.ask(query, model.id);
      return {
        content: [{ type: "text", text: result.answer || "No answer received" }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }

  if (name === "perplexity_list_models") {
    const modelList = Object.entries(MODELS)
      .map(([key, m]) => `- ${key}: ${m.name} - ${m.desc}`)
      .join("\n");
    return {
      content: [{ type: "text", text: `Available Perplexity models:\n${modelList}` }],
    };
  }

  if (name === "perplexity_set_cookies") {
    const newCookies = args?.cookies as string;
    if (!newCookies) {
      return {
        content: [{ type: "text", text: "Error: cookies is required" }],
        isError: true,
      };
    }

    try {
      const { writeFileSync } = await import("fs");
      const settings = existsSync(SETTINGS_PATH)
        ? JSON.parse(readFileSync(SETTINGS_PATH, "utf-8"))
        : {};
      settings.cookies = newCookies;
      writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
      
      // Update client
      cookies = newCookies;
      client = new PerplexityClient(cookies);
      
      return {
        content: [{ type: "text", text: "Cookies saved to settings.json" }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error saving cookies: ${message}` }],
        isError: true,
      };
    }
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("PPX MCP Server running on stdio");
}

main().catch(console.error);
