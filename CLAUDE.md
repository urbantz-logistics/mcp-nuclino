# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a streamable HTTP MCP (Model Context Protocol) server built with TypeScript and Express. The server provides a simple echo tool that prefixes input with "you are a ".

## Development Commands

- `npm install` - Install dependencies
- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Run in development mode with ts-node
- `npm start` - Start the production server
- `npm run clean` - Clean build artifacts

## Docker Commands

- `docker build -t nuclino-mcp-server .` - Build Docker image
- `docker run -d -p 3000:3000 --name nuclino-mcp-test nuclino-mcp-server` - Run container
- `docker-compose up -d` - Run with docker-compose
- `docker logs nuclino-mcp-test` - View container logs

## Architecture

The server uses the MCP TypeScript SDK with streamable HTTP support. Key components include:

- **Server**: Express.js HTTP server
- **Transport**: Streamable HTTP for real-time client-server communication

## Available Tools

## Testing

## Deployment

The server is containerized and can be deployed to any Docker-compatible environment. The container exposes port 3000