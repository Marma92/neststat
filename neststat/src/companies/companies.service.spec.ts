import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import { Company } from './company.entity';
import { NotFoundException } from '@nestjs/common';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let companyRepo: any;

  const mockCompanyRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: getRepositoryToken(Company), useValue: mockCompanyRepo },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    companyRepo = module.get(getRepositoryToken(Company));
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all companies', async () => {
      const mockCompanies = [
        { id: 1, name: 'Company 1' },
        { id: 2, name: 'Company 2' },
      ];
      mockCompanyRepo.find.mockResolvedValue(mockCompanies);

      const result = await service.findAll();

      expect(result).toEqual(mockCompanies);
    });
  });

  describe('findOne', () => {
    it('should return a company by id', async () => {
      const mockCompany = { id: 1, name: 'Company 1' };
      mockCompanyRepo.findOne.mockResolvedValue(mockCompany);

      const result = await service.findOne(1);

      expect(result).toEqual(mockCompany);
    });

    it('should throw NotFoundException when company not found', async () => {
      mockCompanyRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new company', async () => {
      const mockCompany = { id: 1, name: 'New Company' };
      mockCompanyRepo.create.mockReturnValue(mockCompany);
      mockCompanyRepo.save.mockResolvedValue(mockCompany);

      const result = await service.create('New Company');

      expect(result).toEqual(mockCompany);
      expect(mockCompanyRepo.create).toHaveBeenCalledWith({ name: 'New Company' });
    });
  });

  describe('update', () => {
    it('should update a company', async () => {
      const mockCompany = { id: 1, name: 'Old Name' };
      mockCompanyRepo.findOne.mockResolvedValue(mockCompany);
      mockCompanyRepo.save.mockResolvedValue({ ...mockCompany, name: 'New Name' });

      const result = await service.update(1, 'New Name');

      expect(result.name).toBe('New Name');
    });

    it('should throw NotFoundException when company not found', async () => {
      mockCompanyRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, 'New Name')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a company', async () => {
      const mockCompany = { id: 1, name: 'Company' };
      mockCompanyRepo.findOne.mockResolvedValue(mockCompany);
      mockCompanyRepo.remove.mockResolvedValue(mockCompany);

      await service.delete(1);

      expect(mockCompanyRepo.remove).toHaveBeenCalledWith(mockCompany);
    });

    it('should throw NotFoundException when company not found', async () => {
      mockCompanyRepo.findOne.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });
});
