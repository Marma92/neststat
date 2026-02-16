import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoryDto {
  @ApiProperty({ description: 'Story name', example: 'Ground Floor' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Floor number', example: 1 })
  @IsNumber()
  floor: number;
}

export class UpdateStoryDto {
  @ApiPropertyOptional({ description: 'Story name', example: 'First Floor' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Floor number', example: 2 })
  @IsOptional()
  @IsNumber()
  floor?: number;
}
