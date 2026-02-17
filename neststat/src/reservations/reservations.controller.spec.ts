import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { User, UserRole } from '../users/user.entity';

describe('ReservationsController', () => {
  let controller: ReservationsController;
  let service: ReservationsService;

  const mockUser: Partial<User> = {
    id: 1,
    username: 'testuser',
    role: UserRole.USER,
  };

  const mockReservation = {
    id: 1,
    title: 'Team Meeting',
    description: 'Weekly sync',
    startTime: new Date('2024-01-15T10:00:00Z'),
    endTime: new Date('2024-01-15T11:00:00Z'),
    roomId: 1,
    organizerId: 1,
    invitees: [],
  };

  const mockReservationsService = {
    findAllForRoom: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getAvailabilities: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationsController],
      providers: [
        {
          provide: ReservationsService,
          useValue: mockReservationsService,
        },
      ],
    }).compile();

    controller = module.get<ReservationsController>(ReservationsController);
    service = module.get<ReservationsService>(ReservationsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all reservations for a room', async () => {
      mockReservationsService.findAllForRoom.mockResolvedValue([mockReservation]);

      const result = await controller.findAll(1, mockUser as User);

      expect(result).toEqual([mockReservation]);
      expect(mockReservationsService.findAllForRoom).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('findOne', () => {
    it('should return a single reservation', async () => {
      mockReservationsService.findOne.mockResolvedValue(mockReservation);

      const result = await controller.findOne(1, 1, 1, 1, mockUser as User);

      expect(result).toEqual(mockReservation);
      expect(mockReservationsService.findOne).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('create', () => {
    it('should create a new reservation', async () => {
      const createDto = {
        title: 'Team Meeting',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
      };
      const expectedResult = { reservation: mockReservation };
      mockReservationsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(1, createDto, mockUser as User);

      expect(result).toEqual(expectedResult);
      expect(mockReservationsService.create).toHaveBeenCalledWith(
        1,
        createDto,
        1,
        UserRole.USER,
      );
    });

    it('should return warning when capacity exceeded', async () => {
      const createDto = {
        title: 'Team Meeting',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        invitees: [2, 3, 4, 5, 6, 7, 8, 9, 10],
      };
      const expectedResult = {
        reservation: mockReservation,
        warning: 'Warning: The number of participants (10) exceeds the room capacity (5)',
      };
      mockReservationsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(1, createDto, mockUser as User);

      expect(result).toEqual(expectedResult);
      expect(result.warning).toContain('Warning');
    });
  });

  describe('update', () => {
    it('should update a reservation', async () => {
      const updateDto = { title: 'Updated Meeting' };
      const expectedResult = { reservation: { ...mockReservation, title: 'Updated Meeting' } };
      mockReservationsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(1, 1, updateDto, mockUser as User);

      expect(result).toEqual(expectedResult);
      expect(mockReservationsService.update).toHaveBeenCalledWith(1, updateDto, 1);
    });
  });

  describe('delete', () => {
    it('should delete a reservation', async () => {
      mockReservationsService.delete.mockResolvedValue(undefined);

      await controller.delete(1, 1, 1, 1, mockUser as User);

      expect(mockReservationsService.delete).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('getAvailabilities', () => {
    it('should return room availability', async () => {
      const mockRoom = { id: 1, name: 'Room 101', capacity: 10 };
      const mockSlots = [
        { start: new Date('2024-01-15T08:00:00Z'), end: new Date('2024-01-15T10:00:00Z') },
        { start: new Date('2024-01-15T11:00:00Z'), end: new Date('2024-01-15T18:00:00Z') },
      ];
      const expectedResult = {
        room: mockRoom,
        reservations: [mockReservation],
        availableSlots: mockSlots,
      };
      mockReservationsService.getAvailabilities.mockResolvedValue(expectedResult);

      const result = await controller.getAvailabilities(
        1,
        { startDate: '2024-01-15T00:00:00Z', endDate: '2024-01-15T23:59:59Z' },
        mockUser as User,
      );

      expect(result).toEqual(expectedResult);
      expect(mockReservationsService.getAvailabilities).toHaveBeenCalledWith(
        1,
        1,
        '2024-01-15T00:00:00Z',
        '2024-01-15T23:59:59Z',
      );
    });

    it('should return availability without date filters', async () => {
      const mockRoom = { id: 1, name: 'Room 101', capacity: 10 };
      const expectedResult = {
        room: mockRoom,
        reservations: [],
        availableSlots: [],
      };
      mockReservationsService.getAvailabilities.mockResolvedValue(expectedResult);

      const result = await controller.getAvailabilities(1, {}, mockUser as User);

      expect(result).toEqual(expectedResult);
      expect(mockReservationsService.getAvailabilities).toHaveBeenCalledWith(1, 1, undefined, undefined);
    });
  });
});
