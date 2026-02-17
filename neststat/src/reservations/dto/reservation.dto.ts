import { IsString, IsOptional, IsDateString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new room reservation
 */
export class CreateReservationDto {
  @ApiProperty({ description: 'Reservation title', example: 'Team Meeting' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Reservation description', example: 'Weekly sync' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Start time of the reservation (ISO 8601 format)', example: '2024-01-15T10:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'End time of the reservation (ISO 8601 format)', example: '2024-01-15T11:00:00Z' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ description: 'Array of user IDs to invite', example: [2, 3, 4] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  invitees?: number[];
}

/**
 * DTO for updating an existing reservation
 */
export class UpdateReservationDto {
  @ApiPropertyOptional({ description: 'Reservation title', example: 'Updated Meeting' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Reservation description', example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Start time of the reservation (ISO 8601 format)', example: '2024-01-15T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time of the reservation (ISO 8601 format)', example: '2024-01-15T11:00:00Z' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Array of user IDs to invite', example: [2, 3, 4] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  invitees?: number[];
}

/**
 * DTO for querying room availability
 */
export class ReservationQueryDto {
  @ApiPropertyOptional({ description: 'Start date for availability check (ISO 8601 format)', example: '2024-01-15T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

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
