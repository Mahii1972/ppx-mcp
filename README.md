# PPX-MCP

**Unofficial** MCP server for Perplexity AI with real-time web search.

Uses your Perplexity Pro subscription instead of the Perplexity API — no API keys needed, just your browser cookies. Supports model selection including GPT-5.1, Claude 4.5, Gemini, Grok, and more.

> ⚠️ **Disclaimer:** This is an unofficial project and is not affiliated with, endorsed by, or associated with Perplexity AI in any way.

## Installation

```bash
npm install -g ppx-sub-mcp
```

Or run directly with npx:
```bash
npx ppx-sub-mcp
```

## Usage with Kiro / Claude Desktop

Add to your MCP config:

```json
{
  "mcpServers": {
    "ppx": {
      "command": "npx",
      "args": ["ppx-sub-mcp"]
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
| `model` | No | See models below (default: `sonar`) |

## Available Models

| Model | Description |
|-------|-------------|
| `sonar` | Sonar - Perplexity's fast model |
| `best` | Best - Auto-selects the best model |
| `research` | Research - Deep research |
| `gpt51` | GPT-5.1 - OpenAI's latest |
| `gpt51-thinking` | GPT-5.1 Thinking - With reasoning |
| `claude` | Claude 4.5 - Anthropic's newest |
| `claude-thinking` | Claude 4.5 Thinking - With reasoning |
| `gemini` | Gemini 3 Pro - Google's model |
| `grok` | Grok 4.1 - xAI's model |
| `kimi` | Kimi K2 - Moonshot's model |

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

This is an unofficial project and is not affiliated with Perplexity AI.
