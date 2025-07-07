import { INuclinoRepository } from '../../domain/services/INuclinoRepository.js';
import { Team, Workspace } from '../../domain/entities/Team.js';

export class TeamUseCase {
  constructor(private nuclinoRepository: INuclinoRepository) {}

  async getTeams(): Promise<Team[]> {
    return await this.nuclinoRepository.getTeams();
  }

  async getWorkspaces(): Promise<Workspace[]> {
    return await this.nuclinoRepository.getWorkspaces();
  }

  async findTeamByName(name: string): Promise<Team | undefined> {
    const teams = await this.getTeams();
    return teams.find(team => team.name.toLowerCase().includes(name.toLowerCase()));
  }

  async findWorkspaceByName(name: string): Promise<Workspace | undefined> {
    const workspaces = await this.getWorkspaces();
    return workspaces.find(workspace => workspace.name.toLowerCase().includes(name.toLowerCase()));
  }
}