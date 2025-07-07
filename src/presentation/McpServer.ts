import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SearchUseCase } from '../application/usecases/SearchUseCase.js';
import { TeamUseCase } from '../application/usecases/TeamUseCase.js';
import { ItemUseCase } from '../application/usecases/ItemUseCase.js';

export class NuclinoMcpServer {
  private server: McpServer;

  constructor(
    private searchUseCase: SearchUseCase,
    private teamUseCase: TeamUseCase,
    private itemUseCase: ItemUseCase
  ) {
    this.server = new McpServer({
      name: "nuclino-server",
      version: "1.0.0"
    });
    this.setupTools();
  }

  private setupTools() {
    this.setupEchoTool();
    this.setupSearchTools();
    this.setupTeamTools();
    this.setupItemTool();
  }

  private setupEchoTool() {
    this.server.tool("echo", "Echo tool that prefixes input with 'you are a '", {
      text: z.string().describe("Text to echo")
    }, async (args) => {
      return {
        content: [
          {
            type: "text",
            text: `you are a ${args.text}`
          }
        ]
      };
    });
  }

  private setupSearchTools() {
    this.server.tool("search_by_team", "Search Nuclino content within a specific team", {
      query: z.string().describe("The search query to find matching content"),
      teamId: z.string().describe("The team ID to search within"),
      after: z.string().optional().describe("Pagination cursor for next page")
    }, async (args) => {
      try {
        const result = await this.searchUseCase.searchByTeam(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });

    this.server.tool("search_by_workspace", "Search Nuclino content within a specific workspace", {
      query: z.string().describe("The search query to find matching content"),
      workspaceId: z.string().describe("The workspace ID to search within"),
      after: z.string().optional().describe("Pagination cursor for next page")
    }, async (args) => {
      try {
        const result = await this.searchUseCase.searchByWorkspace(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });
  }

  private setupTeamTools() {
    this.server.tool("get_teams", "Get all teams", {}, async () => {
      try {
        const teams = await this.teamUseCase.getTeams();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(teams, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });

    this.server.tool("get_workspaces", "Get all workspaces", {}, async () => {
      try {
        const workspaces = await this.teamUseCase.getWorkspaces();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(workspaces, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });

    this.server.tool("find_team_by_name", "Find team by name", {
      name: z.string().describe("Team name to search for")
    }, async (args) => {
      try {
        const team = await this.teamUseCase.findTeamByName(args.name);
        return {
          content: [
            {
              type: "text",
              text: team ? JSON.stringify(team, null, 2) : "Team not found"
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });

    this.server.tool("find_workspace_by_name", "Find workspace by name", {
      name: z.string().describe("Workspace name to search for")
    }, async (args) => {
      try {
        const workspace = await this.teamUseCase.findWorkspaceByName(args.name);
        return {
          content: [
            {
              type: "text",
              text: workspace ? JSON.stringify(workspace, null, 2) : "Workspace not found"
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });
  }

  private setupItemTool() {
    this.server.tool("get_item", "Get a specific item by ID", {
      itemId: z.string().describe("The item ID to retrieve")
    }, async (args) => {
      try {
        const item = await this.itemUseCase.getItem(args.itemId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(item, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });
  }

  getServer(): McpServer {
    return this.server;
  }
}