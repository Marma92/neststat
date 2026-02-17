import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { User } from '../users/user.entity';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CreateReservationDto,
  UpdateReservationDto,
  ReservationQueryDto,
} from './dto/reservation.dto';

/**
 * Reservations controller handling room booking operations
 */
@ApiTags('reservations')
@ApiBearerAuth()
@Controller('buildings/:buildingId/stories/:storyId/rooms/:roomId/reservations')
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  /**
   * Get all reservations for a specific room
   * @param buildingId - Building ID
   * @param storyId - Story ID
   * @param roomId - Room ID
   * @param user - Current authenticated user
   * @returns List of reservations
   */
  @Get()
  @ApiOperation({ summary: 'Get all reservations for a room' })
  @ApiParam({ name: 'buildingId', description: 'Building ID' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiResponse({ status: 200, description: 'List of reservations' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  findAll(
    @Param('roomId', ParseIntPipe) roomId: number,
    @AuthUser() user: User,
  ) {
    return this.reservationsService.findAllForRoom(roomId, user.id);
  }

  /**
   * Get room availability for a specific time period
   * @param buildingId - Building ID
   * @param storyId - Story ID
   * @param roomId - Room ID
   * @param startDate - Optional start date for availability check
   * @param endDate - Optional end date for availability check
   * @param user - Current authenticated user
   * @returns Room availability information with reservations and available time slots
   */
  @Get('availabilities')
  @ApiOperation({ summary: 'Get room availabilities' })
  @ApiParam({ name: 'buildingId', description: 'Building ID' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiQuery({ name: 'startDate', description: 'Start date for availability', required: false })
  @ApiQuery({ name: 'endDate', description: 'End date for availability', required: false })
  @ApiResponse({ status: 200, description: 'Room availability' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  getAvailabilities(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query() query: ReservationQueryDto,
    @AuthUser() user: User,
  ) {
    return this.reservationsService.getAvailabilities(
      roomId,
      user.id,
      query.startDate,
      query.endDate,
    );
  }

  /**
   * Get a specific reservation by ID
   * @param buildingId - Building ID
   * @param storyId - Story ID
   * @param roomId - Room ID
   * @param id - Reservation ID
   * @param user - Current authenticated user
   * @returns Reservation data
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get reservation by ID' })
  @ApiParam({ name: 'buildingId', description: 'Building ID' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiParam({ name: 'id', description: 'Reservation ID' })
  @ApiResponse({ status: 200, description: 'Reservation found' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  findOne(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('storyId', ParseIntPipe) storyId: number,
    @Param('roomId', ParseIntPipe) roomId: number,
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: User,
  ) {
    return this.reservationsService.findOne(id, user.id);
  }

  /**
   * Create a new room reservation
   * @param buildingId - Building ID
   * @param storyId - Story ID
   * @param roomId - Room ID
   * @param body - Reservation details (title, description, startTime, endTime, invitees)
   * @param user - Current authenticated user with access to the room
   * @returns Newly created reservation (with warning if capacity exceeded)
   */
  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiParam({ name: 'buildingId', description: 'Building ID' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiBody({ type: CreateReservationDto })
  @ApiResponse({ status: 201, description: 'Reservation created' })
  @ApiResponse({ status: 403, description: 'Room already booked or no access' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  create(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body() body: CreateReservationDto,
    @AuthUser() user: User,
  ) {
    return this.reservationsService.create(roomId, body, user.id, user.role);
  }

  /**
   * Update an existing reservation
   * @param buildingId - Building ID
   * @param storyId - Story ID
   * @param roomId - Room ID
   * @param id - Reservation ID
   * @param body - Updated reservation details
   * @param user - Current authenticated user (must be the organizer)
   * @returns Updated reservation (with warning if capacity exceeded)
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a reservation' })
  @ApiParam({ name: 'buildingId', description: 'Building ID' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiParam({ name: 'id', description: 'Reservation ID' })
  @ApiBody({ type: UpdateReservationDto })
  @ApiResponse({ status: 200, description: 'Reservation updated' })
  @ApiResponse({ status: 403, description: 'Not authorized or room already booked' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  update(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateReservationDto,
    @AuthUser() user: User,
  ) {
    return this.reservationsService.update(id, body, user.id);
  }

  /**
   * Delete a reservation
   * @param buildingId - Building ID
   * @param storyId - Story ID
   * @param roomId - Room ID
   * @param id - Reservation ID
   * @param user - Current authenticated user (must be the organizer)
   * @returns Success message
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reservation' })
  @ApiParam({ name: 'buildingId', description: 'Building ID' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiParam({ name: 'id', description: 'Reservation ID' })
  @ApiResponse({ status: 200, description: 'Reservation deleted' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  delete(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('storyId', ParseIntPipe) storyId: number,
    @Param('roomId', ParseIntPipe) roomId: number,
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: User,
  ) {
    return this.reservationsService.delete(id, user.id);
  }
}
