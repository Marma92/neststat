import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Building } from './building.entity';

@Injectable()
export class BuildingsService {
  constructor(
    @InjectRepository(Building)
    private buildingsRepository: Repository<Building>,
  ) {}

  async findAllForUser(userId: number): Promise<Building[]> {
    return this.buildingsRepository
      .createQueryBuilder('building')
      .innerJoin('building.users', 'user', 'user.id = :userId', { userId })
      .leftJoinAndSelect('building.company', 'company')
      .getMany();
  }

  async findOne(id: number, userId: number): Promise<Building> {
    const building = await this.buildingsRepository
      .createQueryBuilder('building')
      .innerJoin('building.users', 'user', 'user.id = :userId', { userId })
      .leftJoinAndSelect('building.company', 'company')
      .where('building.id = :id', { id })
      .getOne();

    if (!building) {
      throw new NotFoundException(`Building with ID ${id} not found`);
    }
    return building;
  }

  async create(
    name: string,
    companyId: number,
    address: string | undefined,
    userId: number,
  ): Promise<Building> {
    const building = this.buildingsRepository.create({
      name,
      companyId,
      address: address ?? undefined,
    });
    const savedBuilding = await this.buildingsRepository.save(building);

    await this.buildingsRepository
      .createQueryBuilder()
      .relation(Building, 'users')
      .of(savedBuilding)
      .add(userId);

    return savedBuilding;
  }

  async update(
    id: number,
    userId: number,
    data: { name?: string; address?: string },
  ): Promise<Building> {
    const building = await this.findOne(id, userId);

    if (data.name) building.name = data.name;
    if (data.address !== undefined) building.address = data.address;

    return this.buildingsRepository.save(building);
  }

  async delete(id: number, userId: number): Promise<void> {
    const building = await this.findOne(id, userId);
    await this.buildingsRepository.remove(building);
  }

  async addUser(
    buildingId: number,
    userId: number,
    currentUserId: number,
  ): Promise<Building> {
    const building = await this.findOne(buildingId, currentUserId);

    await this.buildingsRepository
      .createQueryBuilder()
      .relation(Building, 'users')
      .of(building)
      .add(userId);

    return building;
  }

  async removeUser(
    buildingId: number,
    userId: number,
    currentUserId: number,
  ): Promise<Building> {
    const building = await this.findOne(buildingId, currentUserId);

    await this.buildingsRepository
      .createQueryBuilder()
      .relation(Building, 'users')
      .of(building)
      .remove(userId);

    return building;
  }
}
