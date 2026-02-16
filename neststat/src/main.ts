import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';
import type { Request, Response, NextFunction } from 'express';

const SESSION_MAX_AGE = 3 * 24 * 60 * 60 * 1000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(
    session({
      secret:
        process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
      resave: true,
      saveUninitialized: false,
      cookie: {
        maxAge: SESSION_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    }),
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    const sess = req.session as session.Session & { user?: unknown };
    if (sess.user && sess.cookie) {
      sess.cookie.maxAge = SESSION_MAX_AGE;
    }
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('NestStat API')
    .setDescription('The NestStat API description')
    .setVersion('1.0')
    .addCookieAuth('connect.sid')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
