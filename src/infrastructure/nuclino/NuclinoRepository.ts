import { INuclinoRepository, SearchByTeamParams, SearchByWorkspaceParams } from '../../domain/services/INuclinoRepository.js';
import { Team, Workspace, Item } from '../../domain/entities/Team.js';
import { SearchResponse } from '../../domain/entities/SearchResult.js';
import { RateLimiter } from './RateLimiter.js';
import { RetryHandler } from './RetryHandler.js';
import { logger } from '../http/Logger.js';

export class NuclinoRepository implements INuclinoRepository {
  private rateLimiter: RateLimiter;
  private retryHandler: RetryHandler;

  constructor(private apiKey: string) {
    this.rateLimiter = new RateLimiter(150, 1); // 150 requests per minute
    this.retryHandler = new RetryHandler({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2
    });
  }

  updateApiKey(newApiKey: string): void {
    this.apiKey = newApiKey;
  }

  async searchByTeam(params: SearchByTeamParams): Promise<SearchResponse> {
    return this.retryHandler.execute(async () => {
      const searchParams = new URLSearchParams();
      searchParams.append('search', params.query);
      searchParams.append('teamId', params.teamId);
      if (params.after) {
        searchParams.append('after', params.after);
      }

      const response = await this.makeRequest(`/v0/items?${searchParams.toString()}`);
      return this.parseSearchResponse(response);
    }, 'searchByTeam');
  }

  async searchByWorkspace(params: SearchByWorkspaceParams): Promise<SearchResponse> {
    return this.retryHandler.execute(async () => {
      const searchParams = new URLSearchParams();
      searchParams.append('search', params.query);
      searchParams.append('workspaceId', params.workspaceId);
      if (params.after) {
        searchParams.append('after', params.after);
      }

      const response = await this.makeRequest(`/v0/items?${searchParams.toString()}`);
      return this.parseSearchResponse(response);
    }, 'searchByWorkspace');
  }

  async getTeams(): Promise<Team[]> {
    return this.retryHandler.execute(async () => {
      const response = await this.makeRequest('/v0/teams');
      return response.results.map((team: any) => ({
        id: team.id,
        name: team.name,
        description: team.description
      }));
    }, 'getTeams');
  }

  async getWorkspaces(): Promise<Workspace[]> {
    return this.retryHandler.execute(async () => {
      const response = await this.makeRequest('/v0/workspaces');
      return response.results.map((workspace: any) => ({
        id: workspace.id,
        name: workspace.name,
        teamId: workspace.teamId,
        description: workspace.description
      }));
    }, 'getWorkspaces');
  }

  async getItem(itemId: string): Promise<Item> {
    return this.retryHandler.execute(async () => {
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
    }, 'getItem');
  }

  private async makeRequest(endpoint: string): Promise<any> {
    // Wait for rate limit slot before making request
    await this.rateLimiter.waitForSlot();

    logger.info('Making Nuclino API request', {
      endpoint,
      rateLimitRequests: this.rateLimiter.getRequestCount()
    });

    const response = await fetch(`https://api.nuclino.com${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    logger.info('Received Nuclino API response', {
      endpoint,
      status: response.status,
      statusText: response.statusText
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