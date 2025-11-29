#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";
import { PerplexityClient } from "./perplexity.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = join(homedir(), ".ppx-mcp");
const SETTINGS_PATH = join(CONFIG_DIR, "settings.json");

// Ensure config directory exists
if (!existsSync(CONFIG_DIR)) {
  mkdirSync(CONFIG_DIR, { recursive: true });
}

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

// Get client with fresh cookies (reloads from file each time)
function getClient(): PerplexityClient {
  const cookies = loadCookies();
  return new PerplexityClient(cookies);
}

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
      name: "perplexity_login",
      description: "Opens a browser window to log in to Perplexity and automatically saves cookies. User must complete login in the browser, then the cookies are extracted and saved.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "perplexity_status",
      description: "Check the status of Perplexity MCP configuration and cookies.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "perplexity_ask") {
    const cookies = loadCookies();
    if (!cookies) {
      return {
        content: [{ type: "text", text: "Error: No cookies found. Run perplexity_login first or set PERPLEXITY_COOKIES env var." }],
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
      const client = getClient();
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

  if (name === "perplexity_login") {
    try {
      const { exec } = await import("child_process");
      const loginScript = join(__dirname, "get-cookies.js");

      // Open a new terminal window on Windows with the login script (quoted for spaces)
      const cmd = `start cmd /c node "${loginScript}"`;
      exec(cmd, { cwd: join(__dirname, "..") });

      return {
        content: [{ type: "text", text: "A new terminal window opened with the browser. Please log in to Perplexity, then press ENTER in that terminal to save cookies." }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error launching login: ${message}` }],
        isError: true,
      };
    }
  }

  if (name === "perplexity_status") {
    const settingsExists = existsSync(SETTINGS_PATH);
    const cookies = loadCookies();
    
    if (!settingsExists) {
      return {
        content: [{ type: "text", text: `❌ No settings file found at ${SETTINGS_PATH}\n\nRun perplexity_login to set up your cookies.` }],
      };
    }
    
    if (!cookies) {
      return {
        content: [{ type: "text", text: `⚠️ Settings file exists but no cookies found.\n\nRun perplexity_login to set up your cookies.` }],
      };
    }
    
    return {
      content: [{ type: "text", text: `✓ Settings file: ${SETTINGS_PATH}\n✓ Cookies: Found\n\nIf queries still fail, your session token may have expired. Run perplexity_login to refresh.` }],
    };
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
