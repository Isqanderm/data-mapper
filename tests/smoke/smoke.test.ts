import { describe, it, expect } from 'vitest';
import { Mapper, Map, MapFrom } from '../../src';

describe('Smoke Test - Decorator API', () => {
  it('should import decorators successfully', () => {
    expect(Mapper).toBeDefined();
    expect(Map).toBeDefined();
    expect(MapFrom).toBeDefined();
  });

  it('should create a basic mapper and execute transformation', () => {
    type Source = {
      firstName: string;
      lastName: string;
      age: number;
    };

    @Mapper()
    class UserMapper {
      @MapFrom((source: Source) => `${source.firstName} ${source.lastName}`)
      fullName!: string;

      @MapFrom((source: Source) => source.age >= 18)
      isAdult!: boolean;
    }

    const mapper = new UserMapper();
    const source: Source = {
      firstName: 'John',
      lastName: 'Doe',
      age: 30,
    };

    const result = mapper.transform(source);

    expect(result.fullName).toBe('John Doe');
    expect(result.isAdult).toBe(true);
  });

  it('should handle simple property mapping', () => {
    type Source = {
      name: string;
      email: string;
    };

    @Mapper()
    class UserMapper {
      @Map('name')
      userName!: string;

      @Map('email')
      userEmail!: string;
    }

    const mapper = new UserMapper();
    const source: Source = {
      name: 'Alice',
      email: 'alice@example.com',
    };

    const result = mapper.transform(source);

    expect(result.userName).toBe('Alice');
    expect(result.userEmail).toBe('alice@example.com');
  });
});

