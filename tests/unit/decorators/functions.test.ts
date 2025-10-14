import { describe, it, expect } from 'vitest';
import {
  Mapper,
  Map,
  MapFrom,
  createMapper,
  plainToInstance,
  plainToInstanceArray,
  tryPlainToInstance,
  tryPlainToInstanceArray,
  getMapper,
} from '../../../src/decorators';

describe('Mapper Helper Functions', () => {
  type UserSource = {
    firstName: string;
    lastName: string;
    age: number;
    email: string;
  };

  type UserDTO = {
    fullName: string;
    email: string;
    isAdult: boolean;
  };

  @Mapper<UserSource, UserDTO>()
  class UserMapper {
    @MapFrom((src: UserSource) => `${src.firstName} ${src.lastName}`)
    fullName!: string;

    @Map('email')
    email!: string;

    @MapFrom((src: UserSource) => src.age >= 18)
    isAdult!: boolean;
  }

  const source: UserSource = {
    firstName: 'John',
    lastName: 'Doe',
    age: 30,
    email: 'john@example.com',
  };

  describe('createMapper', () => {
    it('should create a type-safe mapper instance', () => {
      const mapper = createMapper<UserSource, UserDTO>(UserMapper);

      expect(mapper).toBeDefined();
      expect(typeof mapper.transform).toBe('function');
      expect(typeof mapper.tryTransform).toBe('function');
    });

    it('should transform correctly', () => {
      const mapper = createMapper<UserSource, UserDTO>(UserMapper);
      const result = mapper.transform(source);

      expect(result.fullName).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.isAdult).toBe(true);
    });
  });

  describe('plainToInstance', () => {
    it('should transform plain object to instance in one call', () => {
      const result = plainToInstance<UserSource, UserDTO>(UserMapper, source);

      expect(result.fullName).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.isAdult).toBe(true);
    });

    it('should work with different source objects', () => {
      const youngUser: UserSource = {
        firstName: 'Jane',
        lastName: 'Smith',
        age: 16,
        email: 'jane@example.com',
      };

      const result = plainToInstance<UserSource, UserDTO>(UserMapper, youngUser);

      expect(result.fullName).toBe('Jane Smith');
      expect(result.isAdult).toBe(false);
    });
  });

  describe('plainToInstanceArray', () => {
    it('should transform array of plain objects', () => {
      const sources: UserSource[] = [
        {
          firstName: 'John',
          lastName: 'Doe',
          age: 30,
          email: 'john@example.com',
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          age: 25,
          email: 'jane@example.com',
        },
      ];

      const results = plainToInstanceArray<UserSource, UserDTO>(UserMapper, sources);

      expect(results).toHaveLength(2);
      expect(results[0].fullName).toBe('John Doe');
      expect(results[1].fullName).toBe('Jane Smith');
    });

    it('should handle empty array', () => {
      const results = plainToInstanceArray<UserSource, UserDTO>(UserMapper, []);

      expect(results).toEqual([]);
    });
  });

  describe('tryPlainToInstance', () => {
    it('should transform with error handling', () => {
      const { result, errors } = tryPlainToInstance<UserSource, UserDTO>(UserMapper, source);

      expect(result.fullName).toBe('John Doe');
      expect(errors).toEqual([]);
    });

    it('should collect errors in safe mode', () => {
      type Source = { value?: string };
      type Target = { result: string };

      @Mapper<Source, Target>()
      class TestMapper {
        @MapFrom((src: Source) => {
          if (!src.value) throw new Error('Value is required');
          return src.value.toUpperCase();
        })
        result!: string;
      }

      const { errors } = tryPlainToInstance<Source, Target>(TestMapper, {});

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('tryPlainToInstanceArray', () => {
    it('should transform array with error handling', () => {
      const sources: UserSource[] = [
        {
          firstName: 'John',
          lastName: 'Doe',
          age: 30,
          email: 'john@example.com',
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          age: 25,
          email: 'jane@example.com',
        },
      ];

      const results = tryPlainToInstanceArray<UserSource, UserDTO>(UserMapper, sources);

      expect(results).toHaveLength(2);
      expect(results[0].result.fullName).toBe('John Doe');
      expect(results[0].errors).toEqual([]);
      expect(results[1].result.fullName).toBe('Jane Smith');
      expect(results[1].errors).toEqual([]);
    });
  });

  describe('getMapper', () => {
    it('should create a reusable mapper instance', () => {
      const mapper = getMapper<UserSource, UserDTO>(UserMapper);

      const result1 = mapper.transform(source);
      const result2 = mapper.transform({
        firstName: 'Jane',
        lastName: 'Smith',
        age: 25,
        email: 'jane@example.com',
      });

      expect(result1.fullName).toBe('John Doe');
      expect(result2.fullName).toBe('Jane Smith');
    });
  });

  describe('Type Safety', () => {
    it('should provide full TypeScript type safety', () => {
      // This test verifies that TypeScript compilation works correctly
      // The actual type checking happens at compile time

      const mapper = createMapper<UserSource, UserDTO>(UserMapper);
      const result = mapper.transform(source);

      // TypeScript should know these properties exist
      const fullName: string = result.fullName;
      const email: string = result.email;
      const isAdult: boolean = result.isAdult;

      expect(fullName).toBe('John Doe');
      expect(email).toBe('john@example.com');
      expect(isAdult).toBe(true);
    });

    it('should work with plainToInstance', () => {
      const result = plainToInstance<UserSource, UserDTO>(UserMapper, source);

      // TypeScript should know the exact type
      const fullName: string = result.fullName;
      const email: string = result.email;
      const isAdult: boolean = result.isAdult;

      expect(fullName).toBe('John Doe');
      expect(email).toBe('john@example.com');
      expect(isAdult).toBe(true);
    });
  });

  describe('Nested Mappers', () => {
    type AddressSource = {
      street: string;
      city: string;
    };

    type AddressDTO = {
      fullAddress: string;
    };

    type PersonSource = {
      name: string;
      address: AddressSource;
    };

    type PersonDTO = {
      name: string;
      location: AddressDTO;
    };

    @Mapper<AddressSource, AddressDTO>()
    class AddressMapper {
      @MapFrom((src: AddressSource) => `${src.street}, ${src.city}`)
      fullAddress!: string;
    }

    @Mapper<PersonSource, PersonDTO>()
    class PersonMapper {
      @Map('name')
      name!: string;

      @MapFrom((src: PersonSource) => {
        return plainToInstance<AddressSource, AddressDTO>(AddressMapper, src.address);
      })
      location!: AddressDTO;
    }

    it('should work with nested mappers using plainToInstance', () => {
      const personSource: PersonSource = {
        name: 'John Doe',
        address: {
          street: '123 Main St',
          city: 'New York',
        },
      };

      const result = plainToInstance<PersonSource, PersonDTO>(PersonMapper, personSource);

      expect(result.name).toBe('John Doe');
      expect(result.location.fullAddress).toBe('123 Main St, New York');
    });
  });
});

