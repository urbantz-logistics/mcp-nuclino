import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { INuclinoRepository } from '../domain/services/INuclinoRepository.js';

export class NuclinoMcpServer {
  private server: McpServer;

  constructor(
    private nuclinoRepository: INuclinoRepository
  ) {
    this.server = new McpServer({
      name: "nuclino-server",
      version: "1.0.0"
    });
    this.setupTools();
  }

  private setupTools() {
    this.setupSearchTools();
    this.setupTeamTools();
    this.setupItemTool();
  }


  private setupSearchTools() {
    this.server.tool("search_by_team", "Search Nuclino content within a specific team. Use this when you don't know which workspace to search in - first get teams with get_teams, then use the first team's ID. Of course, if you have notion of which team to search in, you can see if there's a match there.", {
      query: z.string().describe("The search query to find matching content"),
      teamId: z.string().describe("The team ID to search within (get this from get_teams first)"),
      after: z.string().optional().describe("Pagination cursor for next page")
    }, async (args) => {
      try {
        const result = await this.nuclinoRepository.searchByTeam(args);
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

    this.server.tool("search_by_workspace", "Search Nuclino content within a specific workspace. Use this when you know which workspace to search in - first get workspaces with get_workspaces or find by name with find_workspace_by_name.", {
      query: z.string().describe("The search query to find matching content"),
      workspaceId: z.string().describe("The workspace ID to search within (get this from get_workspaces or find_workspace_by_name first)"),
      after: z.string().optional().describe("Pagination cursor for next page")
    }, async (args) => {
      try {
        const result = await this.nuclinoRepository.searchByWorkspace(args);
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
    this.server.tool("get_teams", "Get all teams available to the current user. Use this first to get team IDs for search_by_team. Most users have only one team.", {}, async () => {
      try {
        const teams = await this.nuclinoRepository.getTeams();
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

    this.server.tool("get_workspaces", "Get all workspaces available to the current user. Use this to get workspace IDs for search_by_workspace.", {}, async () => {
      try {
        const workspaces = await this.nuclinoRepository.getWorkspaces();
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
        const teams = await this.nuclinoRepository.getTeams();
        const team = teams.find(team => team.name.toLowerCase().includes(args.name.toLowerCase()));
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

    this.server.tool("find_workspace_by_name", "Find workspace by name. Use this to get workspace ID when you know the workspace name (e.g., 'Engineering', 'Product', 'Marketing').", {
      name: z.string().describe("Workspace name to search for (partial matches work)")
    }, async (args) => {
      try {
        const workspaces = await this.nuclinoRepository.getWorkspaces();
        const workspace = workspaces.find(workspace => workspace.name.toLowerCase().includes(args.name.toLowerCase()));
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
        const item = await this.nuclinoRepository.getItem(args.itemId);
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