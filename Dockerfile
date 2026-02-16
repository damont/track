# Backend build stage
FROM python:3.12-slim AS backend

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy Python project files
COPY pyproject.toml uv.lock README.md ./
COPY api/ ./api/
COPY mcp/ ./mcp/

# Sync dependencies
RUN uv sync --frozen --no-dev

# Expose port
EXPOSE 8010

# Run the application
CMD ["uv", "run", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8010"]


# MCP Server stage (sidecar)
FROM python:3.12-slim AS mcp

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy Python project files
COPY pyproject.toml uv.lock README.md ./
COPY api/ ./api/
COPY mcp/ ./mcp/

# Sync dependencies
RUN uv sync --frozen --no-dev

# Expose MCP port
EXPOSE 8011

# Run the MCP server
CMD ["uv", "run", "uvicorn", "mcp.main:app", "--host", "0.0.0.0", "--port", "8011"]


# Frontend build stage
FROM node:20-slim AS frontend-build

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY frontend/ ./

# Build
RUN npm run build


# Frontend production stage
FROM nginx:alpine AS frontend

# Copy built files
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80
