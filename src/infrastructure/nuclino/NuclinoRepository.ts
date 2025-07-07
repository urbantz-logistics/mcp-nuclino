import { INuclinoRepository, SearchByTeamParams, SearchByWorkspaceParams } from '../../domain/services/INuclinoRepository.js';
import { Team, Workspace, Item } from '../../domain/entities/Team.js';
import { SearchResponse } from '../../domain/entities/SearchResult.js';

export class NuclinoRepository implements INuclinoRepository {
  constructor(private apiKey: string) {}

  async searchByTeam(params: SearchByTeamParams): Promise<SearchResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('search', params.query);
    searchParams.append('teamId', params.teamId);
    if (params.after) {
      searchParams.append('after', params.after);
    }

    const response = await this.makeRequest(`/v0/items?${searchParams.toString()}`);
    return this.parseSearchResponse(response);
  }

  async searchByWorkspace(params: SearchByWorkspaceParams): Promise<SearchResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('search', params.query);
    searchParams.append('workspaceId', params.workspaceId);
    if (params.after) {
      searchParams.append('after', params.after);
    }

    const response = await this.makeRequest(`/v0/items?${searchParams.toString()}`);
    return this.parseSearchResponse(response);
  }

  async getTeams(): Promise<Team[]> {
    const response = await this.makeRequest('/v0/teams');
    return response.results.map((team: any) => ({
      id: team.id,
      name: team.name,
      description: team.description
    }));
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const response = await this.makeRequest('/v0/workspaces');
    return response.results.map((workspace: any) => ({
      id: workspace.id,
      name: workspace.name,
      teamId: workspace.teamId,
      description: workspace.description
    }));
  }

  async getItem(itemId: string): Promise<Item> {
    const response = await this.makeRequest(`/v0/items/${itemId}`);
    return {
      id: response.id,
      title: response.title,
      content: response.content,
      url: response.url,
      workspaceId: response.workspaceId,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    };
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const response = await fetch(`https://api.nuclino.com${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Nuclino API request failed with status ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  private parseSearchResponse(response: any): SearchResponse {
    return {
      results: response.results.map((item: any) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        excerpt: item.excerpt
      })),
      hasMore: response.hasMore || false,
      nextCursor: response.nextCursor
    };
  }
}