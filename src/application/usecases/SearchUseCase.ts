import { INuclinoRepository, SearchByTeamParams, SearchByWorkspaceParams } from '../../domain/services/INuclinoRepository.js';
import { SearchResponse } from '../../domain/entities/SearchResult.js';

export class SearchUseCase {
  constructor(private nuclinoRepository: INuclinoRepository) {}

  async searchByTeam(params: SearchByTeamParams): Promise<SearchResponse> {
    return await this.nuclinoRepository.searchByTeam(params);
  }

  async searchByWorkspace(params: SearchByWorkspaceParams): Promise<SearchResponse> {
    return await this.nuclinoRepository.searchByWorkspace(params);
  }
}