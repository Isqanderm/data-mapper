import { describe, it, expect } from 'vitest';
import { Mapper } from '../../../src/core/Mapper';

describe('BaseMapper - Edge Cases and Advanced Scenarios', () => {
  describe('Complex array transformations', () => {
    it('should handle array of objects with nested properties', () => {
      type Source = {
        users: Array<{ profile: { name: string } }>;
      };
      type Target = {
        names: string[];
      };

      const mapper = Mapper.create<Source, Target>({
        names: 'users[].profile.name',
      });

      const source: Source = {
        users: [{ profile: { name: 'John' } }, { profile: { name: 'Jane' } }],
      };

      const result = mapper.execute(source);

      expect(result.result.names).toEqual(['John', 'Jane']);
      expect(result.errors).toEqual([]);
    });

    it('should handle empty arrays', () => {
      type Source = { items: any[] };
      type Target = { ids: number[] };

      const mapper = Mapper.create<Source, Target>({
        ids: 'items[].id',
      });

      const result = mapper.execute({ items: [] });

      expect(result.result.ids).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('should handle arrays with null/undefined items', () => {
      type Source = { items: Array<{ id?: number } | null> };
      type Target = { ids: any[] };

      const mapper = Mapper.create<Source, Target>({
        ids: (src) => src.items.map((item) => item?.id),
      });

      const result = mapper.execute({
        items: [{ id: 1 }, null, { id: 3 }, {}],
      });

      expect(result.result.ids).toEqual([1, undefined, 3, undefined]);
    });
  });

  describe('Error handling edge cases', () => {
    it('should collect multiple errors in safe mode', () => {
      type Source = { data1: any; data2: any };
      type Target = { val1: string; val2: string };

      const mapper = Mapper.create<Source, Target>({
        val1: (src) => src.data1.nested.value,
        val2: (src) => src.data2.nested.value,
      });

      const result = mapper.execute({ data1: null, data2: null });

      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle errors in array transformations', () => {
      type Source = { items: Array<{ data: any }> };
      type Target = { values: string[] };

      const mapper = Mapper.create<Source, Target>({
        values: (src) => src.items.map((item) => item.data.value),
      });

      const result = mapper.execute({
        items: [{ data: null }, { data: null }],
      });

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Default values with complex scenarios', () => {
    it('should apply default values for missing properties', () => {
      type Source = { id: number };
      type Target = { id: number; status: string };

      const mapper = Mapper.create<Source, Target>(
        {
          id: 'id',
          status: 'status',
        },
        {
          status: 'active',
        },
      );

      const result = mapper.execute({ id: 1 });

      expect(result.result.id).toBe(1);
      expect(result.result.status).toBe('active');
    });

    it('should handle complex default values', () => {
      type Source = { name?: string };
      type Target = { name: string; metadata: object };

      const mapper = Mapper.create<Source, Target>(
        {
          name: 'name',
          metadata: 'metadata',
        },
        {
          name: 'Unknown',
          metadata: { created: true },
        },
      );

      const result = mapper.execute({});

      expect(result.result.name).toBe('Unknown');
      expect(result.result.metadata).toEqual({ created: true });
    });
  });

  describe('Performance and caching', () => {
    it('should reuse compiled mapper for multiple executions', () => {
      type Source = { name: string };
      type Target = { userName: string };

      const mapper = Mapper.create<Source, Target>({
        userName: 'name',
      });

      // Execute multiple times
      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push(mapper.execute({ name: `User${i}` }));
      }

      expect(results).toHaveLength(100);
      expect(results[0].result.userName).toBe('User0');
      expect(results[99].result.userName).toBe('User99');
    });

    it('should handle large objects efficiently', () => {
      type Source = Record<string, any>;
      type Target = Record<string, any>;

      const config: any = {};
      for (let i = 0; i < 50; i++) {
        config[`field${i}`] = `source${i}`;
      }

      const mapper = Mapper.create<Source, Target>(config);

      const source: any = {};
      for (let i = 0; i < 50; i++) {
        source[`source${i}`] = `value${i}`;
      }

      const result = mapper.execute(source);

      expect(Object.keys(result.result)).toHaveLength(50);
      expect(result.result.field0).toBe('value0');
      expect(result.result.field49).toBe('value49');
    });
  });

  describe('Special characters and edge cases in paths', () => {
    it('should handle properties with special characters', () => {
      type Source = { 'user-name': string; 'user.email': string };
      type Target = { name: string; email: string };

      const mapper = Mapper.create<Source, Target>({
        name: (src) => src['user-name'],
        email: (src) => src['user.email'],
      });

      const result = mapper.execute({
        'user-name': 'John',
        'user.email': 'john@example.com',
      });

      expect(result.result.name).toBe('John');
      expect(result.result.email).toBe('john@example.com');
    });

    it('should handle numeric property names', () => {
      type Source = { '0': string; '1': string };
      type Target = { first: string; second: string };

      const mapper = Mapper.create<Source, Target>({
        first: (src) => src['0'],
        second: (src) => src['1'],
      });

      const result = mapper.execute({ '0': 'first', '1': 'second' });

      expect(result.result.first).toBe('first');
      expect(result.result.second).toBe('second');
    });
  });

  describe('Mixed transformation types', () => {
    it('should handle mix of paths, functions, and defaults', () => {
      type Source = {
        id: number;
        firstName?: string;
        lastName?: string;
        age?: number;
      };
      type Target = {
        userId: number;
        fullName: string;
        isAdult: boolean;
        category: string;
      };

      const mapper = Mapper.create<Source, Target>(
        {
          userId: 'id',
          fullName: (src) => `${src.firstName || 'Unknown'} ${src.lastName || 'User'}`,
          isAdult: (src) => (src.age || 0) >= 18,
          category: 'category',
        },
        {
          category: 'general',
        },
      );

      const result1 = mapper.execute({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        age: 25,
      });

      const result2 = mapper.execute({ id: 2 });

      expect(result1.result.userId).toBe(1);
      expect(result1.result.fullName).toBe('John Doe');
      expect(result1.result.isAdult).toBe(true);
      expect(result1.result.category).toBe('general');

      expect(result2.result.userId).toBe(2);
      expect(result2.result.fullName).toBe('Unknown User');
      expect(result2.result.isAdult).toBe(false);
      expect(result2.result.category).toBe('general');
    });
  });

  describe('Unsafe mode edge cases', () => {
    it('should execute faster in unsafe mode', () => {
      type Source = { value: number };
      type Target = { doubled: number };

      const safeMapper = Mapper.create<Source, Target>({
        doubled: (src) => src.value * 2,
      });

      const unsafeMapper = Mapper.create<Source, Target>(
        {
          doubled: (src) => src.value * 2,
        },
        undefined,
        { useUnsafe: true },
      );

      const source = { value: 10 };

      const safeResult = safeMapper.execute(source);
      const unsafeResult = unsafeMapper.execute(source);

      expect(safeResult.result.doubled).toBe(20);
      expect(unsafeResult.result.doubled).toBe(20);
    });
  });
});

