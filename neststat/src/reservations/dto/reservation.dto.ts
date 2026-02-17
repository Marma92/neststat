import { IsString, IsOptional, IsDateString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new room reservation
 */
export class CreateReservationDto {
  /**
   * Reservation title
   * @example 'Team Meeting'
   */
  @ApiProperty({ description: 'Reservation title', example: 'Team Meeting' })
  @IsString()
  title: string;

  /**
   * Optional reservation description
   * @example 'Weekly sync meeting with the engineering team'
   */
  @ApiPropertyOptional({ description: 'Reservation description', example: 'Weekly sync' })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Start time of the reservation in ISO 8601 format
   * 
   * Business Rules:
   * - Must be at least 15 minutes in the future (configurable via MIN_ADVANCE_BOOKING_MINUTES)
   * - Must be within business hours: 8:00 AM - 8:00 PM (configurable via BUSINESS_HOURS_START/END)
   * - Cannot be more than 90 days in advance (configurable via MAX_ADVANCE_BOOKING_DAYS)
   * - Must be before endTime
   * 
   * @example '2024-01-15T10:00:00Z'
   */
  @ApiProperty({ description: 'Start time of the reservation (ISO 8601 format)', example: '2024-01-15T10:00:00Z' })
  @IsDateString()
  startTime: string;

  /**
   * End time of the reservation in ISO 8601 format
   * 
   * Business Rules:
   * - Must be after startTime
   * - Duration cannot exceed 8 hours (configurable via MAX_RESERVATION_HOURS)
   * - Must be within business hours: 8:00 AM - 8:00 PM (configurable via BUSINESS_HOURS_END)
   * - A 15-minute buffer is automatically added after this time (configurable via BUFFER_TIME_MINUTES)
   * 
   * @example '2024-01-15T11:00:00Z'
   */
  @ApiProperty({ description: 'End time of the reservation (ISO 8601 format)', example: '2024-01-15T11:00:00Z' })
  @IsDateString()
  endTime: string;

  /**
   * Optional array of user IDs to invite to the reservation
   * 
   * Notes:
   * - All user IDs must exist in the system
   * - Total participants (organizer + invitees) will be checked against room capacity
   * - A warning is returned (not an error) if capacity is exceeded
   * 
   * @example [2, 3, 4]
   */
  @ApiPropertyOptional({ description: 'Array of user IDs to invite', example: [2, 3, 4] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  invitees?: number[];
}

/**
 * DTO for updating an existing reservation
 * Only the organizer can update their reservation
 */
export class UpdateReservationDto {
  /**
   * Updated reservation title
   * @example 'Updated Team Meeting'
   */
  @ApiPropertyOptional({ description: 'Reservation title', example: 'Updated Meeting' })
  @IsOptional()
  @IsString()
  title?: string;

  /**
   * Updated reservation description
   * @example 'Updated weekly sync meeting'
   */
  @ApiPropertyOptional({ description: 'Reservation description', example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Updated start time in ISO 8601 format
   * Same business rules as CreateReservationDto.startTime apply
   * @see CreateReservationDto.startTime
   * @example '2024-01-15T10:00:00Z'
   */
  @ApiPropertyOptional({ description: 'Start time of the reservation (ISO 8601 format)', example: '2024-01-15T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  /**
   * Updated end time in ISO 8601 format
   * Same business rules as CreateReservationDto.endTime apply
   * @see CreateReservationDto.endTime
   * @example '2024-01-15T11:00:00Z'
   */
  @ApiPropertyOptional({ description: 'End time of the reservation (ISO 8601 format)', example: '2024-01-15T11:00:00Z' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  /**
   * Updated array of user IDs to invite
   * Replaces the existing invitee list completely
   * @example [2, 3, 4, 5]
   */
  @ApiPropertyOptional({ description: 'Array of user IDs to invite', example: [2, 3, 4] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  invitees?: number[];
}

/**
 * DTO for querying room availability
 * Returns existing reservations and calculated available time slots
 */
export class ReservationQueryDto {
  /**
   * Start date for availability check in ISO 8601 format
   * If not provided, defaults to current date
   * @example '2024-01-15T00:00:00Z'
   */
  @ApiPropertyOptional({ description: 'Start date for availability check (ISO 8601 format)', example: '2024-01-15T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  /**
   * End date for availability check in ISO 8601 format
   * If not provided, defaults to 7 days from current date
   * @example '2024-01-15T23:59:59Z'
   */
  @ApiPropertyOptional({ description: 'End date for availability check (ISO 8601 format)', example: '2024-01-15T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * DTO representing a reservation response
 */
export class ReservationResponseDto {
  @ApiProperty({ description: 'Reservation ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Reservation title', example: 'Team Meeting' })
  title: string;

  @ApiPropertyOptional({ description: 'Reservation description', example: 'Weekly sync' })
  description?: string;

  @ApiProperty({ description: 'Start time of the reservation', example: '2024-01-15T10:00:00Z' })
  startTime: Date;

  @ApiProperty({ description: 'End time of the reservation', example: '2024-01-15T11:00:00Z' })
  endTime: Date;

  @ApiProperty({ description: 'Room ID', example: 1 })
  roomId: number;

  @ApiProperty({ description: 'Organizer ID', example: 1 })
  organizerId: number;
}

/**
 * DTO for reservation creation/update response with optional warning
 */
export class ReservationResultDto {
  @ApiProperty({ type: ReservationResponseDto, description: 'Reservation data' })
  reservation: ReservationResponseDto;

  @ApiPropertyOptional({ description: 'Warning message when capacity is exceeded', example: 'Warning: The number of participants (15) exceeds the room capacity (10)' })
  warning?: string;
}
