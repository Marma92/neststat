import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReservationsService } from './reservations.service';
import { Reservation } from './reservation.entity';
import { Room } from '../rooms/room.entity';
import { User, UserRole } from '../users/user.entity';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { StoriesService } from '../stories/stories.service';
import { BuildingsService } from '../buildings/buildings.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let reservationRepo: Partial<Repository<Reservation>>;
  let roomRepo: Partial<Repository<Room>>;
  let userRepo: Partial<Repository<User>>;

  const mockReservationRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockRoomRepo = {
    findOne: jest.fn(),
  };

  const mockUserRepo = {
    find: jest.fn(),
  };

  const mockBuildingsService = {
    findOne: jest.fn(),
  };

  const mockStoriesService = {
    findOne: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: getRepositoryToken(Reservation), useValue: mockReservationRepo },
        { provide: getRepositoryToken(Room), useValue: mockRoomRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: BuildingsService, useValue: mockBuildingsService },
        { provide: StoriesService, useValue: mockStoriesService },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    reservationRepo = module.get(getRepositoryToken(Reservation));
    roomRepo = module.get(getRepositoryToken(Room));
    userRepo = module.get(getRepositoryToken(User));
    jest.clearAllMocks();
  });

  describe('findAllForRoom', () => {
    it('should return reservations for a room', async () => {
      const mockReservations = [{ id: 1, title: 'Meeting' }];
      mockRoomRepo.findOne.mockResolvedValue({ id: 1, story: { buildingId: 1 } });
      mockBuildingsService.findOne.mockResolvedValue({});
      mockReservationRepo.find.mockResolvedValue(mockReservations);

      const result = await service.findAllForRoom(1, 1);

      expect(result).toEqual(mockReservations);
    });

    it('should throw NotFoundException when room not found', async () => {
      mockRoomRepo.findOne.mockResolvedValue(null);

      await expect(service.findAllForRoom(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a reservation by id', async () => {
      const mockReservation = { id: 1, title: 'Meeting', room: { story: { buildingId: 1 } } };
      mockReservationRepo.findOne.mockResolvedValue(mockReservation);
      mockBuildingsService.findOne.mockResolvedValue({});

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockReservation);
    });

    it('should throw NotFoundException when reservation not found', async () => {
      mockReservationRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const mockRoom = { id: 1, capacity: 5, story: { buildingId: 1 } };
    const validData = {
      title: 'Meeting',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    };

    beforeEach(() => {
      mockRoomRepo.findOne.mockResolvedValue(mockRoom);
      mockBuildingsService.findOne.mockResolvedValue({});
      mockReservationRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });
      mockUserRepo.find.mockResolvedValue([]);
    });

    it('should create a reservation', async () => {
      const savedReservation = { id: 1, ...validData, organizerId: 1, invitees: [] };
      mockReservationRepo.create.mockReturnValue(savedReservation);
      mockReservationRepo.save.mockResolvedValue(savedReservation);
      mockReservationRepo.findOne.mockResolvedValue(savedReservation);

      const result = await service.create(1, validData, 1, UserRole.USER);

      expect(result.reservation).toBeDefined();
      expect(result.reservation.title).toBe('Meeting');
    });

    it('should return warning when capacity exceeded', async () => {
      const roomWithSmallCapacity = { ...mockRoom, capacity: 2 };
      mockRoomRepo.findOne.mockResolvedValue(roomWithSmallCapacity);
      mockUserRepo.find.mockResolvedValue([
        { id: 2 },
        { id: 3 },
        { id: 4 },
      ]);

      const dataWithInvitees = {
        ...validData,
        invitees: [2, 3, 4],
      };

      const savedReservation = { id: 1, ...dataWithInvitees, organizerId: 1, invitees: [] };
      mockReservationRepo.create.mockReturnValue(savedReservation);
      mockReservationRepo.save.mockResolvedValue(savedReservation);
      mockReservationRepo.findOne.mockResolvedValue(savedReservation);

      const result = await service.create(1, dataWithInvitees, 1, UserRole.USER);

      expect(result.warning).toContain('Warning');
    });

    it('should throw BadRequestException when start time is in the past', async () => {
      const pastData = {
        title: 'Meeting',
        startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      };

      await expect(service.create(1, pastData, 1, UserRole.USER)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when end time is before start time', async () => {
      const invalidData = {
        title: 'Meeting',
        startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };

      await expect(service.create(1, invalidData, 1, UserRole.USER)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when room is already booked', async () => {
      mockReservationRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      });

      await expect(service.create(1, validData, 1, UserRole.USER)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const existingReservation = {
      id: 1,
      title: 'Meeting',
      description: 'Old description',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
      roomId: 1,
      organizerId: 1,
      invitees: [],
      room: { story: { buildingId: 1 } },
    };

    beforeEach(() => {
      mockReservationRepo.findOne.mockResolvedValue(existingReservation);
      mockBuildingsService.findOne.mockResolvedValue({});
    });

    it('should update reservation title', async () => {
      const updatedReservation = { ...existingReservation, title: 'Updated Title' };
      mockReservationRepo.findOne
        .mockResolvedValueOnce(existingReservation)
        .mockResolvedValueOnce(updatedReservation);
      mockReservationRepo.save.mockResolvedValue(updatedReservation);
      mockReservationRepo.findOne.mockResolvedValue(updatedReservation);

      const result = await service.update(1, { title: 'Updated Title' }, 1);

      expect(result.reservation.title).toBe('Updated Title');
    });

    it('should throw ForbiddenException when user is not organizer', async () => {
      await expect(service.update(1, { title: 'New Title' }, 999)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    const existingReservation = {
      id: 1,
      title: 'Meeting',
      room: { story: { buildingId: 1 } },
      organizerId: 1,
    };

    beforeEach(() => {
      mockReservationRepo.findOne.mockResolvedValue(existingReservation);
      mockBuildingsService.findOne.mockResolvedValue({});
    });

    it('should delete a reservation', async () => {
      mockReservationRepo.remove.mockResolvedValue(existingReservation);

      await service.delete(1, 1);

      expect(mockReservationRepo.remove).toHaveBeenCalledWith(existingReservation);
    });

    it('should throw ForbiddenException when user is not organizer', async () => {
      await expect(service.delete(1, 999)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAvailabilities', () => {
    const mockRoom = { id: 1, name: 'Room 101', capacity: 10, story: { buildingId: 1 } };
    const mockReservations = [
      {
        id: 1,
        title: 'Meeting 1',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
      },
    ];

    beforeEach(() => {
      mockRoomRepo.findOne.mockResolvedValue(mockRoom);
      mockBuildingsService.findOne.mockResolvedValue({});
      mockReservationRepo.find.mockResolvedValue(mockReservations);
    });

    it('should return room availabilities', async () => {
      const result = await service.getAvailabilities(1, 1);

      expect(result.room).toEqual(mockRoom);
      expect(result.reservations).toEqual(mockReservations);
      expect(result.availableSlots).toBeDefined();
    });

    it('should filter by date range', async () => {
      await service.getAvailabilities(1, 1, '2024-01-15T00:00:00Z', '2024-01-15T23:59:59Z');

      expect(mockReservationRepo.find).toHaveBeenCalled();
    });
  });
});
