import { Test, TestingModule } from '@nestjs/testing';
import { BuildingsController } from './buildings.controller';
import { BuildingsService } from './buildings.service';
import { UserRole } from '../users/user.entity';
import { ForbiddenException } from '@nestjs/common';

describe('BuildingsController', () => {
  let controller: BuildingsController;
  let service: Partial<BuildingsService>;

  const mockAdmin = { id: 1, username: 'admin', role: UserRole.ADMIN };
  const mockUser = { id: 3, username: 'user', role: UserRole.USER };

  beforeEach(async () => {
    service = {
      findAllForUser: jest.fn().mockResolvedValue([{ id: 1, name: 'Building' }]),
      findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Building' }),
      create: jest.fn().mockResolvedValue({ id: 1, name: 'Building' }),
      update: jest.fn().mockResolvedValue({ id: 1, name: 'Updated' }),
      delete: jest.fn().mockResolvedValue(undefined),
      addUser: jest.fn().mockResolvedValue({ id: 1, name: 'Building' }),
      removeUser: jest.fn().mockResolvedValue({ id: 1, name: 'Building' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BuildingsController],
      providers: [{ provide: BuildingsService, useValue: service }],
    }).compile();

    controller = module.get<BuildingsController>(BuildingsController);
  });

  describe('findAll', () => {
    it('should return buildings for any user', () => {
      const result = controller.findAll(mockUser as any);
      expect(result).resolves.toEqual([{ id: 1, name: 'Building' }]);
    });
  });

  describe('findOne', () => {
    it('should return a building by id', () => {
      const result = controller.findOne(1, mockUser as any);
      expect(result).resolves.toEqual({ id: 1, name: 'Building' });
    });
  });

  describe('create', () => {
    it('should create building for admin', () => {
      const result = controller.create({ name: 'New', companyId: 1 }, mockAdmin as any);
      expect(result).resolves.toEqual({ id: 1, name: 'Building' });
    });

    it('should throw ForbiddenException for non-admin', () => {
      expect(() =>
        controller.create({ name: 'New', companyId: 1 }, mockUser as any),
      ).toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update building for admin', () => {
      const result = controller.update(1, { name: 'Updated' }, mockAdmin as any);
      expect(result).resolves.toEqual({ id: 1, name: 'Updated' });
    });

    it('should throw ForbiddenException for non-admin', () => {
      expect(() =>
        controller.update(1, { name: 'Updated' }, mockUser as any),
      ).toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete building for admin', () => {
      const result = controller.delete(1, mockAdmin as any);
      expect(result).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException for non-admin', () => {
      expect(() => controller.delete(1, mockUser as any)).toThrow(ForbiddenException);
    });
  });

  describe('addUser', () => {
    it('should add user for admin', () => {
      const result = controller.addUser(1, { userId: 2 }, mockAdmin as any);
      expect(result).resolves.toEqual({ id: 1, name: 'Building' });
    });

    it('should throw ForbiddenException for non-admin', () => {
      expect(() =>
        controller.addUser(1, { userId: 2 }, mockUser as any),
      ).toThrow(ForbiddenException);
    });
  });

  describe('removeUser', () => {
    it('should remove user for admin', () => {
      const result = controller.removeUser(1, 2, mockAdmin as any);
      expect(result).resolves.toEqual({ id: 1, name: 'Building' });
    });

    it('should throw ForbiddenException for non-admin', () => {
      expect(() =>
        controller.removeUser(1, 2, mockUser as any),
      ).toThrow(ForbiddenException);
    });
  });
});
