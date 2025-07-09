import { INuclinoRepository, SearchByTeamParams, SearchByWorkspaceParams } from '../../domain/services/INuclinoRepository.js';
import { Team, Workspace, Item, User } from '../../domain/entities/Team.js';
import { SearchResponse } from '../../domain/entities/SearchResult.js';
import { RateLimiter } from './RateLimiter.js';
import { RetryHandler } from './RetryHandler.js';
import { contextLogger as logger } from '../http/Logger.js';

export class NuclinoRepository implements INuclinoRepository {
  constructor(
    private apiKey: string,
    private rateLimiter: RateLimiter,
    private retryHandler: RetryHandler
  ) {}

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

  async getUsers(): Promise<User[]> {
    return this.retryHandler.execute(async () => {
      const response = await this.makeRequest('/v0/users');
      logger.info('Raw users response', { response });
      
      if (!response.data?.results) {
        logger.error('No results in users response', { response });
        throw new Error('Invalid API response format: missing results array');
      }
      
      return response.data.results.map((user: any) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatarUrl: user.avatarUrl
      }));
    }, 'getUsers');
  }

  async getUser(userId: string): Promise<User> {
    return this.retryHandler.execute(async () => {
      const response = await this.makeRequest(`/v0/users/${userId}`);
      logger.info('Raw user response', { response });

      if (!response.data) {
        logger.error('No data in getUser response', { response });
        throw new Error('Invalid API response format: missing data');
      }
      return {
        id: response.data.id,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        email: response.data.email,
        avatarUrl: response.data.avatarUrl
      };
    }, 'getUser');
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