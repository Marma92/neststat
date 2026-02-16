import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBuildingDto {
  @ApiProperty({ description: 'Building name', example: 'Main Office' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Company ID', example: 1 })
  @IsNumber()
  companyId: number;

  @ApiPropertyOptional({ description: 'Building address', example: '123 Main St' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateBuildingDto {
  @ApiPropertyOptional({ description: 'Building name', example: 'New Building Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Building address', example: '456 New St' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class AddUserToBuildingDto {
  @ApiProperty({ description: 'User ID to add', example: 1 })
  @IsNumber()
  userId: number;
}
