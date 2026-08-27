import { describe, it, expect } from 'vitest';
import {
  TransformClassToPlain,
  TransformClassToClass,
  TransformPlainToClass,
  Expose,
  Exclude,
} from '../../../src';

class UserDto {
  @Expose()
  name!: string;

  @Exclude()
  password!: string;
}

function makeUser(): UserDto {
  const u = new UserDto();
  u.name = 'ada';
  u.password = 'hunter2';
  return u;
}

class Service {
  @TransformClassToPlain()
  getUser() {
    return makeUser();
  }

  @TransformClassToClass()
  cloneUser() {
    return makeUser();
  }

  @TransformPlainToClass(UserDto)
  getPlain() {
    return { name: 'ada', password: 'hunter2' };
  }
}

describe('transform method decorators', () => {
  const service = new Service();

  it('@TransformClassToPlain converts the return value to a plain object', () => {
    const result = service.getUser();
    expect(result).not.toBeInstanceOf(UserDto);
    expect((result as any).name).toBe('ada');
    expect(result).not.toHaveProperty('password');
  });

  it('@TransformClassToClass deep-clones the return value', () => {
    const original = makeUser();
    const result = service.cloneUser();
    expect(result).toBeInstanceOf(UserDto);
    expect(result).not.toBe(original);
  });

  it('@TransformPlainToClass converts plain return values to instances', () => {
    const result = service.getPlain();
    expect(result).toBeInstanceOf(UserDto);
  });
});
