# PPX-MCP

MCP server for querying Perplexity AI with real-time web search.

Pure Node.js — uses `got-scraping` for Cloudflare bypass.

## Installation

```bash
npm install -g ppx-mcp
```

Or run directly with npx:
```bash
npx ppx-mcp
```

## Usage with Kiro / Claude Desktop

Add to your MCP config:

```json
{
  "mcpServers": {
    "ppx": {
      "command": "npx",
      "args": ["ppx-mcp"]
    }
  }
}
```

Cookies are stored in `settings.json` in the package directory.

## Tools

| Tool | Description |
|------|-------------|
| `perplexity_ask` | Ask Perplexity AI with web search |
| `perplexity_list_models` | List available models |
| `perplexity_login` | Open browser to log in and auto-save cookies |

### perplexity_ask

| Parameter | Required | Description |
|-----------|----------|-------------|
| `query` | Yes | Question to ask |
| `model` | No | `sonar`, `best`, `research`, `gpt51`, `claude`, `gemini`, `grok`, `kimi` |

## Getting Cookies

**Option 1: Use the login tool**
- Call `perplexity_login` — opens a browser window
- Log in to Perplexity
- Cookies are automatically saved

**Option 2: Manual**
1. Open Firefox → perplexity.ai → log in
2. DevTools (F12) → Network tab
3. Send a message
4. Find `perplexity_ask` request → copy Cookie header
5. Edit `settings.json` directly

## License

MIT
