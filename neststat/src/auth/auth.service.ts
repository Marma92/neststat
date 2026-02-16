import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async validateUser(
    username: string,
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findOne(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      void password;
      return result;
    }
    return null;
  }

  async login(user: LoginDto) {
    try {
      const validUser = await this.validateUser(user.username, user.password);
      if (!validUser) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return {
        message: 'Login successful',
        user: {
          id: validUser.id,
          username: validUser.username,
          role: validUser.role,
        },
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('An error occurred during login');
    }
  }

  async register(data: RegisterDto) {
    try {
      const existing = await this.usersService.findOne(data.username);
      if (existing) {
        throw new UnauthorizedException('User already exists');
      }
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const role = data.role ?? UserRole.USER;
      const user = await this.usersService.create(
        data.username,
        hashedPassword,
        role,
      );
      const { password: pwd, ...result } = user;
      void pwd;
      return { message: 'Registration successful', user: result };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred during registration',
      );
    }
  }
}
