import { describe, it, expect } from 'vitest';
import { Mapper } from '../../src';

describe('Smoke Test', () => {
  it('should import Mapper successfully', () => {
    expect(Mapper).toBeDefined();
    expect(typeof Mapper.create).toBe('function');
  });

  it('should create a basic mapper and execute transformation', () => {
    type Source = {
      firstName: string;
      lastName: string;
      age: number;
    };

    type Target = {
      fullName: string;
      isAdult: boolean;
    };

    const mapper = Mapper.create<Source, Target>({
      fullName: (source) => `${source.firstName} ${source.lastName}`,
      isAdult: (source) => source.age >= 18,
    });

    const source: Source = {
      firstName: 'John',
      lastName: 'Doe',
      age: 30,
    };

    const { result, errors } = mapper.execute(source);

    expect(errors).toHaveLength(0);
    expect(result.fullName).toBe('John Doe');
    expect(result.isAdult).toBe(true);
  });

  it('should handle simple property mapping', () => {
    type Source = {
      name: string;
      email: string;
    };

    type Target = {
      userName: string;
      userEmail: string;
    };

    const mapper = Mapper.create<Source, Target>({
      userName: 'name',
      userEmail: 'email',
    });

    const source: Source = {
      name: 'Alice',
      email: 'alice@example.com',
    };

    const { result, errors } = mapper.execute(source);

    expect(errors).toHaveLength(0);
    expect(result.userName).toBe('Alice');
    expect(result.userEmail).toBe('alice@example.com');
  });
});

