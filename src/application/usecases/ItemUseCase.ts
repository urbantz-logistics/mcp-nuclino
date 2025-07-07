import { INuclinoRepository } from '../../domain/services/INuclinoRepository.js';
import { Item } from '../../domain/entities/Team.js';

export class ItemUseCase {
  constructor(private nuclinoRepository: INuclinoRepository) {}

  async getItem(itemId: string): Promise<Item> {
    return await this.nuclinoRepository.getItem(itemId);
  }
}