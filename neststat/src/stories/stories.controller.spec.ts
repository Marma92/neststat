import { Test, TestingModule } from '@nestjs/testing';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { UserRole } from '../users/user.entity';
import { ForbiddenException } from '@nestjs/common';

describe('StoriesController', () => {
  let controller: StoriesController;
  let service: Partial<StoriesService>;

  const mockAdmin = { id: 1, username: 'admin', role: UserRole.ADMIN };
  const mockUser = { id: 2, username: 'user', role: UserRole.USER };

  beforeEach(async () => {
    service = {
      findAllForBuilding: jest
        .fn()
        .mockResolvedValue([{ id: 1, name: 'Story 1', floor: 1 }]),
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 1, name: 'Story 1', floor: 1 }),
      create: jest
        .fn()
        .mockImplementation(
          (
            buildingId: number,
            name: string,
            floor: number,
            userId: number,
            userRole: UserRole,
          ) => {
            if (userRole !== UserRole.ADMIN) {
              return Promise.reject(
                new ForbiddenException(
                  'Only administrators can create stories',
                ),
              );
            }
            return Promise.resolve({ id: 1, name, floor });
          },
        ),
      update: jest
        .fn()
        .mockImplementation(
          (
            id: number,
            userId: number,
            userRole: UserRole,
            data: { name?: string; floor?: number },
          ) => {
            if (userRole !== UserRole.ADMIN) {
              return Promise.reject(
                new ForbiddenException(
                  'Only administrators can update stories',
                ),
              );
            }
            return Promise.resolve({ id, ...data, floor: data.floor ?? 1 });
          },
        ),
      delete: jest.fn().mockImplementation((id, userId, userRole) => {
        if (userRole !== UserRole.ADMIN) {
          return Promise.reject(
            new ForbiddenException('Only administrators can delete stories'),
          );
        }
        return Promise.resolve();
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoriesController],
      providers: [{ provide: StoriesService, useValue: service }],
    }).compile();

    controller = module.get<StoriesController>(StoriesController);
  });

  describe('findAll', () => {
    it('should return stories for building', () => {
      const result = controller.findAll(1, mockUser as any);
      expect(result).resolves.toEqual([{ id: 1, name: 'Story 1', floor: 1 }]);
    });
  });

  describe('findOne', () => {
    it('should return a story by id', () => {
      const result = controller.findOne(1, 1, mockUser as any);
      expect(result).resolves.toEqual({ id: 1, name: 'Story 1', floor: 1 });
    });
  });

  describe('create', () => {
    it('should create story for admin', () => {
      const result = controller.create(
        1,
        { name: 'Story 1', floor: 1 },
        mockAdmin as any,
      );
      expect(result).resolves.toEqual({ id: 1, name: 'Story 1', floor: 1 });
    });

    it('should throw ForbiddenException for non-admin', async () => {
      await expect(
        controller.create(1, { name: 'Story 1', floor: 1 }, mockUser as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update story for admin', () => {
      const result = controller.update(
        1,
        1,
        { name: 'Updated', floor: 2 },
        mockAdmin as any,
      );
      expect(result).resolves.toEqual({ id: 1, name: 'Updated', floor: 2 });
    });

    it('should throw ForbiddenException for non-admin', async () => {
      await expect(
        controller.update(1, 1, { name: 'Updated' }, mockUser as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete story for admin', () => {
      const result = controller.delete(1, 1, mockAdmin as any);
      expect(result).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException for non-admin', async () => {
      await expect(controller.delete(1, 1, mockUser as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
