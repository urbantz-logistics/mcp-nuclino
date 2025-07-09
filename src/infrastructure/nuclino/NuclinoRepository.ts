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
      logger.info('Raw teams response', { response });
      
      if (!response.data?.results) {
        logger.error('No results in teams response', { response });
        throw new Error('Invalid API response format: missing results array');
      }
      
      return response.data.results.map((team: any) => ({
        id: team.id,
        name: team.name,
        description: team.description
      }));
    }, 'getTeams');
  }

  async getWorkspaces(): Promise<Workspace[]> {
    return this.retryHandler.execute(async () => {
      const response = await this.makeRequest('/v0/workspaces');
      logger.info('Raw workspaces response', { response });
      
      if (!response.data?.results) {
        logger.error('No results in workspaces response', { response });
        throw new Error('Invalid API response format: missing results array');
      }
      return response.data.results.map((workspace: any) => ({
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
      logger.info('Raw item response', { response });

      if (!response.data) {
        logger.error('No data in getItem response', { response });
        throw new Error('Invalid API response format: missing data');
      }
      return {
        id: response.data.id,
        title: response.data.title,
        content: response.data.content,
        url: response.data.url,
        workspaceId: response.data.workspaceId,
        createdAt: response.data.createdAt,
        updatedAt: response.data.lastUpdatedAt
      };

    }, 'getItem');
  }

  private async makeRequest(endpoint: string): Promise<any> {
    // Wait for rate limit slot before making request
    await this.rateLimiter.waitForSlot();

    logger.info('Making Nuclino API request', {
      endpoint,
      rateLimitRequests: this.rateLimiter.getRequestCount(),
      headers: {
        'Authorization': '[REDACTED]',
        'Content-Type': 'application/json'
      }
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
    if (!response.data?.results) {
      logger.error('No results in search response', { response });
      throw new Error('Invalid API response format: missing results array');
    }
    
    return {
      results: response.data.results.map((item: any) => ({
        id: item.id,
        title: item.title,
        url: item.url,
      })),
      hasMore: response.hasMore || false,
      nextCursor: response.nextCursor
    };
  }
}