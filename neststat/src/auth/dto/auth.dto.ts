import { IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

export class RegisterDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsIn([UserRole.ADMIN, UserRole.HANDLER, UserRole.USER])
  role?: UserRole;
}
