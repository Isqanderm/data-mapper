import { describe, it, expect } from 'vitest';
import { Mapper } from '../../../src/core/Mapper';

describe('BaseMapper (Legacy API)', () => {
  describe('Mapper.create()', () => {
    it('should create a mapper instance', () => {
      const mapper = Mapper.create({
        name: 'firstName',
      });

      expect(mapper).toBeDefined();
      expect(typeof mapper.execute).toBe('function');
    });

    it('should map simple properties', () => {
      type Source = { firstName: string; age: number };
      type Target = { name: string; userAge: number };

      const mapper = Mapper.create<Source, Target>({
        name: 'firstName',
        userAge: 'age',
      });

      const source: Source = { firstName: 'John', age: 30 };
      const result = mapper.execute(source);

      expect(result.result).toEqual({
        name: 'John',
        userAge: 30,
      });
      expect(result.errors).toEqual([]);
    });

    it('should map nested properties', () => {
      type Source = {
        user: {
          profile: {
            email: string;
          };
        };
      };
      type Target = { email: string };

      const mapper = Mapper.create<Source, Target>({
        email: 'user.profile.email',
      });

      const source: Source = {
        user: {
          profile: {
            email: 'john@example.com',
          },
        },
      };
      const result = mapper.execute(source);

      expect(result.result.email).toBe('john@example.com');
      expect(result.errors).toEqual([]);
    });

    it('should handle missing nested properties gracefully', () => {
      type Source = {
        user?: {
          profile?: {
            email?: string;
          };
        };
      };
      type Target = { email: string };

      const mapper = Mapper.create<Source, Target>({
        email: 'user.profile.email',
      });

      const result = mapper.execute({});

      expect(result.result.email).toBeUndefined();
      expect(result.errors).toEqual([]);
    });

    it('should use transformer functions', () => {
      type Source = { firstName: string; lastName: string };
      type Target = { fullName: string };

      const mapper = Mapper.create<Source, Target>({
        fullName: (src) => `${src.firstName} ${src.lastName}`,
      });

      const source: Source = { firstName: 'John', lastName: 'Doe' };
      const result = mapper.execute(source);

      expect(result.result.fullName).toBe('John Doe');
      expect(result.errors).toEqual([]);
    });

    it('should apply default values', () => {
      type Source = { name?: string; age?: number };
      type Target = { name: string; age: number };

      const mapper = Mapper.create<Source, Target>(
        {
          name: 'name',
          age: 'age',
        },
        {
          name: 'Unknown',
          age: 0,
        },
      );

      const result = mapper.execute({});

      expect(result.result).toEqual({
        name: 'Unknown',
        age: 0,
      });
      expect(result.errors).toEqual([]);
    });

    it('should not use default values when property exists', () => {
      type Source = { name: string; age: number };
      type Target = { name: string; age: number };

      const mapper = Mapper.create<Source, Target>(
        {
          name: 'name',
          age: 'age',
        },
        {
          name: 'Unknown',
          age: 0,
        },
      );

      const source: Source = { name: 'John', age: 30 };
      const result = mapper.execute(source);

      expect(result.result).toEqual({
        name: 'John',
        age: 30,
      });
      expect(result.errors).toEqual([]);
    });

    it('should handle array mapping', () => {
      type Source = {
        items: Array<{ id: number; name: string }>;
      };
      type Target = {
        itemIds: number[];
      };

      const mapper = Mapper.create<Source, Target>({
        itemIds: (src) => src.items.map((item) => item.id),
      });

      const source: Source = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
      };
      const result = mapper.execute(source);

      expect(result.result.itemIds).toEqual([1, 2]);
      expect(result.errors).toEqual([]);
    });

    it('should handle nested array mapping with [] syntax', () => {
      type Source = {
        users: Array<{ id: number; name: string }>;
      };
      type Target = {
        userIds: number[];
      };

      const mapper = Mapper.create<Source, Target>({
        userIds: 'users[].id',
      });

      const source: Source = {
        users: [
          { id: 1, name: 'User 1' },
          { id: 2, name: 'User 2' },
        ],
      };
      const result = mapper.execute(source);

      expect(result.result.userIds).toEqual([1, 2]);
      expect(result.errors).toEqual([]);
    });

    it('should handle complex transformations', () => {
      type Source = { age: number };
      type Target = { isAdult: boolean; category: string };

      const mapper = Mapper.create<Source, Target>({
        isAdult: (src) => src.age >= 18,
        category: (src) => {
          if (src.age < 13) return 'child';
          if (src.age < 18) return 'teen';
          return 'adult';
        },
      });

      const result1 = mapper.execute({ age: 10 });
      expect(result1.result).toEqual({
        isAdult: false,
        category: 'child',
      });

      const result2 = mapper.execute({ age: 15 });
      expect(result2.result).toEqual({
        isAdult: false,
        category: 'teen',
      });

      const result3 = mapper.execute({ age: 25 });
      expect(result3.result).toEqual({
        isAdult: true,
        category: 'adult',
      });
    });
  });

  describe('Error handling', () => {
    it('should catch errors in safe mode (default)', () => {
      type Source = { data: any };
      type Target = { value: string };

      const mapper = Mapper.create<Source, Target>({
        value: (src) => src.data.nested.value,
      });

      const result = mapper.execute({ data: null });

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Mapping error');
    });

    it('should throw errors in unsafe mode', () => {
      type Source = { data: any };
      type Target = { value: string };

      const mapper = Mapper.create<Source, Target>(
        {
          value: (src) => src.data.nested.value,
        },
        undefined,
        { useUnsafe: true },
      );

      expect(() => mapper.execute({ data: null })).toThrow();
    });
  });

  describe('Performance - JIT compilation', () => {
    it('should compile mapper on first execution', () => {
      type Source = { name: string };
      type Target = { userName: string };

      const mapper = Mapper.create<Source, Target>({
        userName: 'name',
      });

      const source: Source = { name: 'John' };

      // First execution - triggers compilation
      const result1 = mapper.execute(source);
      expect(result1.result.userName).toBe('John');

      // Second execution - uses compiled version
      const result2 = mapper.execute(source);
      expect(result2.result.userName).toBe('John');
    });
  });

  describe('Multiple transformations', () => {
    it('should handle multiple properties with different types', () => {
      type Source = {
        id: number;
        name: string;
        active: boolean;
        tags: string[];
      };
      type Target = {
        userId: number;
        userName: string;
        isActive: boolean;
        tagCount: number;
      };

      const mapper = Mapper.create<Source, Target>({
        userId: 'id',
        userName: 'name',
        isActive: 'active',
        tagCount: (src) => src.tags.length,
      });

      const source: Source = {
        id: 1,
        name: 'John',
        active: true,
        tags: ['tag1', 'tag2', 'tag3'],
      };

      const result = mapper.execute(source);

      expect(result.result.userId).toBe(1);
      expect(result.result.userName).toBe('John');
      expect(result.result.isActive).toBe(true);
      expect(result.result.tagCount).toBe(3);
      expect(result.errors).toEqual([]);
    });

    it('should handle conditional transformations', () => {
      type Source = { value: number };
      type Target = { category: string; level: string };

      const mapper = Mapper.create<Source, Target>({
        category: (src) => {
          if (src.value < 10) return 'low';
          if (src.value < 50) return 'medium';
          return 'high';
        },
        level: (src) => {
          if (src.value < 25) return 'beginner';
          if (src.value < 75) return 'intermediate';
          return 'advanced';
        },
      });

      const result = mapper.execute({ value: 30 });

      expect(result.result.category).toBe('medium');
      expect(result.result.level).toBe('intermediate');
    });
  });

  describe('Deep nested array mapping', () => {
    it('should handle deeply nested array paths', () => {
      type Source = {
        departments: Array<{
          teams: Array<{
            members: Array<{ id: number; name: string }>;
          }>;
        }>;
      };
      type Target = {
        memberIds: number[][][];
      };

      const mapper = Mapper.create<Source, Target>({
        memberIds: 'departments[].teams[].members[].id',
      });

      const source: Source = {
        departments: [
          {
            teams: [
              {
                members: [
                  { id: 1, name: 'Alice' },
                  { id: 2, name: 'Bob' },
                ],
              },
            ],
          },
        ],
      };

      const result = mapper.execute(source);

      expect(result.result.memberIds).toEqual([[[1, 2]]]);
      expect(result.errors).toEqual([]);
    });
  });

  describe('Complex path scenarios', () => {
    it('should handle optional chaining in paths', () => {
      type Source = {
        user?: {
          profile?: {
            settings?: {
              theme?: string;
            };
          };
        };
      };
      type Target = { theme: string };

      const mapper = Mapper.create<Source, Target>({
        theme: 'user.profile.settings.theme',
      });

      const result1 = mapper.execute({});
      expect(result1.result.theme).toBeUndefined();

      const result2 = mapper.execute({ user: {} });
      expect(result2.result.theme).toBeUndefined();

      const result3 = mapper.execute({
        user: { profile: { settings: { theme: 'dark' } } },
      });
      expect(result3.result.theme).toBe('dark');
    });

    it('should handle mixed array and object paths', () => {
      type Source = {
        users: Array<{
          profile: {
            name: string;
          };
        }>;
      };
      type Target = {
        names: string[];
      };

      const mapper = Mapper.create<Source, Target>({
        names: 'users[].profile.name',
      });

      const source: Source = {
        users: [
          { profile: { name: 'Alice' } },
          { profile: { name: 'Bob' } },
        ],
      };

      const result = mapper.execute(source);

      expect(result.result.names).toEqual(['Alice', 'Bob']);
      expect(result.errors).toEqual([]);
    });
  });

  describe('Nested object mapping', () => {
    it('should handle nested object configuration', () => {
      type Source = { user: { name: string; age: number } };
      type Target = { profile: { userName: string; userAge: number } };

      const mapper = Mapper.create<Source, Target>({
        profile: {
          userName: 'user.name',
          userAge: 'user.age',
        },
      });

      const result = mapper.execute({
        user: { name: 'John', age: 30 },
      });

      expect(result.result.profile.userName).toBe('John');
      expect(result.result.profile.userAge).toBe(30);
      expect(result.errors).toEqual([]);
    });

    it('should handle nested object with transformers', () => {
      type Source = { data: { value: number } };
      type Target = { result: { doubled: number } };

      const mapper = Mapper.create<Source, Target>({
        result: {
          doubled: (src: Source) => src.data.value * 2,
        },
      });

      const result = mapper.execute({ data: { value: 10 } });

      expect(result.result.result.doubled).toBe(20);
    });

    it('should handle errors in nested object mapping', () => {
      type Source = { data: any };
      type Target = { result: { value: string } };

      const mapper = Mapper.create<Source, Target>({
        result: {
          value: (src: Source) => src.data.nested.value,
        },
      });

      const result = mapper.execute({ data: null });

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Additional edge cases', () => {
    it('should handle empty objects', () => {
      type Source = {};
      type Target = { defaultValue: string };

      const mapper = Mapper.create<Source, Target>(
        {
          defaultValue: 'value',
        },
        {
          defaultValue: 'default',
        },
      );

      const result = mapper.execute({});

      expect(result.result.defaultValue).toBe('default');
    });

    it('should handle string transformations', () => {
      type Source = { firstName: string; lastName: string };
      type Target = { fullName: string; initials: string };

      const mapper = Mapper.create<Source, Target>({
        fullName: (src) => `${src.firstName} ${src.lastName}`,
        initials: (src) => `${src.firstName[0]}${src.lastName[0]}`,
      });

      const result = mapper.execute({ firstName: 'John', lastName: 'Doe' });

      expect(result.result.fullName).toBe('John Doe');
      expect(result.result.initials).toBe('JD');
    });

    it('should handle date transformations', () => {
      type Source = { timestamp: string };
      type Target = { date: Date; year: number };

      const mapper = Mapper.create<Source, Target>({
        date: (src) => new Date(src.timestamp),
        year: (src) => new Date(src.timestamp).getFullYear(),
      });

      const result = mapper.execute({ timestamp: '2024-01-15' });

      expect(result.result.date).toBeInstanceOf(Date);
      expect(result.result.year).toBe(2024);
    });

    it('should handle numeric transformations', () => {
      type Source = { price: number };
      type Target = { priceWithTax: number; formattedPrice: string };

      const mapper = Mapper.create<Source, Target>({
        priceWithTax: (src) => src.price * 1.2,
        formattedPrice: (src) => `$${src.price.toFixed(2)}`,
      });

      const result = mapper.execute({ price: 100 });

      expect(result.result.priceWithTax).toBe(120);
      expect(result.result.formattedPrice).toBe('$100.00');
    });
  });
});

