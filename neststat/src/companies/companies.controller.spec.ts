import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { UserRole } from '../users/user.entity';
import { ForbiddenException } from '@nestjs/common';

describe('CompaniesController', () => {
  let controller: CompaniesController;
  let service: Partial<CompaniesService>;

  const mockUser = { id: 1, username: 'admin', role: UserRole.ADMIN };
  const mockUserNonAdmin = { id: 2, username: 'user', role: UserRole.USER };

  beforeEach(async () => {
    service = {
      findAll: jest.fn().mockResolvedValue([{ id: 1, name: 'Company' }]),
      findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Company' }),
      create: jest.fn().mockResolvedValue({ id: 1, name: 'Company' }),
      update: jest.fn().mockResolvedValue({ id: 1, name: 'Updated' }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [{ provide: CompaniesService, useValue: service }],
    }).compile();

    controller = module.get<CompaniesController>(CompaniesController);
  });

  describe('findAll', () => {
    it('should return companies for admin', () => {
      const result = controller.findAll(mockUser as any);
      expect(result).resolves.toEqual([{ id: 1, name: 'Company' }]);
    });

    it('should throw ForbiddenException for non-admin', () => {
      expect(() => controller.findAll(mockUserNonAdmin as any)).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('should create company for admin', () => {
      const result = controller.create({ name: 'New' }, mockUser as any);
      expect(result).resolves.toEqual({ id: 1, name: 'Company' });
    });

    it('should throw ForbiddenException for non-admin', () => {
      expect(() =>
        controller.create({ name: 'New' }, mockUserNonAdmin as any),
      ).toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update company for admin', () => {
      const result = controller.update(1, { name: 'Updated' }, mockUser as any);
      expect(result).resolves.toEqual({ id: 1, name: 'Updated' });
    });

    it('should throw ForbiddenException for non-admin', () => {
      expect(() =>
        controller.update(1, { name: 'Updated' }, mockUserNonAdmin as any),
      ).toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete company for admin', () => {
      const result = controller.delete(1, mockUser as any);
      expect(result).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException for non-admin', () => {
      expect(() => controller.delete(1, mockUserNonAdmin as any)).toThrow(
        ForbiddenException,
      );
    });
  });
});
