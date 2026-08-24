import { describe, it, expect } from 'vitest';
import { plainToInstance, Type } from '../../../src';

describe('enableImplicitConversion', () => {
  class Dto {
    @Type(() => Number)
    age!: number;
    @Type(() => String)
    label!: string;
    @Type(() => Boolean)
    active!: boolean;
    @Type(() => Date)
    createdAt!: Date;
  }

  it('coerces primitives via @Type when enabled', () => {
    const dto = plainToInstance(
      Dto,
      { age: '42', label: 7, active: 1, createdAt: '2020-01-02T00:00:00.000Z' },
      { enableImplicitConversion: true },
    );
    expect(dto.age).toBe(42);
    expect(dto.label).toBe('7');
    expect(dto.active).toBe(true);
    expect(dto.createdAt).toBeInstanceOf(Date);
    expect(dto.createdAt.toISOString()).toBe('2020-01-02T00:00:00.000Z');
  });

  it('passes null/undefined through', () => {
    const dto = plainToInstance(Dto, { age: null }, { enableImplicitConversion: true });
    expect(dto.age).toBeNull();
  });

  it('without the flag values stay as-is', () => {
    const dto = plainToInstance(Dto, { age: '42' });
    expect(dto.age).toBe('42');
  });
});
