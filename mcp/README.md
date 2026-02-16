# Track MCP Server

Model Context Protocol server exposing Track's task, note, and project management capabilities to AI agents and external applications.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   AI Agent /    │────▶│   MCP Server     │────▶│   Track API     │
│   External App  │ MCP │  (/mcp routes)   │ JWT │  (/api routes)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │                         │
                              └─────────┬───────────────┘
                                        ▼
                                  ┌──────────────┐
                                  │   MongoDB    │
                                  └──────────────┘
```

## OAuth 2.0 Flow

External applications connect via OAuth 2.0 Authorization Code flow:

```mermaid
sequenceDiagram
    participant User
    participant App as External App<br/>(e.g., Clawdbot)
    participant MCP as MCP Server<br/>(/mcp/oauth/*)
    participant API as Track API<br/>(/api/auth/*)
    participant DB as MongoDB

    Note over User,DB: 1. App Registration (one-time setup)
    App->>MCP: POST /mcp/oauth/register<br/>{name, redirect_uri}
    MCP->>DB: Store app credentials
    MCP-->>App: {client_id, client_secret}

    Note over User,DB: 2. User Authorization (first connection)
    User->>App: "Connect to Track"
    App->>User: Redirect to /mcp/oauth/authorize<br/>?client_id=...&redirect_uri=...&state=...
    User->>MCP: GET /mcp/oauth/authorize
    MCP-->>User: Login page (Track credentials)
    User->>MCP: POST /mcp/oauth/authorize<br/>{username, password, approve}
    MCP->>API: Validate credentials
    API-->>MCP: User valid
    MCP->>DB: Create authorization code
    MCP-->>User: Redirect to redirect_uri?code=...&state=...
    User->>App: Authorization code received

    Note over User,DB: 3. Token Exchange
    App->>MCP: POST /mcp/oauth/token<br/>{code, client_id, client_secret}
    MCP->>DB: Validate code, create access token
    MCP-->>App: {access_token, refresh_token, expires_in}

    Note over User,DB: 4. API Access (ongoing)
    App->>MCP: MCP Tool Call<br/>Authorization: Bearer {access_token}
    MCP->>DB: Validate token, get user
    MCP->>API: Execute action as user
    API-->>MCP: Result
    MCP-->>App: Tool response

    Note over User,DB: 5. Token Refresh (when expired)
    App->>MCP: POST /mcp/oauth/token<br/>{refresh_token, grant_type=refresh_token}
    MCP->>DB: Validate refresh token
    MCP-->>App: {access_token, refresh_token, expires_in}
```

## Exposed Tools

### Tasks
- `list_tasks` - List tasks with optional filters (project, status, assignee)
- `get_task` - Get a single task by ID
- `create_task` - Create a new task
- `update_task` - Update task fields (title, description, status, due date, etc.)
- `complete_task` - Mark a task as complete
- `delete_task` - Delete a task

### Notes
- `list_notes` - List notes with optional filters (project, search)
- `get_note` - Get a single note by ID
- `create_note` - Create a new note
- `update_note` - Update note content
- `delete_note` - Delete a note

### Projects
- `list_projects` - List all projects for the user
- `get_project` - Get project details
- `create_project` - Create a new project
- `update_project` - Update project details

## Endpoints

### OAuth
- `POST /mcp/oauth/register` - Register a new application
- `GET /mcp/oauth/authorize` - Authorization page
- `POST /mcp/oauth/authorize` - Submit authorization
- `POST /mcp/oauth/token` - Exchange code for token / refresh token
- `POST /mcp/oauth/revoke` - Revoke a token

### MCP Protocol
- `POST /mcp/` - MCP JSON-RPC endpoint
- `GET /mcp/tools` - List available tools (for discovery)
- `GET /mcp/health` - Health check
