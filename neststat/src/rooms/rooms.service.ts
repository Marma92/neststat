import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './room.entity';
import { StoriesService } from '../stories/stories.service';
import { BuildingsService } from '../buildings/buildings.service';
import { UserRole } from '../users/user.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
    private storiesService: StoriesService,
    private buildingsService: BuildingsService,
  ) {}

  async findAllForStory(storyId: number, userId: number): Promise<Room[]> {
    const story = await this.storiesService.findOne(storyId, userId);
    void story;
    return this.roomsRepository.find({ where: { storyId } });
  }

  async findOne(id: number, userId: number): Promise<Room> {
    const room = await this.roomsRepository.findOne({
      where: { id },
      relations: ['story', 'story.building'],
    });
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    await this.buildingsService.findOne(room.story.buildingId, userId);
    return room;
  }

  async create(
    storyId: number,
    data: { name: string; description?: string; capacity?: number },
    userId: number,
    userRole: UserRole,
  ): Promise<Room> {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can create rooms');
    }
    const story = await this.storiesService.findOne(storyId, userId);
    void story;
    const room = this.roomsRepository.create({
      name: data.name,
      description: data.description,
      capacity: data.capacity ?? 1,
      storyId,
    });
    return this.roomsRepository.save(room);
  }

  async update(
    id: number,
    userId: number,
    userRole: UserRole,
    data: { name?: string; description?: string; capacity?: number },
  ): Promise<Room> {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can update rooms');
    }
    const room = await this.findOne(id, userId);
    if (data.name) room.name = data.name;
    if (data.description !== undefined) room.description = data.description;
    if (data.capacity) room.capacity = data.capacity;
    return this.roomsRepository.save(room);
  }

  async delete(id: number, userId: number, userRole: UserRole): Promise<void> {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can delete rooms');
    }
    const room = await this.findOne(id, userId);
    await this.roomsRepository.remove(room);
  }
}
