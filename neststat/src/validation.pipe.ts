import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

type Type<T = unknown> = new (...args: unknown[]) => T;

@Injectable()
export class ValidationPipe implements PipeTransform<unknown> {
  async transform(
    value: unknown,
    { metatype }: ArgumentMetadata,
  ): Promise<unknown> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object: unknown = plainToInstance(metatype, value);
    const errors = await validate(object as object);
    if (errors.length > 0) {
      const messages = errors.map((err) =>
        Object.values(err.constraints ?? {}).join(', '),
      );
      throw new BadRequestException(messages);
    }
    return object;
  }

  private toValidate(metatype: Type): boolean {
    const types: Type[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
