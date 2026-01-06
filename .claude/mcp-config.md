# MCP Server Configuration

Model Context Protocol (MCP) server configuration for Claude Code.

---

## Overview

MCP servers extend Claude Code's capabilities by providing access to external tools and data sources. This document provides configuration templates and guidelines.

---

## Configuration File

MCP configuration is stored in `.mcp.json` at the project root.

### Basic Structure

```json
{
  "mcpServers": {
    "[server-name]": {
      "command": "[executable]",
      "args": ["[arg1]", "[arg2]"],
      "env": {
        "[ENV_VAR]": "[value]"
      }
    }
  }
}
```

---

## Common Server Configurations

### Brave Search

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-brave-search"],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      }
    }
  }
}
```

**Setup**:

1. Get API key from https://brave.com/search/api/
2. Set `BRAVE_API_KEY` environment variable
3. Add configuration to `.mcp.json`

**Usage Limits**: Check your API plan (e.g., 2000 requests/month for free tier)

---

### Filesystem Access

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-filesystem", "/path/to/allowed/directory"]
    }
  }
}
```

**Security Note**: Only expose directories that Claude should access.

---

### PostgreSQL Database

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-postgres"],
      "env": {
        "POSTGRES_HOST": "${POSTGRES_HOST}",
        "POSTGRES_PORT": "${POSTGRES_PORT}",
        "POSTGRES_USER": "${POSTGRES_USER}",
        "POSTGRES_PASSWORD": "${POSTGRES_PASSWORD}",
        "POSTGRES_DATABASE": "${POSTGRES_DATABASE}"
      }
    }
  }
}
```

**Security Note**: Use read-only credentials when possible.

---

### GitHub

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

**Setup**:

1. Create Personal Access Token with required scopes
2. Set `GITHUB_TOKEN` environment variable

---

### Slack

```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-slack"],
      "env": {
        "SLACK_TOKEN": "${SLACK_TOKEN}",
        "SLACK_TEAM_ID": "${SLACK_TEAM_ID}"
      }
    }
  }
}
```

---

### Custom Python Server

```json
{
  "mcpServers": {
    "custom-tool": {
      "command": "python",
      "args": ["-m", "my_mcp_server"],
      "env": {
        "PYTHONPATH": "${workspaceFolder}/src"
      }
    }
  }
}
```

---

## Environment Variables

### Using .env Files

Store sensitive values in `.env` (gitignored):

```bash
# .env
BRAVE_API_KEY=your-api-key-here
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
POSTGRES_PASSWORD=secret
```

### Variable Syntax

In `.mcp.json`, reference environment variables:

```json
{
  "env": {
    "API_KEY": "${API_KEY}"
  }
}
```

---

## Security Best Practices

### Do

- ✅ Use environment variables for secrets
- ✅ Add `.mcp.json` to `.gitignore` if it contains secrets
- ✅ Use minimal permissions for API tokens
- ✅ Use read-only database credentials when possible
- ✅ Restrict filesystem access to necessary directories

### Don't

- ❌ Hardcode API keys in configuration
- ❌ Commit secrets to version control
- ❌ Grant write access unnecessarily
- ❌ Expose entire filesystem
- ❌ Use production credentials in development

---

## Multiple Environments

### Development

```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-postgres"],
      "env": {
        "POSTGRES_HOST": "localhost",
        "POSTGRES_DATABASE": "myapp_dev"
      }
    }
  }
}
```

### Production

Use different configuration file or environment variables for production.

---

## Troubleshooting

### Server Not Starting

1. Check if command exists: `which npx`
2. Verify environment variables are set
3. Check server logs in Claude Code output
4. Test command manually in terminal

### Permission Errors

1. Verify API key/token is valid
2. Check token scopes/permissions
3. Verify network access

### Connection Issues

1. Check network connectivity
2. Verify host/port configuration
3. Check firewall settings

---

## Creating Custom MCP Servers

### Python Example

```python
# my_mcp_server/__main__.py
from mcp.server import MCPServer
from mcp.tool import Tool

server = MCPServer("my-custom-server")

@server.tool("my_tool")
async def my_tool(param: str) -> str:
    """Description of what this tool does."""
    return f"Processed: {param}"

if __name__ == "__main__":
    server.run()
```

### Configuration

```json
{
  "mcpServers": {
    "my-custom": {
      "command": "python",
      "args": ["-m", "my_mcp_server"]
    }
  }
}
```

---

## Template Configuration

### Minimal Setup

```json
{
  "mcpServers": {}
}
```

### Common Development Setup

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-brave-search"],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-filesystem", "${workspaceFolder}"]
    }
  }
}
```

### Full Development Setup

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-brave-search"],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-filesystem", "${workspaceFolder}"]
    },
    "database": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-postgres"],
      "env": {
        "POSTGRES_HOST": "${POSTGRES_HOST:-localhost}",
        "POSTGRES_PORT": "${POSTGRES_PORT:-5432}",
        "POSTGRES_USER": "${POSTGRES_USER}",
        "POSTGRES_PASSWORD": "${POSTGRES_PASSWORD}",
        "POSTGRES_DATABASE": "${POSTGRES_DATABASE}"
      }
    }
  }
}
```

---

## Related Files

| File           | Purpose                            |
| -------------- | ---------------------------------- |
| `.mcp.json`    | MCP server configuration           |
| `.env`         | Environment variables (gitignored) |
| `.env.example` | Template for required variables    |

### .env.example Template

```bash
# MCP Server Configuration
# Copy to .env and fill in values

# Brave Search API
BRAVE_API_KEY=

# GitHub Access
GITHUB_TOKEN=

# Database (if using postgres MCP)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
```

---

_See Claude Code documentation for latest MCP server options._
_See [POLICIES/security.md](POLICIES/security.md) for credential management._
