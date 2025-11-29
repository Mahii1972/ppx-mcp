# PPX-MCP

MCP server for querying Perplexity AI with real-time web search.

Pure Node.js - uses `got-scraping` for Cloudflare bypass.

## Setup

```bash
cd ppx-mcp
npm install
npm run build
```

## Usage with Kiro

Add to `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "ppx": {
      "command": "node",
      "args": ["C:/Users/conne/Side Projects/perplexity-webui-scraper/ppx-mcp/dist/index.js"]
    }
  }
}
```

Cookies are stored in `ppx-mcp/settings.json` (no env vars needed).

## Tools

### perplexity_ask
Ask Perplexity AI with web search.

- `query` (required): Question to ask
- `model` (optional): sonar, best, research, gpt51, claude, gemini, grok, kimi

### perplexity_list_models
List available models.

### perplexity_set_cookies
Update cookies (saves to settings.json).

- `cookies` (required): Cookie string from browser

## Getting Cookies

1. Open Firefox → perplexity.ai → log in
2. DevTools (F12) → Network tab
3. Send a message
4. Find `perplexity_ask` request → copy Cookie header
5. Use `perplexity_set_cookies` tool or edit `settings.json` directly
