import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

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
        this.logger.warn('Failed login attempt', {
          context: 'AuthService',
          username: user.username,
        });
        throw new UnauthorizedException('Invalid credentials');
      }
      
      this.logger.info('User logged in successfully', {
        context: 'AuthService',
        userId: validUser.id,
        username: validUser.username,
        role: validUser.role,
      });

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
      this.logger.error('Unexpected error during login', {
        context: 'AuthService',
        error: error instanceof Error ? error.message : 'Unknown error',
        username: user.username,
      });
      throw new InternalServerErrorException('An error occurred during login');
    }
  }

  async register(data: RegisterDto) {
    try {
      const existing = await this.usersService.findOne(data.username);
      if (existing) {
        this.logger.warn('Registration attempt with existing username', {
          context: 'AuthService',
          username: data.username,
        });
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

      this.logger.info('New user registered', {
        context: 'AuthService',
        userId: user.id,
        username: user.username,
        role: user.role,
      });

      return { message: 'Registration successful', user: result };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error('Unexpected error during registration', {
        context: 'AuthService',
        error: error instanceof Error ? error.message : 'Unknown error',
        username: data.username,
      });
      throw new InternalServerErrorException(
        'An error occurred during registration',
      );
    }
  }
}
