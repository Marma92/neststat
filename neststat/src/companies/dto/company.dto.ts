import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Company name', example: 'Acme Corp' })
  @IsString()
  name: string;
}

export class UpdateCompanyDto {
  @ApiProperty({ description: 'Company name', example: 'New Company Name' })
  @IsString()
  name: string;
}
