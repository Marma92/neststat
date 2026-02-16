import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { BuildingsModule } from './buildings/buildings.module';
import { User } from './users/user.entity';
import { Company } from './companies/company.entity';
import { Building } from './buildings/building.entity';
import { AuthGuard } from './auth/guards/auth.guard';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [User, Company, Building],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    CompaniesModule,
    BuildingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
