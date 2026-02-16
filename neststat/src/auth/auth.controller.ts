import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { ValidationPipe } from '../validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UsePipes(new ValidationPipe())
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('register')
  @UsePipes(new ValidationPipe())
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }
}
