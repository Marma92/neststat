import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from './story.entity';
import { BuildingsService } from '../buildings/buildings.service';
import { UserRole } from '../users/user.entity';

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(Story)
    private storiesRepository: Repository<Story>,
    private buildingsService: BuildingsService,
  ) {}

  async findAllForBuilding(
    buildingId: number,
    userId: number,
  ): Promise<Story[]> {
    await this.buildingsService.findOne(buildingId, userId);
    return this.storiesRepository.find({
      where: { buildingId },
      relations: ['rooms'],
    });
  }

  async findOne(id: number, userId: number): Promise<Story> {
    const story = await this.storiesRepository.findOne({
      where: { id },
      relations: ['building', 'rooms'],
    });
    if (!story) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }
    await this.buildingsService.findOne(story.buildingId, userId);
    return story;
  }

  async create(
    buildingId: number,
    name: string,
    floor: number,
    userId: number,
    userRole: UserRole,
  ): Promise<Story> {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can create stories');
    }
    await this.buildingsService.findOne(buildingId, userId);
    const story = this.storiesRepository.create({ name, floor, buildingId });
    return this.storiesRepository.save(story);
  }

  async update(
    id: number,
    userId: number,
    userRole: UserRole,
    data: { name?: string; floor?: number },
  ): Promise<Story> {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can update stories');
    }
    const story = await this.findOne(id, userId);
    if (data.name) story.name = data.name;
    if (data.floor) story.floor = data.floor;
    return this.storiesRepository.save(story);
  }

  async delete(id: number, userId: number, userRole: UserRole): Promise<void> {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can delete stories');
    }
    const story = await this.findOne(id, userId);
    await this.storiesRepository.remove(story);
  }
}
