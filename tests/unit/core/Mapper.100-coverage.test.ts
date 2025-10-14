import { describe, it, expect } from 'vitest';
import { Mapper } from '../../../src/core/Mapper';

describe('Mapper - 100% Coverage Tests', () => {
  describe('useUnsafe mode - nested array mapping', () => {
    it('should handle nested array mapping in unsafe mode', () => {
      type Source = {
        users: Array<{
          posts: Array<{ id: number }>;
        }>;
      };
      type Target = {
        postIds: number[][];
      };

      const mapper = Mapper.create<Source, Target>(
        {
          postIds: 'users[].posts[].id',
        },
        undefined,
        { useUnsafe: true },
      );

      const source: Source = {
        users: [
          {
            posts: [
              { id: 1 },
              { id: 2 },
            ],
          },
          {
            posts: [
              { id: 3 },
              { id: 4 },
            ],
          },
        ],
      };

      const result = mapper.execute(source);
      expect(result.result.postIds).toEqual([[1, 2], [3, 4]]);
      expect(result.errors).toEqual([]);
    });

    it('should handle deeply nested array mapping in unsafe mode', () => {
      type Source = {
        departments: Array<{
          teams: Array<{
            members: Array<{ id: number }>;
          }>;
        }>;
      };
      type Target = {
        memberIds: number[][][];
      };

      const mapper = Mapper.create<Source, Target>(
        {
          memberIds: 'departments[].teams[].members[].id',
        },
        undefined,
        { useUnsafe: true },
      );

      const source: Source = {
        departments: [
          {
            teams: [
              {
                members: [
                  { id: 1 },
                  { id: 2 },
                ],
              },
            ],
          },
        ],
      };

      const result = mapper.execute(source);
      expect(result.result.memberIds).toEqual([[[1, 2]]]);
    });
  });

  describe('useUnsafe mode - nested object mapping', () => {
    it('should handle nested object mapping in unsafe mode', () => {
      type Source = { user: { name: string; age: number } };
      type Target = { profile: { userName: string; userAge: number } };

      const mapper = Mapper.create<Source, Target>(
        {
          profile: {
            userName: 'user.name',
            userAge: 'user.age',
          },
        },
        undefined,
        { useUnsafe: true },
      );

      const result = mapper.execute({
        user: { name: 'John', age: 30 },
      });

      expect(result.result.profile.userName).toBe('John');
      expect(result.result.profile.userAge).toBe(30);
    });
  });

  describe('useUnsafe mode - function transformers', () => {
    it('should handle function transformers in unsafe mode', () => {
      type Source = { firstName: string; lastName: string };
      type Target = { fullName: string };

      const mapper = Mapper.create<Source, Target>(
        {
          fullName: (src) => `${src.firstName} ${src.lastName}`,
        },
        undefined,
        { useUnsafe: true },
      );

      const result = mapper.execute({ firstName: 'John', lastName: 'Doe' });
      expect(result.result.fullName).toBe('John Doe');
    });

    it('should throw errors in unsafe mode with function transformers', () => {
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



  describe('useUnsafe mode - simple string mapping', () => {
    it('should handle simple string mapping in unsafe mode', () => {
      type Source = { name: string };
      type Target = { userName: string };

      const mapper = Mapper.create<Source, Target>(
        {
          userName: 'name',
        },
        undefined,
        { useUnsafe: true },
      );

      const result = mapper.execute({ name: 'John' });
      expect(result.result.userName).toBe('John');
    });

    it('should handle nested path mapping in unsafe mode', () => {
      type Source = { user: { profile: { email: string } } };
      type Target = { email: string };

      const mapper = Mapper.create<Source, Target>(
        {
          email: 'user.profile.email',
        },
        undefined,
        { useUnsafe: true },
      );

      const result = mapper.execute({
        user: { profile: { email: 'john@example.com' } },
      });

      expect(result.result.email).toBe('john@example.com');
    });
  });

  describe('Nested Mapper instances with default values', () => {
    it('should handle nested Mapper with default values from nested mapper', () => {
      type AddressSource = { street?: string; city?: string };
      type AddressTarget = { street: string; city: string };

      type UserSource = { name: string; address?: AddressSource };
      type UserTarget = { userName: string; userAddress: AddressTarget };

      const addressMapper = Mapper.create<AddressSource, AddressTarget>(
        {
          street: 'street',
          city: 'city',
        },
        {
          street: 'Unknown Street',
          city: 'Unknown City',
        },
      );

      const userMapper = Mapper.create<UserSource, UserTarget>({
        userName: 'name',
        userAddress: addressMapper,
      });

      const result = userMapper.execute({
        name: 'John',
        address: {},
      });

      expect(result.result.userName).toBe('John');
      expect(result.result.userAddress.street).toBe('Unknown Street');
      expect(result.result.userAddress.city).toBe('Unknown City');
    });

    it('should handle nested Mapper with parent default values', () => {
      type AddressSource = { street?: string; city?: string };
      type AddressTarget = { street: string; city: string };

      type UserSource = { name: string; address?: AddressSource };
      type UserTarget = { userName: string; userAddress: AddressTarget };

      const addressMapper = Mapper.create<AddressSource, AddressTarget>({
        street: 'street',
        city: 'city',
      });

      const userMapper = Mapper.create<UserSource, UserTarget>(
        {
          userName: 'name',
          userAddress: addressMapper,
        },
        {
          userName: 'Unknown',
          userAddress: {
            street: 'Default Street',
            city: 'Default City',
          },
        },
      );

      const result = userMapper.execute({
        name: 'John',
        address: {},
      });

      expect(result.result.userName).toBe('John');
      // Parent default values are used when nested mapper has no defaults
      expect(result.result.userAddress.street).toBe('Default Street');
      expect(result.result.userAddress.city).toBe('Default City');
    });
  });

  describe('compile() method', () => {
    it('should allow manual compilation before execution', () => {
      type Source = { name: string };
      type Target = { userName: string };

      const mapper = Mapper.create<Source, Target>({
        userName: 'name',
      });

      // Manually compile
      mapper.compile();

      const result = mapper.execute({ name: 'John' });
      expect(result.result.userName).toBe('John');
    });

    it('should work correctly when compiled multiple times', () => {
      type Source = { name: string };
      type Target = { userName: string };

      const mapper = Mapper.create<Source, Target>({
        userName: 'name',
      });

      mapper.compile();
      mapper.compile(); // Second compilation

      const result = mapper.execute({ name: 'John' });
      expect(result.result.userName).toBe('John');
    });
  });
});

