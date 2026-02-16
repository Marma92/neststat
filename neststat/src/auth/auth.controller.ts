import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { Public } from './decorators/public.decorator';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

/**
 * Authentication controller handling login, register and logout
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Login an existing user
   * @param body - Login credentials (email/username and password)
   * @param req - Express request object
   * @returns User data and access token
   */
  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'User logged in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: LoginDto, @Req() req: Request) {
    const result = await this.authService.login(body);
    req.session.user = {
      id: result.user.id,
      username: result.user.username,
      role: result.user.role,
    };
    return result;
  }

  /**
   * Register a new user account
   * @param body - Registration details (email, username, password)
   * @returns Newly created user data
   */
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  /**
   * Logout the currently authenticated user
   * @param req - Express request object
   * @returns Success message
   */
  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  async logout(@Req() req: Request) {
    await new Promise<void>((resolve) => {
      req.session.destroy(() => resolve());
    });
    return { message: 'Logout successful' };
  }
}
