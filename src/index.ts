#!/usr/bin/env node
/**
 * Apitaco MCP server.
 *
 * Exposes balance, usage, and pricing queries as MCP tools so clients
 * like Claude Desktop, Cursor, Claude Code, and Cline can read your
 * Apitaco account state without leaving the chat.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"

const APITACO_BASE_URL =
  process.env.APITACO_BASE_URL ?? "https://api.apitaco.com/v1"
const APITACO_API_KEY = process.env.APITACO_API_KEY ?? ""

if (!APITACO_API_KEY) {
  console.error(
    "[apitaco-mcp-server] WARNING: APITACO_API_KEY not set. Tools will return 401 errors.",
  )
}

const server = new Server(
  { name: "apitaco-mcp-server", version: "0.1.0" },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "apitaco_get_balance",
      description:
        "Get the current Apitaco account balance in USD. Use this when the user asks 'how much do I have left' or 'what's my balance'.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "apitaco_get_usage",
      description:
        "Get Apitaco usage stats for the last N days (default 7). Returns total tokens and cost.",
      inputSchema: {
        type: "object",
        properties: {
          days: {
            type: "number",
            description: "Window size in days (default 7, max 90)",
          },
        },
        required: [],
      },
    },
    {
      name: "apitaco_list_models",
      description:
        "List models available on Apitaco with their per-million-token pricing.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
  ],
}))

async function callApitacoApi(path: string): Promise<unknown> {
  const res = await fetch(`${APITACO_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${APITACO_API_KEY}`,
      "x-api-key": APITACO_API_KEY,
    },
  })
  if (!res.ok) {
    throw new Error(`Apitaco API ${res.status}: ${await res.text()}`)
  }
  return res.json()
}

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params

  try {
    switch (name) {
      case "apitaco_get_balance": {
        const data = (await callApitacoApi("/account/balance")) as {
          balance_usd?: number
        }
        return {
          content: [
            {
              type: "text",
              text: `Apitaco balance: $${(data.balance_usd ?? 0).toFixed(2)}`,
            },
          ],
        }
      }

      case "apitaco_get_usage": {
        const days = Math.min(Math.max(Number(args?.days ?? 7), 1), 90)
        const data = (await callApitacoApi(
          `/account/usage?days=${days}`,
        )) as { total_tokens?: number; total_cost_usd?: number }
        return {
          content: [
            {
              type: "text",
              text:
                `Apitaco usage (last ${days} days):\n` +
                `Total tokens: ${(data.total_tokens ?? 0).toLocaleString()}\n` +
                `Total cost: $${(data.total_cost_usd ?? 0).toFixed(4)}`,
            },
          ],
        }
      }

      case "apitaco_list_models": {
        // Static fallback if /models endpoint is unavailable; replace with
        // real fetch when api.apitaco.com exposes /v1/models.
        const models = [
          ["claude-opus-4.7", 15.0, 75.0],
          ["claude-opus-4.6", 15.0, 75.0],
          ["claude-sonnet-4.6", 3.0, 15.0],
          ["claude-sonnet-4.5", 3.0, 15.0],
          ["claude-haiku-4.5", 1.0, 5.0],
          ["gpt-5.5", 10.0, 30.0],
          ["gpt-5.4", 10.0, 30.0],
        ] as const
        const lines = models
          .map(
            ([id, inP, outP]) =>
              `${id}  in $${inP}/1M  out $${outP}/1M`,
          )
          .join("\n")
        return {
          content: [
            {
              type: "text",
              text: `Apitaco models (USD per 1M tokens):\n${lines}\n\nLive pricing: https://apitaco.com`,
            },
          ],
        }
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      content: [{ type: "text", text: `Error: ${msg}` }],
      isError: true,
    }
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
