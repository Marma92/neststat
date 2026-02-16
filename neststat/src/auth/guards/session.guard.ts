import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

interface SessionUser {
  id: number;
  username: string;
  role: string;
}

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
  }
}

@Injectable()
export class SessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const session = request.session;

    if (!session.user) {
      throw new UnauthorizedException('Not authenticated');
    }

    return true;
  }
}
