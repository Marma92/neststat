import { Controller, Post, Body, UsePipes, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { ValidationPipe } from '../validation.pipe';
import { Public } from './decorators/public.decorator';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @UsePipes(new ValidationPipe())
  async login(@Body() body: LoginDto, @Req() req: Request) {
    const result = await this.authService.login(body);
    req.session.user = {
      id: result.user.id,
      username: result.user.username,
      role: result.user.role,
    };
    return result;
  }

  @Public()
  @Post('register')
  @UsePipes(new ValidationPipe())
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('logout')
  async logout(@Req() req: Request) {
    await new Promise<void>((resolve) => {
      req.session.destroy(() => resolve());
    });
    return { message: 'Logout successful' };
  }
}
