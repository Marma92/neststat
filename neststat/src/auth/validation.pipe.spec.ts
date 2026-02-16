import { ValidationPipe } from '../validation.pipe';
import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto/auth.dto';

describe('ValidationPipe', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe();
  });

  describe('transform', () => {
    it('should pass through non-class types', async () => {
      const metadata: ArgumentMetadata = { type: 'body', metatype: String };
      const value = 'plain string';

      const result = await pipe.transform(value, metadata);

      expect(result).toBe(value);
    });

    it('should validate and return object for DTO', async () => {
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: RegisterDto,
      };
      const value = { username: 'testuser', password: 'password123' };

      const result = await pipe.transform(value, metadata);

      expect(result).toBeInstanceOf(RegisterDto);
      expect(result.username).toBe('testuser');
      expect(result.password).toBe('password123');
    });

    it('should throw BadRequestException for invalid DTO', async () => {
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: RegisterDto,
      };
      const value = { username: 'ab', password: '123' };

      await expect(pipe.transform(value, metadata)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when username is missing', async () => {
      const metadata: ArgumentMetadata = { type: 'body', metatype: LoginDto };
      const value = { password: 'password123' };

      await expect(pipe.transform(value, metadata)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when password is missing', async () => {
      const metadata: ArgumentMetadata = { type: 'body', metatype: LoginDto };
      const value = { username: 'testuser' };

      await expect(pipe.transform(value, metadata)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
