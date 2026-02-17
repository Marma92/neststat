import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RoomsService } from './rooms.service';
import { Room } from './room.entity';
import { UserRole } from '../users/user.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { StoriesService } from '../stories/stories.service';
import { BuildingsService } from '../buildings/buildings.service';

describe('RoomsService', () => {
  let service: RoomsService;
  let roomRepo: any;
  let storiesService: StoriesService;
  let buildingsService: BuildingsService;

  const mockRoomRepo = {
    find: jest.fn(),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    save: jest.fn().mockResolvedValue(null),
    remove: jest.fn().mockResolvedValue(null),
  };

  const mockStoriesService = {
    findOne: jest.fn(),
  };

  const mockBuildingsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: getRepositoryToken(Room), useValue: mockRoomRepo },
        { provide: StoriesService, useValue: mockStoriesService },
        { provide: BuildingsService, useValue: mockBuildingsService },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    roomRepo = module.get(getRepositoryToken(Room));
    storiesService = module.get(StoriesService);
    buildingsService = module.get(BuildingsService);
    jest.clearAllMocks();
    mockRoomRepo.findOne.mockResolvedValue(null);
    mockRoomRepo.save.mockResolvedValue(null);
    mockStoriesService.findOne.mockReset();
    mockBuildingsService.findOne.mockReset();
  });

  describe('findAllForStory', () => {
    it('should return rooms for a story', async () => {
      const mockRooms = [{ id: 1, name: 'Room 1' }];
      mockStoriesService.findOne.mockResolvedValue({ id: 1 });
      mockRoomRepo.find.mockResolvedValue(mockRooms);

      const result = await service.findAllForStory(1, 1);

      expect(result).toEqual(mockRooms);
    });
  });

  describe('findOne', () => {
    it('should return a room by id', async () => {
      const mockRoom = { id: 1, name: 'Room 1', story: { buildingId: 1 } };
      mockRoomRepo.findOne.mockResolvedValue(mockRoom);
      mockBuildingsService.findOne.mockResolvedValue({});

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockRoom);
    });

    it('should throw NotFoundException when room not found', async () => {
      mockRoomRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a room for admin', async () => {
      mockStoriesService.findOne.mockResolvedValue({ id: 1 });
      const mockRoom = { id: 1, name: 'New Room', capacity: 10 };
      mockRoomRepo.create.mockReturnValue(mockRoom);
      mockRoomRepo.save.mockResolvedValue(mockRoom);

      const result = await service.create(1, { name: 'New Room', capacity: 10 }, 1, UserRole.ADMIN);

      expect(result).toEqual(mockRoom);
    });

    it('should throw ForbiddenException for non-admin', async () => {
      await expect(
        service.create(1, { name: 'Room' }, 1, UserRole.USER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple rooms for admin', async () => {
      mockStoriesService.findOne.mockResolvedValue({ id: 1 });
      const mockRooms = [
        { id: 1, name: 'Room 1' },
        { id: 2, name: 'Room 2' },
      ];
      mockRoomRepo.create.mockReturnValue(mockRooms[0]);
      mockRoomRepo.save.mockResolvedValueOnce(mockRooms[0]).mockResolvedValueOnce(mockRooms[1]);

      const result = await service.bulkCreate(
        1,
        [{ name: 'Room 1' }, { name: 'Room 2' }],
        1,
        UserRole.ADMIN,
      );

      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException for non-admin', async () => {
      await expect(
        service.bulkCreate(1, [{ name: 'Room' }], 1, UserRole.USER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update a room for admin', async () => {
      const mockRoom = { id: 1, name: 'Old Name', story: { buildingId: 1 } };
      mockRoomRepo.findOne = jest.fn().mockResolvedValue(mockRoom);
      mockBuildingsService.findOne = jest.fn().mockResolvedValue({});
      mockRoomRepo.save = jest.fn().mockResolvedValue({ ...mockRoom, name: 'New Name' });

      const result = await service.update(1, 1, UserRole.ADMIN, { name: 'New Name' });

      expect(result.name).toBe('New Name');
    });

    it('should throw ForbiddenException for non-admin', async () => {
      await expect(
        service.update(1, 1, UserRole.USER, { name: 'New Name' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete a room for admin', async () => {
      const mockRoom = { id: 1, name: 'Room', story: { buildingId: 1 } };
      mockRoomRepo.findOne.mockResolvedValue(mockRoom);
      mockBuildingsService.findOne.mockResolvedValue({});
      mockRoomRepo.remove.mockResolvedValue(mockRoom);

      await service.delete(1, 1, UserRole.ADMIN);

      expect(mockRoomRepo.remove).toHaveBeenCalledWith(mockRoom);
    });

    it('should throw ForbiddenException for non-admin', async () => {
      await expect(service.delete(1, 1, UserRole.USER)).rejects.toThrow(ForbiddenException);
    });
  });
});
