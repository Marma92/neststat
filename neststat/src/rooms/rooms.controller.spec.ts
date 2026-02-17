import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { UserRole } from '../users/user.entity';
import { ForbiddenException } from '@nestjs/common';

describe('RoomsController', () => {
  let controller: RoomsController;
  let service: Partial<RoomsService>;

  const mockAdmin = { id: 1, username: 'admin', role: UserRole.ADMIN };
  const mockUser = { id: 2, username: 'user', role: UserRole.USER };

  beforeEach(async () => {
    service = {
      findAllForStory: jest
        .fn()
        .mockResolvedValue([{ id: 1, name: 'Room 1', capacity: 10 }]),
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 1, name: 'Room 1', capacity: 10 }),
      create: jest
        .fn()
        .mockImplementation(
          (
            storyId: number,
            data: { name: string; capacity?: number },
            userId: number,
            userRole: UserRole,
          ) => {
            if (userRole !== UserRole.ADMIN) {
              return Promise.reject(
                new ForbiddenException('Only administrators can create rooms'),
              );
            }
            return Promise.resolve({ id: 1, ...data });
          },
        ),
      bulkCreate: jest
        .fn()
        .mockImplementation(
          (
            storyId: number,
            rooms: Array<{ name: string; capacity?: number }>,
            userId: number,
            userRole: UserRole,
          ) => {
            if (userRole !== UserRole.ADMIN) {
              return Promise.reject(
                new ForbiddenException('Only administrators can create rooms'),
              );
            }
            return Promise.resolve(rooms.map((r, i) => ({ id: i + 1, ...r })));
          },
        ),
      update: jest
        .fn()
        .mockImplementation(
          (
            id: number,
            userId: number,
            userRole: UserRole,
            data: { name?: string; capacity?: number },
          ) => {
            if (userRole !== UserRole.ADMIN) {
              return Promise.reject(
                new ForbiddenException('Only administrators can update rooms'),
              );
            }
            return Promise.resolve({
              id,
              ...data,
              capacity: data.capacity ?? 1,
            });
          },
        ),
      delete: jest.fn().mockImplementation((id, userId, userRole) => {
        if (userRole !== UserRole.ADMIN) {
          return Promise.reject(
            new ForbiddenException('Only administrators can delete rooms'),
          );
        }
        return Promise.resolve();
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [{ provide: RoomsService, useValue: service }],
    }).compile();

    controller = module.get<RoomsController>(RoomsController);
  });

  describe('findAll', () => {
    it('should return rooms for story', () => {
      const result = controller.findAll(1, mockUser as any);
      expect(result).resolves.toEqual([
        { id: 1, name: 'Room 1', capacity: 10 },
      ]);
    });
  });

  describe('findOne', () => {
    it('should return a room by id', () => {
      const result = controller.findOne(1, 1, 1, mockUser as any);
      expect(result).resolves.toEqual({ id: 1, name: 'Room 1', capacity: 10 });
    });
  });

  describe('create', () => {
    it('should create room for admin', () => {
      const result = controller.create(
        1,
        { name: 'Room 1', capacity: 10 },
        mockAdmin as any,
      );
      expect(result).resolves.toEqual({ id: 1, name: 'Room 1', capacity: 10 });
    });

    it('should throw ForbiddenException for non-admin', async () => {
      await expect(
        controller.create(1, { name: 'Room 1', capacity: 10 }, mockUser as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple rooms for admin', () => {
      const rooms = [
        { name: 'Room 1', capacity: 10 },
        { name: 'Room 2', capacity: 5 },
      ];
      const result = controller.bulkCreate(1, { rooms }, mockAdmin as any);
      expect(result).resolves.toEqual([
        { id: 1, name: 'Room 1', capacity: 10 },
        { id: 2, name: 'Room 2', capacity: 5 },
      ]);
    });

    it('should throw ForbiddenException for non-admin', async () => {
      await expect(
        controller.bulkCreate(1, { rooms: [{ name: 'Room 1' }] }, mockUser as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update room for admin', () => {
      const result = controller.update(
        1,
        1,
        1,
        { name: 'Updated', capacity: 20 },
        mockAdmin as any,
      );
      expect(result).resolves.toEqual({ id: 1, name: 'Updated', capacity: 20 });
    });

    it('should throw ForbiddenException for non-admin', async () => {
      await expect(
        controller.update(1, 1, 1, { name: 'Updated' }, mockUser as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete room for admin', () => {
      const result = controller.delete(1, 1, 1, mockAdmin as any);
      expect(result).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException for non-admin', async () => {
      await expect(controller.delete(1, 1, 1, mockUser as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
