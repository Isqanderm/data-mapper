import { describe, it, expect } from 'vitest';
import { Expose, Exclude, Type, Transform } from '../../../src/compat/class-transformer/decorators';
import { plainToClass, classToPlain } from '../../../src/compat/class-transformer/functions';

describe('class-transformer decorators - Advanced scenarios', () => {
  describe('@Expose class decorator', () => {
    it('should handle @Expose on class level', () => {
      @Expose()
      class User {
        id!: number;
        name!: string;
      }

      const plain = { id: 1, name: 'John' };
      const user = plainToClass(User, plain);

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(1);
      expect(user.name).toBe('John');
    });
  });

  describe('@Exclude class decorator', () => {
    it('should handle @Exclude on class level', () => {
      @Exclude()
      class InternalData {
        secret!: string;
      }

      class User {
        @Expose()
        id!: number;

        @Expose()
        @Type(() => InternalData)
        internal!: InternalData;
      }

      const plain = { id: 1, internal: { secret: 'hidden' } };
      const user = plainToClass(User, plain);

      expect(user.id).toBe(1);
      expect(user.internal).toBeInstanceOf(InternalData);
    });
  });

  describe('@Expose with name option', () => {
    it('should map property with different name', () => {
      class User {
        @Expose({ name: 'user_id' })
        id!: number;

        @Expose({ name: 'user_name' })
        name!: string;
      }

      const plain = { user_id: 1, user_name: 'John' };
      const user = plainToClass(User, plain);

      expect(user.id).toBe(1);
      expect(user.name).toBe('John');
    });

    it('should use name option in classToPlain', () => {
      class User {
        @Expose({ name: 'user_id' })
        id!: number;

        @Expose({ name: 'user_name' })
        name!: string;
      }

      const user = new User();
      user.id = 1;
      user.name = 'John';

      const plain = classToPlain(user);

      expect(plain.user_id).toBe(1);
      expect(plain.user_name).toBe('John');
    });
  });

  describe('@Exclude with toPlainOnly option', () => {
    it('should exclude only when converting to plain', () => {
      class User {
        @Expose()
        id!: number;

        @Exclude({ toPlainOnly: true })
        password!: string;

        @Expose()
        name!: string;
      }

      const plain = { id: 1, password: 'secret', name: 'John' };
      const user = plainToClass(User, plain);

      // Password should be included when transforming from plain
      expect(user.password).toBe('secret');

      // But excluded when transforming to plain
      const plainResult = classToPlain(user);
      expect(plainResult.password).toBeUndefined();
      expect(plainResult.id).toBe(1);
      expect(plainResult.name).toBe('John');
    });
  });

  describe('@Exclude with toClassOnly option', () => {
    it('should exclude only when converting to class', () => {
      class User {
        @Expose()
        id!: number;

        @Exclude({ toClassOnly: true })
        internal!: string;

        @Expose()
        name!: string;
      }

      const plain = { id: 1, internal: 'data', name: 'John' };
      const user = plainToClass(User, plain);

      // Internal should be excluded when transforming from plain
      expect(user.internal).toBeUndefined();
      expect(user.id).toBe(1);
      expect(user.name).toBe('John');
    });
  });

  describe('@Type with custom classes', () => {
    it('should handle custom class types', () => {
      class CustomData {
        @Expose()
        value!: string;
      }

      class Container {
        @Expose()
        name!: string;

        @Expose()
        @Type(() => CustomData)
        data!: CustomData;
      }

      const plain = { name: 'Container', data: { value: 'test' } };
      const container = plainToClass(Container, plain);

      expect(container.name).toBe('Container');
      expect(container.data).toBeInstanceOf(CustomData);
      expect(container.data.value).toBe('test');
    });

    it('should handle arrays of custom types', () => {
      class Item {
        @Expose()
        id!: number;
      }

      class Collection {
        @Expose()
        @Type(() => Item)
        items!: Item[];
      }

      const plain = { items: [{ id: 1 }, { id: 2 }] };
      const collection = plainToClass(Collection, plain);

      expect(collection.items).toHaveLength(2);
      expect(collection.items[0]).toBeInstanceOf(Item);
      expect(collection.items[0].id).toBe(1);
    });
  });

  describe('Complex decorator combinations', () => {
    it('should handle @Expose + @Type + @Transform', () => {
      class Tag {
        @Expose()
        name!: string;
      }

      class Post {
        @Expose()
        @Type(() => Tag)
        @Transform(({ value }) => value.map((tag: Tag) => ({ ...tag, name: tag.name.toUpperCase() })))
        tags!: Tag[];
      }

      const plain = {
        tags: [{ name: 'javascript' }, { name: 'typescript' }],
      };

      const post = plainToClass(Post, plain);

      expect(post.tags).toHaveLength(2);
      expect(post.tags[0].name).toBe('JAVASCRIPT');
      expect(post.tags[1].name).toBe('TYPESCRIPT');
    });

    it('should handle @Exclude + @Transform', () => {
      class User {
        @Expose()
        id!: number;

        @Exclude()
        @Transform(({ value }) => value.toUpperCase())
        secret!: string;
      }

      const plain = { id: 1, secret: 'hidden' };
      const user = plainToClass(User, plain);

      expect(user.id).toBe(1);
      expect(user.secret).toBeUndefined();
    });
  });

  describe('Multiple instances and inheritance', () => {
    it('should handle multiple instances independently', () => {
      class User {
        @Expose()
        id!: number;

        @Expose()
        name!: string;
      }

      const plain1 = { id: 1, name: 'John' };
      const plain2 = { id: 2, name: 'Jane' };

      const user1 = plainToClass(User, plain1);
      const user2 = plainToClass(User, plain2);

      expect(user1.id).toBe(1);
      expect(user1.name).toBe('John');
      expect(user2.id).toBe(2);
      expect(user2.name).toBe('Jane');
    });

    it('should handle class inheritance', () => {
      class BaseEntity {
        @Expose()
        id!: number;

        @Expose()
        createdAt!: Date;
      }

      class User extends BaseEntity {
        @Expose()
        name!: string;

        @Expose()
        email!: string;
      }

      const plain = {
        id: 1,
        createdAt: new Date('2024-01-15'),
        name: 'John',
        email: 'john@example.com',
      };

      const user = plainToClass(User, plain);

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(1);
      expect(user.name).toBe('John');
      expect(user.email).toBe('john@example.com');
    });
  });

  describe('Edge cases with undefined and null', () => {
    it('should handle undefined values with @Type', () => {
      class Address {
        @Expose()
        street!: string;
      }

      class User {
        @Expose()
        id!: number;

        @Expose()
        @Type(() => Address)
        address?: Address;
      }

      const plain = { id: 1, address: undefined };
      const user = plainToClass(User, plain);

      expect(user.id).toBe(1);
      expect(user.address).toBeUndefined();
    });

    it('should handle null values with @Type', () => {
      class Address {
        @Expose()
        street!: string;
      }

      class User {
        @Expose()
        id!: number;

        @Expose()
        @Type(() => Address)
        address!: Address | null;
      }

      const plain = { id: 1, address: null };
      const user = plainToClass(User, plain);

      expect(user.id).toBe(1);
      expect(user.address).toBeNull();
    });
  });
});

