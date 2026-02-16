import { IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { UserRole } from '../../users/user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for user login
 */
export class LoginDto {
  @ApiProperty({ description: 'Username or email', example: 'johndoe' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'User password', example: 'password123' })
  @IsString()
  password: string;
}

/**
 * DTO for user registration
 */
export class RegisterDto {
  @ApiProperty({ description: 'Username', example: 'johndoe', minLength: 3 })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ description: 'User password', example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    example: UserRole.USER,
    default: UserRole.USER,
  })
  @IsOptional()
  @IsIn([UserRole.ADMIN, UserRole.HANDLER, UserRole.USER])
  role?: UserRole;
}
