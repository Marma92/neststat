import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BuildingsService } from './buildings.service';
import { Building } from './building.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('BuildingsService', () => {
  let service: BuildingsService;
  let buildingRepo: any;

  const mockQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
  };

  const mockRelationQueryBuilder = {
    of: jest.fn().mockReturnThis(),
    add: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  const mockBuildingRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockImplementation((alias?: string) => {
      if (alias) {
        return mockQueryBuilder;
      }
      return {
        relation: jest.fn().mockReturnValue(mockRelationQueryBuilder),
      };
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuildingsService,
        { provide: getRepositoryToken(Building), useValue: mockBuildingRepo },
      ],
    }).compile();

    service = module.get<BuildingsService>(BuildingsService);
    buildingRepo = module.get(getRepositoryToken(Building));
    jest.clearAllMocks();
  });

  describe('findAllForUser', () => {
    it('should return buildings for user', async () => {
      const mockBuildings = [{ id: 1, name: 'Building 1' }];
      mockQueryBuilder.getMany.mockResolvedValue(mockBuildings);

      const result = await service.findAllForUser(1);

      expect(result).toEqual(mockBuildings);
      expect(mockBuildingRepo.createQueryBuilder).toHaveBeenCalledWith('building');
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'building.users',
        'user',
        'user.id = :userId',
        { userId: 1 },
      );
    });

    it('should return empty array when user has no buildings', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.findAllForUser(1);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a building when user has access', async () => {
      const mockBuilding = { id: 1, name: 'Building 1' };
      mockQueryBuilder.getOne.mockResolvedValue(mockBuilding);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockBuilding);
    });

    it('should throw NotFoundException when building not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new building', async () => {
      const mockBuilding = { id: 1, name: 'New Building', companyId: 1 };
      mockBuildingRepo.create.mockReturnValue(mockBuilding);
      mockBuildingRepo.save.mockResolvedValue(mockBuilding);

      const result = await service.create('New Building', 1, 'Address', 1);

      expect(result).toEqual(mockBuilding);
      expect(mockBuildingRepo.create).toHaveBeenCalledWith({
        name: 'New Building',
        companyId: 1,
        address: 'Address',
      });
      expect(mockBuildingRepo.save).toHaveBeenCalledWith(mockBuilding);
    });
  });

  describe('update', () => {
    it('should update a building', async () => {
      const mockBuilding = { id: 1, name: 'Old Name', address: 'Old Address' };
      mockQueryBuilder.getOne.mockResolvedValue(mockBuilding);
      mockBuildingRepo.save.mockResolvedValue({ ...mockBuilding, name: 'New Name' });

      const result = await service.update(1, 1, { name: 'New Name' });

      expect(result.name).toBe('New Name');
    });
  });

  describe('delete', () => {
    it('should delete a building', async () => {
      const mockBuilding = { id: 1, name: 'Building' };
      mockQueryBuilder.getOne.mockResolvedValue(mockBuilding);
      mockBuildingRepo.remove.mockResolvedValue(mockBuilding);

      await service.delete(1, 1);

      expect(mockBuildingRepo.remove).toHaveBeenCalledWith(mockBuilding);
    });
  });

  describe('addUser', () => {
    it('should add a user to building', async () => {
      const mockBuilding = { id: 1, name: 'Building' };
      mockQueryBuilder.getOne.mockResolvedValue(mockBuilding);

      const result = await service.addUser(1, 2, 1);

      expect(result).toEqual(mockBuilding);
    });
  });

  describe('removeUser', () => {
    it('should remove a user from building', async () => {
      const mockBuilding = { id: 1, name: 'Building' };
      mockQueryBuilder.getOne.mockResolvedValue(mockBuilding);

      const result = await service.removeUser(1, 2, 1);

      expect(result).toEqual(mockBuilding);
    });
  });
});
