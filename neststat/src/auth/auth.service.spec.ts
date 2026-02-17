import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Partial<UsersService>;

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    password: 'hashedpassword',
    role: UserRole.USER,
  };

  beforeEach(async () => {
    usersService = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(null);
      (usersService.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        username: 'newuser',
      });

      const result = await service.register({
        username: 'newuser',
        password: 'password123',
      });

      expect(result.message).toBe('Registration successful');
      expect(result.user.username).toBe('newuser');
      expect(usersService.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user already exists', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.register({
          username: 'testuser',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should assign default role USER when not specified', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(null);
      (usersService.create as jest.Mock).mockResolvedValue({ ...mockUser });

      await service.register({ username: 'user', password: 'password123' });

      expect(usersService.create).toHaveBeenCalledWith(
        'user',
        expect.any(String),
        UserRole.USER,
      );
    });

    it('should assign specified role', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(null);
      (usersService.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: UserRole.ADMIN,
      });

      await service.register({
        username: 'admin',
        password: 'password123',
        role: UserRole.ADMIN,
      });

      expect(usersService.create).toHaveBeenCalledWith(
        'admin',
        expect.any(String),
        UserRole.ADMIN,
      );
    });

    it('should throw InternalServerErrorException on database error', async () => {
      (usersService.findOne as jest.Mock).mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        service.register({ username: 'user', password: 'password123' }),
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      (usersService.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const result = await service.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result.message).toBe('Login successful');
      expect(result.user.username).toBe('testuser');
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({
          username: 'testuser',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return user with role on successful login', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      (usersService.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
        role: UserRole.ADMIN,
      });

      const result = await service.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result.user.role).toBe(UserRole.ADMIN);
    });
  });

  describe('validateUser', () => {
    it('should return user without password when valid', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      (usersService.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const result = await service.validateUser('testuser', 'password123');

      expect(result).toEqual({
        id: 1,
        username: 'testuser',
        role: UserRole.USER,
      });
    });

    it('should return null when user not found', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser('testuser', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      (usersService.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });
  });
});
