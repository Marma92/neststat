import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StoriesService } from './stories.service';
import { Story } from './story.entity';
import { UserRole } from '../users/user.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BuildingsService } from '../buildings/buildings.service';

describe('StoriesService', () => {
  let service: StoriesService;
  let storyRepo: any;
  let buildingsService: BuildingsService;

  const mockStoryRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockBuildingsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoriesService,
        { provide: getRepositoryToken(Story), useValue: mockStoryRepo },
        { provide: BuildingsService, useValue: mockBuildingsService },
      ],
    }).compile();

    service = module.get<StoriesService>(StoriesService);
    storyRepo = module.get(getRepositoryToken(Story));
    buildingsService = module.get(BuildingsService);
    jest.clearAllMocks();
  });

  describe('findAllForBuilding', () => {
    it('should return stories for a building', async () => {
      const mockStories = [{ id: 1, name: 'Floor 1' }];
      mockBuildingsService.findOne.mockResolvedValue({ id: 1 });
      mockStoryRepo.find.mockResolvedValue(mockStories);

      const result = await service.findAllForBuilding(1, 1);

      expect(result).toEqual(mockStories);
    });
  });

  describe('findOne', () => {
    it('should return a story by id', async () => {
      const mockStory = { id: 1, name: 'Floor 1', building: { id: 1 } };
      mockStoryRepo.findOne.mockResolvedValue(mockStory);
      mockBuildingsService.findOne.mockResolvedValue({});

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockStory);
    });

    it('should throw NotFoundException when story not found', async () => {
      mockStoryRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a story for admin', async () => {
      mockBuildingsService.findOne.mockResolvedValue({ id: 1 });
      const mockStory = { id: 1, name: 'Floor 1', floor: 1 };
      mockStoryRepo.create.mockReturnValue(mockStory);
      mockStoryRepo.save.mockResolvedValue(mockStory);

      const result = await service.create(1, 'Floor 1', 1, 1, UserRole.ADMIN);

      expect(result).toEqual(mockStory);
    });

    it('should throw ForbiddenException for non-admin', async () => {
      await expect(
        service.create(1, 'Floor 1', 1, 1, UserRole.USER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update a story for admin', async () => {
      const mockStory = { id: 1, name: 'Old Name', building: { id: 1 } };
      mockStoryRepo.findOne.mockResolvedValue(mockStory);
      mockBuildingsService.findOne.mockResolvedValue({});
      mockStoryRepo.save.mockResolvedValue({ ...mockStory, name: 'New Name' });

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
    it('should delete a story for admin', async () => {
      const mockStory = { id: 1, name: 'Floor', building: { id: 1 } };
      mockStoryRepo.findOne.mockResolvedValue(mockStory);
      mockBuildingsService.findOne.mockResolvedValue({});
      mockStoryRepo.remove.mockResolvedValue(mockStory);

      await service.delete(1, 1, UserRole.ADMIN);

      expect(mockStoryRepo.remove).toHaveBeenCalledWith(mockStory);
    });

    it('should throw ForbiddenException for non-admin', async () => {
      await expect(service.delete(1, 1, UserRole.USER)).rejects.toThrow(ForbiddenException);
    });
  });
});
