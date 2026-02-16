import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from '../users/user.entity';
import type { Request } from 'express';

interface MockSession {
  user: { id: number; username: string; role: UserRole } | null;
  destroy: (cb: () => void) => void;
}

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Partial<AuthService>;

  const mockSession: MockSession = {
    user: null,
    destroy: jest.fn((cb: () => void) => cb()),
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn().mockResolvedValue({
        message: 'Login successful',
        user: { id: 1, username: 'testuser', role: UserRole.USER },
      }),
      register: jest.fn().mockResolvedValue({
        message: 'Registration successful',
        user: { id: 1, username: 'testuser', role: UserRole.USER },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    it('should set user in session on successful login', async () => {
      const req = { session: { ...mockSession } };

      await controller.login(
        { username: 'testuser', password: 'password123' },
        req as unknown as Request,
      );

      expect(req.session.user).toEqual({
        id: 1,
        username: 'testuser',
        role: UserRole.USER,
      });
    });

    it('should return login result', async () => {
      const req = { session: { ...mockSession } };

      const result = await controller.login(
        { username: 'testuser', password: 'password123' },
        req as unknown as Request,
      );

      expect(result.message).toBe('Login successful');
      expect(result.user.username).toBe('testuser');
    });
  });

  describe('logout', () => {
    it('should destroy session on logout', async () => {
      const req = {
        session: {
          ...mockSession,
          user: { id: 1, username: 'test', role: UserRole.USER },
        },
      };

      await controller.logout(req as unknown as Request);

      expect(req.session.destroy).toHaveBeenCalled();
    });

    it('should return logout success message', async () => {
      const req = {
        session: {
          ...mockSession,
          user: { id: 1, username: 'test', role: UserRole.USER },
        },
      };

      const result = await controller.logout(req as unknown as Request);

      expect(result.message).toBe('Logout successful');
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const result = await controller.register({
        username: 'newuser',
        password: 'password123',
      });

      expect(result.message).toBe('Registration successful');
      expect(authService.register).toHaveBeenCalledWith({
        username: 'newuser',
        password: 'password123',
      });
    });
  });
});
