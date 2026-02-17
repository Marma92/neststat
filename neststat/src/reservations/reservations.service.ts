import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Reservation } from './reservation.entity';
import { Room } from '../rooms/room.entity';
import { StoriesService } from '../stories/stories.service';
import { BuildingsService } from '../buildings/buildings.service';
import { User, UserRole } from '../users/user.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  RESERVATION_CONFIG,
  getBufferTimeMs,
  getMinAdvanceMs,
  getMaxDurationMs,
} from './reservation.config';

/**
 * Service for managing room reservations
 * Handles booking, updating, deleting reservations and checking availability
 */
@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private storiesService: StoriesService,
    private buildingsService: BuildingsService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Retrieves all reservations for a specific room
   * @param roomId - The ID of the room
   * @param userId - The ID of the user making the request
   * @returns Array of reservations for the room
   */
  async findAllForRoom(
    roomId: number,
    userId: number,
  ): Promise<Reservation[]> {
    const room = await this.findRoomWithAccessCheck(roomId, userId);
    void room;
    return this.reservationsRepository.find({
      where: { roomId },
      relations: ['organizer', 'invitees'],
      order: { startTime: 'ASC' },
    });
  }

  /**
   * Retrieves a single reservation by ID
   * @param id - The reservation ID
   * @param userId - The ID of the user making the request
   * @returns The reservation data
   * @throws NotFoundException if reservation doesn't exist
   */
  async findOne(id: number, userId: number): Promise<Reservation> {
    const reservation = await this.reservationsRepository.findOne({
      where: { id },
      relations: ['room', 'room.story', 'room.story.building', 'organizer', 'invitees'],
    });
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }
    await this.buildingsService.findOne(
      reservation.room.story.buildingId,
      userId,
    );
    return reservation;
  }

  /**
   * Creates a new room reservation
   * @param roomId - The ID of the room to reserve
   * @param data - Reservation details (title, description, startTime, endTime, invitees)
   * @param userId - The ID of the user creating the reservation
   * @param userRole - The role of the user
   * @returns The created reservation with optional warning if capacity exceeded
   * @throws ForbiddenException if room is already booked
   * @throws BadRequestException if validation fails
   */
  async create(
    roomId: number,
    data: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      invitees?: number[];
    },
    userId: number,
    userRole: UserRole,
  ): Promise<{ reservation: Reservation; warning?: string }> {
    const room = await this.findRoomWithAccessCheck(roomId, userId);

    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    // Validate date formats
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new BadRequestException('Invalid date format for startTime or endTime');
    }

    // Check if dates are in the past
    const now = new Date();
    if (startTime < now) {
      throw new BadRequestException('Start time cannot be in the past');
    }

    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Validate business rules (duration, advance time, business hours)
    this.validateReservationTiming(startTime, endTime);
    this.validateBusinessHours(startTime, endTime);

    const conflict = await this.checkConflict(roomId, startTime, endTime);
    if (conflict) {
      this.logger.warn('Reservation conflict detected', {
        context: 'ReservationsService',
        roomId,
        userId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
      throw new ForbiddenException(
        'The room is already booked for this time slot',
      );
    }

    const invitees = data.invitees?.length ? data.invitees : [];
    
    // Validate that all invitee user IDs exist
    await this.validateInvitees(invitees);

    const totalParticipants = 1 + invitees.length;
    let warning: string | undefined;
    if (room.capacity && totalParticipants > room.capacity) {
      warning = `Warning: The number of participants (${totalParticipants}) exceeds the room capacity (${room.capacity})`;
    }

    const reservation = this.reservationsRepository.create({
      title: data.title,
      description: data.description,
      startTime,
      endTime,
      roomId,
      organizerId: userId,
      invitees: invitees.map((id) => ({ id } as User)),
    });

    const saved = await this.reservationsRepository.save(reservation);
    const result = await this.reservationsRepository.findOne({
      where: { id: saved.id },
      relations: ['organizer', 'invitees'],
    });

    this.logger.info('Reservation created', {
      context: 'ReservationsService',
      reservationId: saved.id,
      roomId,
      userId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      participantCount: totalParticipants,
      hasWarning: !!warning,
    });

    return {
      reservation: result!,
      warning,
    };
  }

  /**
   * Updates an existing reservation
   * Only the organizer can update their reservation
   * @param id - The reservation ID to update
   * @param data - Updated reservation details
   * @param userId - The ID of the user making the request
   * @returns The updated reservation with optional warning if capacity exceeded
   * @throws ForbiddenException if user is not the organizer or room is booked
   * @throws BadRequestException if validation fails
   */
  async update(
    id: number,
    data: {
      title?: string;
      description?: string;
      startTime?: string;
      endTime?: string;
      invitees?: number[];
    },
    userId: number,
  ): Promise<{ reservation: Reservation; warning?: string }> {
    const reservation = await this.findOne(id, userId);

    if (reservation.organizerId !== userId) {
      throw new ForbiddenException(
        'Only the organizer can update this reservation',
      );
    }

    const startTime = data.startTime
      ? new Date(data.startTime)
      : reservation.startTime;
    const endTime = data.endTime ? new Date(data.endTime) : reservation.endTime;

    if (data.startTime || data.endTime) {
      // Validate date formats
      if (
        (data.startTime && isNaN(startTime.getTime())) ||
        (data.endTime && isNaN(endTime.getTime()))
      ) {
        throw new BadRequestException('Invalid date format for startTime or endTime');
      }

      // Check if new start time is in the past
      const now = new Date();
      if (data.startTime && startTime < now) {
        throw new BadRequestException('Start time cannot be in the past');
      }

      if (startTime >= endTime) {
        throw new BadRequestException('End time must be after start time');
      }

      // Validate business rules (duration, advance time, business hours)
      this.validateReservationTiming(startTime, endTime);
      this.validateBusinessHours(startTime, endTime);

      const conflict = await this.checkConflict(
        reservation.roomId,
        startTime,
        endTime,
        id,
      );
      if (conflict) {
        throw new ForbiddenException(
          'The room is already booked for this time slot',
        );
      }
    }

    const invitees = data.invitees ?? reservation.invitees.map((i) => i.id);
    
    // Validate invitee user IDs if they were updated
    if (data.invitees) {
      await this.validateInvitees(data.invitees);
    }

    const totalParticipants = 1 + invitees.length;
    const room = await this.roomsRepository.findOne({
      where: { id: reservation.roomId },
    });
    let warning: string | undefined;
    if (room && room.capacity && totalParticipants > room.capacity) {
      warning = `Warning: The number of participants (${totalParticipants}) exceeds the room capacity (${room.capacity})`;
    }

    if (data.title) reservation.title = data.title;
    if (data.description !== undefined) reservation.description = data.description;
    if (data.startTime) reservation.startTime = startTime;
    if (data.endTime) reservation.endTime = endTime;
    if (data.invitees) {
      reservation.invitees = invitees.map((invId) => ({ id: invId } as User));
    }

    const saved = await this.reservationsRepository.save(reservation);
    const result = await this.reservationsRepository.findOne({
      where: { id: saved.id },
      relations: ['organizer', 'invitees'],
    });

    this.logger.info('Reservation updated', {
      context: 'ReservationsService',
      reservationId: id,
      userId,
      hasWarning: !!warning,
    });

    return {
      reservation: result!,
      warning,
    };
  }

  /**
   * Deletes a reservation
   * Only the organizer can delete their reservation
   * @param id - The reservation ID to delete
   * @param userId - The ID of the user making the request
   * @throws ForbiddenException if user is not the organizer
   */
  async delete(id: number, userId: number): Promise<void> {
    const reservation = await this.findOne(id, userId);
    if (reservation.organizerId !== userId) {
      throw new ForbiddenException(
        'Only the organizer can delete this reservation',
      );
    }
    await this.reservationsRepository.remove(reservation);

    this.logger.info('Reservation deleted', {
      context: 'ReservationsService',
      reservationId: id,
      userId,
      roomId: reservation.roomId,
    });
  }

  /**
   * Gets room availability for a specific time period
   * @param roomId - The ID of the room
   * @param userId - The ID of the user making the request
   * @param startDate - Optional start date for availability check
   * @param endDate - Optional end date for availability check
   * @returns Room info, existing reservations, and available time slots
   */
  async getAvailabilities(
    roomId: number,
    userId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    room: Room;
    reservations: Reservation[];
    availableSlots: Array<{ start: Date; end: Date }>;
  }> {
    const room = await this.findRoomWithAccessCheck(roomId, userId);

    const whereCondition: Record<string, unknown> = { roomId };
    if (startDate && endDate) {
      whereCondition.startTime = MoreThanOrEqual(new Date(startDate));
      whereCondition.endTime = LessThanOrEqual(new Date(endDate));
    }

    const reservations = await this.reservationsRepository.find({
      where: whereCondition,
      relations: ['organizer', 'invitees'],
      order: { startTime: 'ASC' },
    });

    const availableSlots = this.calculateAvailableSlots(
      reservations,
      startDate ? new Date(startDate) : new Date(),
      endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );

    return { room, reservations, availableSlots };
  }

  /**
   * Checks if there's a scheduling conflict including buffer time
   * Buffer time ensures cleanup/setup time between reservations
   */
  private async checkConflict(
    roomId: number,
    startTime: Date,
    endTime: Date,
    excludeId?: number,
  ): Promise<boolean> {
    // Add buffer time to prevent back-to-back bookings
    const bufferMs = getBufferTimeMs();
    const bufferedStart = new Date(startTime.getTime() - bufferMs);
    const bufferedEnd = new Date(endTime.getTime() + bufferMs);

    const query = this.reservationsRepository
      .createQueryBuilder('reservation')
      .where('reservation.roomId = :roomId', { roomId })
      .andWhere(
        '(reservation.startTime < :endTime AND reservation.endTime > :startTime)',
        { startTime: bufferedStart, endTime: bufferedEnd },
      );

    if (excludeId) {
      query.andWhere('reservation.id != :excludeId', { excludeId });
    }

    const count = await query.getCount();
    return count > 0;
  }

  private async findRoomWithAccessCheck(
    roomId: number,
    userId: number,
  ): Promise<Room> {
    const room = await this.roomsRepository.findOne({
      where: { id: roomId },
      relations: ['story', 'story.building'],
    });
    if (!room) {
      this.logger.warn('Room not found', {
        context: 'ReservationsService',
        roomId,
        userId,
      });
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }
    try {
      await this.buildingsService.findOne(room.story.buildingId, userId);
    } catch (error) {
      this.logger.warn('Access denied to room', {
        context: 'ReservationsService',
        roomId,
        userId,
        buildingId: room.story.buildingId,
      });
      throw error;
    }
    return room;
  }

  /**
   * Validates business rules for reservation timing
   */
  private validateReservationTiming(startTime: Date, endTime: Date): void {
    const now = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const advanceMs = startTime.getTime() - now.getTime();

    // Check minimum advance booking time
    if (advanceMs < getMinAdvanceMs()) {
      const minMinutes = RESERVATION_CONFIG.MIN_ADVANCE_MINUTES;
      this.logger.warn('Reservation violates minimum advance time', {
        context: 'ReservationsService',
        advanceMinutes: Math.floor(advanceMs / 60000),
        requiredMinutes: minMinutes,
      });
      throw new BadRequestException(
        `Reservations must be made at least ${minMinutes} minutes in advance`,
      );
    }

    // Check maximum reservation duration
    if (durationMs > getMaxDurationMs()) {
      const maxHours = RESERVATION_CONFIG.MAX_DURATION_HOURS;
      this.logger.warn('Reservation exceeds maximum duration', {
        context: 'ReservationsService',
        durationHours: durationMs / (60 * 60 * 1000),
        maxHours,
      });
      throw new BadRequestException(
        `Reservations cannot exceed ${maxHours} hours`,
      );
    }

    // Check maximum advance booking
    if (RESERVATION_CONFIG.MAX_ADVANCE_DAYS > 0) {
      const maxAdvanceMs =
        RESERVATION_CONFIG.MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000;
      if (advanceMs > maxAdvanceMs) {
        this.logger.warn('Reservation exceeds maximum advance booking', {
          context: 'ReservationsService',
          advanceDays: Math.floor(advanceMs / (24 * 60 * 60 * 1000)),
          maxDays: RESERVATION_CONFIG.MAX_ADVANCE_DAYS,
        });
        throw new BadRequestException(
          `Reservations cannot be made more than ${RESERVATION_CONFIG.MAX_ADVANCE_DAYS} days in advance`,
        );
      }
    }
  }

  /**
   * Validates that reservation times fall within business hours
   */
  private validateBusinessHours(startTime: Date, endTime: Date): void {
    if (!RESERVATION_CONFIG.ENFORCE_BUSINESS_HOURS) {
      return;
    }

    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();

    const businessStart = RESERVATION_CONFIG.BUSINESS_HOURS.START;
    const businessEnd = RESERVATION_CONFIG.BUSINESS_HOURS.END;

    // Check if start time is within business hours
    if (startHour < businessStart || startHour >= businessEnd) {
      this.logger.warn('Reservation outside business hours (start time)', {
        context: 'ReservationsService',
        startHour,
        businessStart,
        businessEnd,
      });
      throw new BadRequestException(
        `Reservations must start between ${businessStart}:00 and ${businessEnd}:00`,
      );
    }

    // Check if end time is within business hours (allowing exactly at closing time)
    if (endHour > businessEnd || (endHour === businessEnd && endMinute > 0)) {
      this.logger.warn('Reservation outside business hours (end time)', {
        context: 'ReservationsService',
        endHour,
        endMinute,
        businessEnd,
      });
      throw new BadRequestException(
        `Reservations must end by ${businessEnd}:00`,
      );
    }
  }

  private async validateInvitees(inviteeIds: number[]): Promise<void> {
    if (!inviteeIds || inviteeIds.length === 0) {
      return;
    }

    const users = await this.usersRepository.find({
      where: inviteeIds.map((id) => ({ id })),
    });

    if (users.length !== inviteeIds.length) {
      const foundIds = users.map((u) => u.id);
      const missingIds = inviteeIds.filter((id) => !foundIds.includes(id));
      this.logger.warn('Invalid invitee user IDs provided', {
        context: 'ReservationsService',
        missingIds,
      });
      throw new NotFoundException(
        `Invalid invitee user IDs: ${missingIds.join(', ')}`,
      );
    }
  }

  private calculateAvailableSlots(
    reservations: Reservation[],
    startDate: Date,
    endDate: Date,
  ): Array<{ start: Date; end: Date }> {
    const slots: Array<{ start: Date; end: Date }> = [];
    const sortedReservations = [...reservations].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime(),
    );

    let currentTime = new Date(startDate);
    currentTime.setHours(0, 0, 0, 0);
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    for (const reservation of sortedReservations) {
      if (reservation.startTime > currentTime) {
        slots.push({
          start: new Date(currentTime),
          end: new Date(reservation.startTime),
        });
      }
      if (reservation.endTime > currentTime) {
        currentTime = new Date(reservation.endTime);
      }
    }

    if (currentTime < endDateTime) {
      slots.push({
        start: new Date(currentTime),
        end: new Date(endDateTime),
      });
    }

    return slots;
  }
}
