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

// Test constants for time calculations
const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

// Test data constants
const TEST_USER_ID = 1;
const TEST_ROOM_ID = 1;
const TEST_BUILDING_ID = 1;
const TEST_RESERVATION_ID = 1;
const DEFAULT_ROOM_CAPACITY = 5;
const SMALL_ROOM_CAPACITY = 2;

/**
 * Helper function to create a mock query builder
 */
const createMockQueryBuilder = (count = 0) => ({
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getCount: jest.fn().mockResolvedValue(count),
});

/**
 * Helper function to get a future date for valid reservations
 * @param daysAhead Number of days in the future
 * @param additionalHours Additional hours to add
 */
const getFutureDate = (daysAhead = 1, additionalHours = 0): string => {
  return new Date(Date.now() + (daysAhead * ONE_DAY_MS) + (additionalHours * ONE_HOUR_MS)).toISOString();
};

/**
 * Helper function to get a past date for invalid reservations
 * @param hoursAgo Number of hours in the past
 */
const getPastDate = (hoursAgo = 1): string => {
  return new Date(Date.now() - (hoursAgo * ONE_HOUR_MS)).toISOString();
};

/**
 * Helper function to create valid reservation data
 */
const createValidReservationData = (overrides = {}) => ({
  title: 'Meeting',
  startTime: getFutureDate(1, 0),
  endTime: getFutureDate(1, 1),
  ...overrides,
});

/**
 * Helper function to setup successful reservation mocks
 */
