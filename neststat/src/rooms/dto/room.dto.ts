import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ description: 'Room name', example: 'Room 101' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Room description', example: 'Meeting room' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Room capacity', example: 10 })
  @IsOptional()
  @IsNumber()
  capacity?: number;
}

export class UpdateRoomDto {
  @ApiPropertyOptional({ description: 'Room name', example: 'Conference Room' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Room description', example: 'Large meeting room' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Room capacity', example: 20 })
  @IsOptional()
  @IsNumber()
  capacity?: number;
}

export class RoomItemDto {
  @ApiProperty({ description: 'Room name', example: 'Room 101' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Room description', example: 'Meeting room' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Room capacity', example: 10 })
  @IsOptional()
  @IsNumber()
  capacity?: number;
}

export class BulkCreateRoomsDto {
  @ApiProperty({ type: [RoomItemDto], description: 'Array of rooms to create' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomItemDto)
  rooms: RoomItemDto[];
}
