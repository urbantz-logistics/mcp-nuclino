import { Team, Workspace, Item, User } from '../entities/Team.js';
import { SearchResponse } from '../entities/SearchResult.js';

export interface SearchByTeamParams {
  query: string;
  teamId: string;
  after?: string;
}

export interface SearchByWorkspaceParams {
  query: string;
  workspaceId: string;
  after?: string;
}

export interface INuclinoRepository {
  searchByTeam(params: SearchByTeamParams): Promise<SearchResponse>;
  searchByWorkspace(params: SearchByWorkspaceParams): Promise<SearchResponse>;
  getTeams(): Promise<Team[]>;
  getWorkspaces(): Promise<Workspace[]>;
  getItem(itemId: string): Promise<Item>;
  getUsers(): Promise<User[]>;
  getUser(userId: string): Promise<User>;
  updateApiKey(newApiKey: string): void;
}