import { describe, it, expect } from 'vitest';
import {
  MapperDecorator as Mapper,
  Map,
  MapFrom,
  Default,
  Transform,
  MapWith,
  Ignore,
} from '../src/decorators';

describe('Decorator-Based Mapper', () => {
  describe('@Mapper decorator', () => {
    it('should create a mapper class', () => {
      @Mapper()
      class TestMapper {
        @Map('name')
        fullName!: string;
      }

      const mapper = new TestMapper();
      expect(mapper).toBeDefined();
      expect(typeof mapper.transform).toBe('function');
    });

    it('should support unsafe mode', () => {
      @Mapper({ unsafe: true })
      class TestMapper {
        @Map('name')
        fullName!: string;
      }

      const mapper = new TestMapper();
      expect(mapper).toBeDefined();
    });
  });

  describe('@Map decorator', () => {
    it('should map simple property', () => {
      type Source = { name: string };

      @Mapper()
      class TestMapper {
        @Map('name')
        fullName!: string;
      }

      const mapper = new TestMapper();
      const source: Source = { name: 'John Doe' };
      const result = mapper.transform(source);

      expect(result.fullName).toBe('John Doe');
    });

    it('should map nested property', () => {
      type Source = {
        user: {
          profile: {
            email: string;
          };
        };
      };

      @Mapper()
      class TestMapper {
        @Map('user.profile.email')
        email!: string;
      }

      const mapper = new TestMapper();
      const source: Source = {
        user: {
          profile: {
            email: 'john@example.com',
          },
        },
      };
      const result = mapper.transform(source);

      expect(result.email).toBe('john@example.com');
    });
  });

  describe('@MapFrom decorator', () => {
    it('should transform using custom function', () => {
      type Source = {
        firstName: string;
        lastName: string;
      };

      @Mapper()
      class TestMapper {
        @MapFrom((s: Source) => `${s.firstName} ${s.lastName}`)
        fullName!: string;
      }

      const mapper = new TestMapper();
      const source: Source = {
        firstName: 'John',
        lastName: 'Doe',
      };
      const result = mapper.transform(source);

      expect(result.fullName).toBe('John Doe');
    });

    it('should support complex transformations', () => {
      type Source = {
        age: number;
      };

      @Mapper()
      class TestMapper {
        @MapFrom((s: Source) => s.age >= 18)
        isAdult!: boolean;
      }

      const mapper = new TestMapper();
      const result1 = mapper.transform({ age: 25 });
      const result2 = mapper.transform({ age: 15 });

      expect(result1.isAdult).toBe(true);
      expect(result2.isAdult).toBe(false);
    });
  });

  describe('@Default decorator', () => {
    it('should set default value', () => {
      type Source = {
        age?: number;
      };

      @Mapper()
      class TestMapper {
        @Default(false)
        @MapFrom((s: Source) => (s.age ? s.age >= 18 : undefined))
        isAdult!: boolean;
      }

      const mapper = new TestMapper();
      const result = mapper.transform({});

      expect(result.isAdult).toBe(false);
    });
  });

  describe('@Transform decorator', () => {
    it('should transform mapped value', () => {
      type Source = {
        email: string;
      };

      @Mapper()
      class TestMapper {
        @Transform((value: string) => value.toUpperCase())
        @Map('email')
        emailUpper!: string;
      }

      const mapper = new TestMapper();
      const source: Source = { email: 'john@example.com' };
      const result = mapper.transform(source);

      expect(result.emailUpper).toBe('JOHN@EXAMPLE.COM');
    });

    it('should chain multiple transformations', () => {
      type Source = {
        name: string;
      };

      @Mapper()
      class TestMapper {
        // Decorators are applied bottom-to-top, so:
        // 1. @Map('name') gets the value
        // 2. First @Transform toUpperCase
        // 3. Second @Transform trim
        @Transform((value: string) => value.toUpperCase())
        @Transform((value: string) => value.trim())
        @Map('name')
        cleanName!: string;
      }

      const mapper = new TestMapper();
      const source: Source = { name: '  john doe  ' };
      const result = mapper.transform(source);

      expect(result.cleanName).toBe('JOHN DOE');
    });
  });

  describe('@MapWith decorator', () => {
    it('should use nested mapper', () => {
      type Address = {
        street: string;
        city: string;
      };

      type User = {
        name: string;
        address: Address;
      };

      @Mapper()
      class AddressMapper {
        @Map('street')
        streetName!: string;

        @Map('city')
        cityName!: string;
      }

      @Mapper()
      class UserMapper {
        @Map('name')
        fullName!: string;

        @MapWith(AddressMapper)
        @Map('address')
        address!: any;
      }

      const mapper = new UserMapper();
      const source: User = {
        name: 'John Doe',
        address: {
          street: 'Main St',
          city: 'New York',
        },
      };
      const result = mapper.transform(source);

      expect(result.fullName).toBe('John Doe');
      expect(result.address.streetName).toBe('Main St');
      expect(result.address.cityName).toBe('New York');
    });
  });

  describe('@Ignore decorator', () => {
    it('should ignore decorated property', () => {
      type Source = {
        name: string;
        internal: string;
      };

      @Mapper()
      class TestMapper {
        @Map('name')
        name!: string;

        @Ignore()
        internal!: string;
      }

      const mapper = new TestMapper();
      const source: Source = {
        name: 'John',
        internal: 'secret',
      };
      const result = mapper.transform(source);

      expect(result.name).toBe('John');
      expect(result.internal).toBeUndefined();
    });
  });

  describe('Complex scenarios', () => {
    it('should handle multiple decorators on same property', () => {
      type Source = {
        firstName: string;
        lastName: string;
        age: number;
      };

      @Mapper()
      class UserMapper {
        @Transform((value: string) => value.toUpperCase())
        @MapFrom((s: Source) => `${s.firstName} ${s.lastName}`)
        fullName!: string;

        @Default(false)
        @MapFrom((s: Source) => s.age >= 18)
        isAdult!: boolean;
      }

      const mapper = new UserMapper();
      const source: Source = {
        firstName: 'John',
        lastName: 'Doe',
        age: 25,
      };
      const result = mapper.transform(source);

      expect(result.fullName).toBe('JOHN DOE');
      expect(result.isAdult).toBe(true);
    });

    it('should work with tryTransform for error handling', () => {
      type Source = {
        name: string;
      };

      @Mapper()
      class TestMapper {
        @Map('name')
        fullName!: string;
      }

      const mapper = new TestMapper();
      const source: Source = { name: 'John' };
      const { result, errors } = mapper.tryTransform(source);

      expect(result.fullName).toBe('John');
      expect(errors).toHaveLength(0);
    });
  });
});

