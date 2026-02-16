import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

interface LoginDto {
  username: string;
  password: string;
}

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
      return result;
    }
    return null;
  }

  async login(user: LoginDto) {
    if (!user.username || !user.password) {
      throw new BadRequestException('Username and password are required');
    }
    const validUser = await this.validateUser(user.username, user.password);
    if (!validUser) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return {
      message: 'Login successful',
      user: { id: validUser.id, username: validUser.username },
    };
  }

  async register(username: string, password: string) {
    if (!username || !password) {
      throw new BadRequestException('Username and password are required');
    }
    const existing = await this.usersService.findOne(username);
    if (existing) {
      throw new UnauthorizedException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.create(username, hashedPassword);
    const { password: pwd, ...result } = user;
    void pwd;
    return { message: 'Registration successful', user: result };
  }
}