const setupSuccessfulReservationMocks = (
  mockRoomRepo: any,
  mockBuildingsService: any,
  mockReservationRepo: any,
  mockUserRepo: any,
  room: any = { id: TEST_ROOM_ID, capacity: DEFAULT_ROOM_CAPACITY, story: { buildingId: TEST_BUILDING_ID } },
  conflictCount = 0,
) => {
  mockRoomRepo.findOne.mockResolvedValue(room);
  mockBuildingsService.findOne.mockResolvedValue({});
  mockReservationRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(conflictCount));
  mockUserRepo.find.mockResolvedValue([]);
};

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
      const mockReservations = [{ id: TEST_RESERVATION_ID, title: 'Meeting' }];
      mockRoomRepo.findOne.mockResolvedValue({ id: TEST_ROOM_ID, story: { buildingId: TEST_BUILDING_ID } });
      mockBuildingsService.findOne.mockResolvedValue({});
      mockReservationRepo.find.mockResolvedValue(mockReservations);

      const result = await service.findAllForRoom(TEST_ROOM_ID, TEST_USER_ID);

      expect(result).toEqual(mockReservations);
    });

    it('should throw NotFoundException when room not found', async () => {
      mockRoomRepo.findOne.mockResolvedValue(null);

      await expect(service.findAllForRoom(TEST_ROOM_ID, TEST_USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a reservation by id', async () => {
      const mockReservation = { 
        id: TEST_RESERVATION_ID, 
        title: 'Meeting', 
        room: { story: { buildingId: TEST_BUILDING_ID } } 
      };
      mockReservationRepo.findOne.mockResolvedValue(mockReservation);
      mockBuildingsService.findOne.mockResolvedValue({});

      const result = await service.findOne(TEST_RESERVATION_ID, TEST_USER_ID);

      expect(result).toEqual(mockReservation);
    });

    it('should throw NotFoundException when reservation not found', async () => {
      mockReservationRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, TEST_USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const mockRoom = { 
      id: TEST_ROOM_ID, 
      capacity: DEFAULT_ROOM_CAPACITY, 
      story: { buildingId: TEST_BUILDING_ID } 
    };
    const validData = createValidReservationData();

    beforeEach(() => {
      setupSuccessfulReservationMocks(
        mockRoomRepo,
        mockBuildingsService,
        mockReservationRepo,
        mockUserRepo,
        mockRoom,
      );
    });

    it('should create a reservation', async () => {
      const savedReservation = { 
        id: TEST_RESERVATION_ID, 
        ...validData, 
        organizerId: TEST_USER_ID, 
        invitees: [] 
      };
      mockReservationRepo.create.mockReturnValue(savedReservation);
      mockReservationRepo.save.mockResolvedValue(savedReservation);
      mockReservationRepo.findOne.mockResolvedValue(savedReservation);

      const result = await service.create(TEST_ROOM_ID, validData, TEST_USER_ID, UserRole.USER);

      expect(result.reservation).toBeDefined();
      expect(result.reservation.title).toBe('Meeting');
    });

    it('should return warning when capacity exceeded', async () => {
      const roomWithSmallCapacity = { ...mockRoom, capacity: SMALL_ROOM_CAPACITY };
      setupSuccessfulReservationMocks(
        mockRoomRepo,
        mockBuildingsService,
        mockReservationRepo,
        mockUserRepo,
        roomWithSmallCapacity,
      );
      
      mockUserRepo.find.mockResolvedValue([
        { id: 2 },
        { id: 3 },
        { id: 4 },
      ]);

      const dataWithInvitees = createValidReservationData({ invitees: [2, 3, 4] });

      const savedReservation = { 
        id: TEST_RESERVATION_ID, 
        ...dataWithInvitees, 
        organizerId: TEST_USER_ID, 
        invitees: [] 
      };
      mockReservationRepo.create.mockReturnValue(savedReservation);
      mockReservationRepo.save.mockResolvedValue(savedReservation);
      mockReservationRepo.findOne.mockResolvedValue(savedReservation);

      const result = await service.create(TEST_ROOM_ID, dataWithInvitees, TEST_USER_ID, UserRole.USER);

      expect(result.warning).toContain('Warning');
    });

    it('should throw BadRequestException when start time is in the past', async () => {
      const pastData = createValidReservationData({
        startTime: getPastDate(1),
        endTime: getPastDate(0.5),
      });

      await expect(
        service.create(TEST_ROOM_ID, pastData, TEST_USER_ID, UserRole.USER)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when end time is before start time', async () => {
      const invalidData = createValidReservationData({
        startTime: getFutureDate(1, 1),
        endTime: getFutureDate(1, 0),
      });

      await expect(
        service.create(TEST_ROOM_ID, invalidData, TEST_USER_ID, UserRole.USER)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when room is already booked', async () => {
      setupSuccessfulReservationMocks(
        mockRoomRepo,
        mockBuildingsService,
        mockReservationRepo,
        mockUserRepo,
        mockRoom,
        1, // conflictCount = 1 means room is booked
      );

      await expect(
        service.create(TEST_ROOM_ID, validData, TEST_USER_ID, UserRole.USER)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when invitee user IDs do not exist', async () => {
      const dataWithInvitees = createValidReservationData({ invitees: [2, 3, 999] });
      
      // Mock that only 2 out of 3 invitees exist
      mockUserRepo.find.mockResolvedValue([{ id: 2 }, { id: 3 }]);

      await expect(
        service.create(TEST_ROOM_ID, dataWithInvitees, TEST_USER_ID, UserRole.USER)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const existingReservation = {
      id: TEST_RESERVATION_ID,
      title: 'Meeting',
      description: 'Old description',
      startTime: new Date(Date.now() + ONE_DAY_MS),
      endTime: new Date(Date.now() + ONE_DAY_MS + ONE_HOUR_MS),
      roomId: TEST_ROOM_ID,
      organizerId: TEST_USER_ID,
      invitees: [],
      room: { story: { buildingId: TEST_BUILDING_ID } },
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

      const result = await service.update(TEST_RESERVATION_ID, { title: 'Updated Title' }, TEST_USER_ID);

      expect(result.reservation.title).toBe('Updated Title');
    });

    it('should throw ForbiddenException when user is not organizer', async () => {
      const unauthorizedUserId = 999;
      
      await expect(
        service.update(TEST_RESERVATION_ID, { title: 'New Title' }, unauthorizedUserId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    const existingReservation = {
      id: TEST_RESERVATION_ID,
      title: 'Meeting',
      room: { story: { buildingId: TEST_BUILDING_ID } },
      organizerId: TEST_USER_ID,
    };

    beforeEach(() => {
      mockReservationRepo.findOne.mockResolvedValue(existingReservation);
      mockBuildingsService.findOne.mockResolvedValue({});
    });

    it('should delete a reservation', async () => {
      mockReservationRepo.remove.mockResolvedValue(existingReservation);

      await service.delete(TEST_RESERVATION_ID, TEST_USER_ID);

      expect(mockReservationRepo.remove).toHaveBeenCalledWith(existingReservation);
    });

    it('should throw ForbiddenException when user is not organizer', async () => {
      const unauthorizedUserId = 999;
      
      await expect(
        service.delete(TEST_RESERVATION_ID, unauthorizedUserId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAvailabilities', () => {
    const mockRoom = { 
      id: TEST_ROOM_ID, 
      name: 'Room 101', 
      capacity: 10, 
      story: { buildingId: TEST_BUILDING_ID } 
    };
    const mockReservations = [
      {
        id: TEST_RESERVATION_ID,
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
      const result = await service.getAvailabilities(TEST_ROOM_ID, TEST_USER_ID);

      expect(result.room).toEqual(mockRoom);
      expect(result.reservations).toEqual(mockReservations);
      expect(result.availableSlots).toBeDefined();
    });

    it('should filter by date range', async () => {
      const startDate = '2024-01-15T00:00:00Z';
      const endDate = '2024-01-15T23:59:59Z';

      await service.getAvailabilities(TEST_ROOM_ID, TEST_USER_ID, startDate, endDate);

      expect(mockReservationRepo.find).toHaveBeenCalled();
    });

    it('should throw NotFoundException when room not found', async () => {
      mockRoomRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getAvailabilities(TEST_ROOM_ID, TEST_USER_ID)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('edge cases', () => {
    it('should handle empty invitee list', async () => {
      const mockRoom = { 
        id: TEST_ROOM_ID, 
        capacity: DEFAULT_ROOM_CAPACITY, 
        story: { buildingId: TEST_BUILDING_ID } 
      };
      setupSuccessfulReservationMocks(
        mockRoomRepo,
        mockBuildingsService,
        mockReservationRepo,
        mockUserRepo,
        mockRoom,
      );

      const dataWithEmptyInvitees = createValidReservationData({ invitees: [] });
      const savedReservation = { 
        id: TEST_RESERVATION_ID, 
        ...dataWithEmptyInvitees, 
        organizerId: TEST_USER_ID, 
        invitees: [] 
      };
      mockReservationRepo.create.mockReturnValue(savedReservation);
      mockReservationRepo.save.mockResolvedValue(savedReservation);
      mockReservationRepo.findOne.mockResolvedValue(savedReservation);

      const result = await service.create(
        TEST_ROOM_ID, 
        dataWithEmptyInvitees, 
        TEST_USER_ID, 
        UserRole.USER
      );

      expect(result.reservation).toBeDefined();
      expect(result.warning).toBeUndefined();
    });

    it('should handle reservation at exact room capacity', async () => {
      const mockRoom = { 
        id: TEST_ROOM_ID, 
        capacity: 3, 
        story: { buildingId: TEST_BUILDING_ID } 
      };
      setupSuccessfulReservationMocks(
        mockRoomRepo,
        mockBuildingsService,
        mockReservationRepo,
        mockUserRepo,
        mockRoom,
      );

      mockUserRepo.find.mockResolvedValue([{ id: 2 }, { id: 3 }]);

      const dataWithInvitees = createValidReservationData({ invitees: [2, 3] });
      const savedReservation = { 
        id: TEST_RESERVATION_ID, 
        ...dataWithInvitees, 
        organizerId: TEST_USER_ID, 
        invitees: [] 
      };
      mockReservationRepo.create.mockReturnValue(savedReservation);
      mockReservationRepo.save.mockResolvedValue(savedReservation);
      mockReservationRepo.findOne.mockResolvedValue(savedReservation);

      const result = await service.create(
        TEST_ROOM_ID, 
        dataWithInvitees, 
        TEST_USER_ID, 
        UserRole.USER
      );

      expect(result.reservation).toBeDefined();
      expect(result.warning).toBeUndefined(); // At capacity, not exceeded
    });
  });
});
