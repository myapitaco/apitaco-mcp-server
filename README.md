<div align="center">


# apitaco-mcp-server

**MCP server for [Apitaco](https://apitaco.com).** Query your balance, usage, and pricing from any MCP-compatible client.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/myapitaco/apitaco-mcp-server?style=social)](https://github.com/myapitaco/apitaco-mcp-server)

</div>

---

## What it does

Exposes 3 MCP tools to Claude Desktop / Cursor / Claude Code / Cline:

- `apitaco_get_balance` — current account balance in USD
- `apitaco_get_usage` — token + cost stats for last N days
- `apitaco_list_models` — supported models with per-1M pricing

Ask Claude: _"How much do I have left on Apitaco?"_ → it calls the tool and answers.

## Install

```bash
npm install -g @apitaco/mcp-server
```

Or run from source:

```bash
git clone https://github.com/myapitaco/apitaco-mcp-server
cd apitaco-mcp-server
npm install
npm run build
```

## Configure

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "apitaco": {
      "command": "npx",
      "args": ["-y", "@apitaco/mcp-server"],
      "env": {
        "APITACO_API_KEY": "sk-..."
      }
    }
  }
}
```

Restart Claude Desktop. The `apitaco_*` tools appear in the tool list.

### Cursor

In Cursor settings → **Features** → **MCP**, add:

```json
{
  "mcpServers": {
    "apitaco": {
      "command": "npx",
      "args": ["-y", "@apitaco/mcp-server"],
      "env": { "APITACO_API_KEY": "sk-..." }
    }
  }
}
```

### Claude Code

```bash
claude mcp add apitaco npx -y @apitaco/mcp-server
# then set the env var in your shell
export APITACO_API_KEY=sk-...
```

## Usage

After configuring, just ask Claude in any MCP client:

> "Check my Apitaco balance."

> "How much have I spent on Apitaco in the last 30 days?"

> "Which Apitaco models are cheapest for output?"

## Environment variables

| Var | Default | Description |
|---|---|---|
| `APITACO_API_KEY` | required | Get one at [my.apitaco.com/register](https://my.apitaco.com/register) |
| `APITACO_BASE_URL` | `https://api.apitaco.com/v1` | Override for self-hosted / staging |

## Related

- [Apitaco Node SDK](https://github.com/myapitaco/apitaco-node)
- [Apitaco Python SDK](https://github.com/myapitaco/apitaco-python)
- [Awesome Claude Tools](https://github.com/myapitaco/awesome-claude-tools)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## License

MIT.
