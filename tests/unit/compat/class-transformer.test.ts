/**
 * Tests for class-transformer compatibility layer using TC39 Stage 3 decorators
 */

import { describe, it, expect } from 'vitest';
import {
  plainToClass,
  plainToClassFromExist,
  classToPlain,
  Expose,
  Exclude,
  Type,
  Transform,
  serialize,
  deserialize,
} from '../../../src/compat/class-transformer';

describe('class-transformer Compatibility (TC39 Stage 3 Decorators)', () => {
  describe('@Expose decorator', () => {
    it('should expose only decorated properties', () => {
      class User {
        @Expose()
        id!: number;

        @Expose()
        name!: string;

        password!: string; // Not exposed
      }

      const plain = { id: 1, name: 'John', password: 'secret' };
      const user = plainToClass(User, plain, { excludeExtraneousValues: true });

      expect(user.id).toBe(1);
      expect(user.name).toBe('John');
      expect(user.password).toBeUndefined();
    });

    it('should expose property with different name', () => {
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

    it('should respect groups', () => {
      class User {
        @Expose()
        id!: number;

        @Expose({ groups: ['admin'] })
        email!: string;

        @Expose({ groups: ['user', 'admin'] })
        name!: string;
      }

      const plain = { id: 1, email: 'john@example.com', name: 'John' };

      // Transform with 'admin' group
      // Properties without groups are always included
      const adminUser = plainToClass(User, plain, { groups: ['admin'] });
      expect(adminUser.id).toBe(1); // id has no groups, so always included
      expect(adminUser.email).toBe('john@example.com');
      expect(adminUser.name).toBe('John');

      // Transform with 'user' group
      const regularUser = plainToClass(User, plain, { groups: ['user'] });
      expect(regularUser.id).toBe(1); // id has no groups, so always included
      expect(regularUser.email).toBeUndefined(); // only in 'admin' group
      expect(regularUser.name).toBe('John');
    });

    it('should respect version constraints', () => {
      class User {
        @Expose()
        id!: number;

        @Expose({ since: 2.0 })
        newField!: string;

        @Expose({ until: 2.0 })
        oldField!: string;
      }

      const plain = { id: 1, newField: 'new', oldField: 'old' };

      // Version 1.0
      const v1User = plainToClass(User, plain, { version: 1.0 });
      expect(v1User.id).toBe(1);
      expect(v1User.newField).toBeUndefined(); // since: 2.0
      expect(v1User.oldField).toBe('old'); // until: 2.0

      // Version 2.0
      const v2User = plainToClass(User, plain, { version: 2.0 });
      expect(v2User.id).toBe(1);
      expect(v2User.newField).toBe('new'); // since: 2.0
      expect(v2User.oldField).toBeUndefined(); // until: 2.0
    });
  });

  describe('@Exclude decorator', () => {
    it('should exclude decorated properties', () => {
      class User {
        id!: number;
        name!: string;

        @Exclude()
        password!: string;
      }

      const plain = { id: 1, name: 'John', password: 'secret' };
      const user = plainToClass(User, plain);

      expect(user.id).toBe(1);
      expect(user.name).toBe('John');
      expect(user.password).toBeUndefined();
    });

    it('should exclude only when transforming to plain', () => {
      class User {
        id!: number;

        @Exclude({ toPlainOnly: true })
        internalId!: string;
      }

      const plain = { id: 1, internalId: 'internal-123' };
      const user = plainToClass(User, plain);

      expect(user.id).toBe(1);
      expect(user.internalId).toBe('internal-123'); // Not excluded when transforming to class

      const plainResult = classToPlain(user);
      expect(plainResult.id).toBe(1);
      expect(plainResult.internalId).toBeUndefined(); // Excluded when transforming to plain
    });
  });

  describe('@Type decorator', () => {
    it('should transform nested objects', () => {
      class Address {
        @Expose()
        street!: string;

        @Expose()
        city!: string;
      }

      class User {
        @Expose()
        name!: string;

        @Expose()
        @Type(() => Address)
        address!: Address;
      }

      const plain = {
        name: 'John',
        address: { street: '123 Main St', city: 'New York' },
      };

      const user = plainToClass(User, plain);

      expect(user.name).toBe('John');
      expect(user.address).toBeInstanceOf(Address);
      expect(user.address.street).toBe('123 Main St');
      expect(user.address.city).toBe('New York');
    });

    it('should transform arrays of nested objects', () => {
      class Photo {
        @Expose()
        url!: string;
      }

      class User {
        @Expose()
        name!: string;

        @Expose()
        @Type(() => Photo)
        photos!: Photo[];
      }

      const plain = {
        name: 'John',
        photos: [{ url: 'photo1.jpg' }, { url: 'photo2.jpg' }],
      };

      const user = plainToClass(User, plain);

      expect(user.name).toBe('John');
      expect(user.photos).toHaveLength(2);
      expect(user.photos[0]).toBeInstanceOf(Photo);
      expect(user.photos[0].url).toBe('photo1.jpg');
      expect(user.photos[1]).toBeInstanceOf(Photo);
      expect(user.photos[1].url).toBe('photo2.jpg');
    });
  });

  describe('@Transform decorator', () => {
    it('should transform values', () => {
      class User {
        @Expose()
        @Transform(({ value }) => value.toUpperCase())
        name!: string;

        @Expose()
        @Transform(({ value }) => value * 2)
        age!: number;
      }

      const plain = { name: 'john', age: 25 };
      const user = plainToClass(User, plain);

      expect(user.name).toBe('JOHN');
      expect(user.age).toBe(50);
    });

    it('should transform only when transforming to class', () => {
      class User {
        @Expose()
        @Transform(({ value }) => value.toUpperCase(), { toClassOnly: true })
        name!: string;
      }

      const plain = { name: 'john' };
      const user = plainToClass(User, plain);

      expect(user.name).toBe('JOHN'); // Transformed when going to class

      const plainResult = classToPlain(user);
      expect(plainResult.name).toBe('JOHN'); // Not transformed again when going to plain
    });
  });

  describe('plainToClass function', () => {
    it('should transform plain object to class instance', () => {
      class User {
        @Expose()
        id!: number;

        @Expose()
        name!: string;
      }

      const plain = { id: 1, name: 'John' };
      const user = plainToClass(User, plain);

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(1);
      expect(user.name).toBe('John');
    });

    it('should transform array of plain objects', () => {
      class User {
        @Expose()
        id!: number;

        @Expose()
        name!: string;
      }

      const plains = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ];

      const users = plainToClass(User, plains);

      expect(users).toHaveLength(2);
      expect(users[0]).toBeInstanceOf(User);
      expect(users[0].id).toBe(1);
      expect(users[1]).toBeInstanceOf(User);
      expect(users[1].id).toBe(2);
    });
  });

  describe('classToPlain function', () => {
    it('should transform class instance to plain object', () => {
      class User {
        @Expose()
        id!: number;

        @Expose()
        name!: string;

        @Exclude()
        password!: string;
      }

      const user = new User();
      user.id = 1;
      user.name = 'John';
      user.password = 'secret';

      const plain = classToPlain(user);

      expect(plain.id).toBe(1);
      expect(plain.name).toBe('John');
      expect(plain.password).toBeUndefined();
    });
  });

  describe('serialize and deserialize', () => {
    it('should serialize and deserialize correctly', () => {
      class User {
        @Expose()
        id!: number;

        @Expose()
        name!: string;
      }

      const user = new User();
      user.id = 1;
      user.name = 'John';

      const json = serialize(user);
      expect(json).toBe('{"id":1,"name":"John"}');

      const deserialized = deserialize(User, json);
      expect(deserialized).toBeInstanceOf(User);
      expect(deserialized.id).toBe(1);
      expect(deserialized.name).toBe('John');
    });
  });

  describe('Edge cases and additional coverage', () => {
    it('should handle plainToClass with array input', () => {
      class User {
        @Expose()
        id!: number;

        @Expose()
        name!: string;
      }

      const plains = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ];
      const users = plainToClass(User, plains);

      expect(Array.isArray(users)).toBe(true);
      expect(users).toHaveLength(2);
      expect(users[0]).toBeInstanceOf(User);
      expect(users[0].id).toBe(1);
      expect(users[1].name).toBe('Jane');
    });

    it('should handle classToPlain with array input', () => {
      class User {
        @Expose()
        id!: number;

        @Expose()
        name!: string;
      }

      const user1 = new User();
      user1.id = 1;
      user1.name = 'John';

      const user2 = new User();
      user2.id = 2;
      user2.name = 'Jane';

      const plains = classToPlain([user1, user2]);

      expect(Array.isArray(plains)).toBe(true);
      expect(plains).toHaveLength(2);
      expect(plains[0]).toEqual({ id: 1, name: 'John' });
      expect(plains[1]).toEqual({ id: 2, name: 'Jane' });
    });

    it('should handle @Transform with toPlainOnly option', () => {
      class User {
        @Expose()
        @Transform(({ value }) => value.toUpperCase(), { toPlainOnly: true })
        name!: string;
      }

      const plain = { name: 'john' };
      const user = plainToClass(User, plain);
      expect(user.name).toBe('john'); // Not transformed on plainToClass

      const plainResult = classToPlain(user);
      expect(plainResult.name).toBe('JOHN'); // Transformed on classToPlain
    });

    it('should handle @Transform with toClassOnly option', () => {
      class User {
        @Expose()
        @Transform(({ value }) => value.toUpperCase(), { toClassOnly: true })
        name!: string;
      }

      const plain = { name: 'john' };
      const user = plainToClass(User, plain);
      expect(user.name).toBe('JOHN'); // Transformed on plainToClass

      const plainResult = classToPlain(user);
      expect(plainResult.name).toBe('JOHN'); // Not transformed again on classToPlain
    });

    it('should handle missing properties gracefully', () => {
      class User {
        @Expose()
        id!: number;

        @Expose()
        name?: string;
      }

      const plain = { id: 1 };
      const user = plainToClass(User, plain);

      expect(user.id).toBe(1);
      expect(user.name).toBeUndefined();
    });

    it('should handle null values', () => {
      class User {
        @Expose()
        id!: number;

        @Expose()
        name!: string | null;
      }

      const plain = { id: 1, name: null };
      const user = plainToClass(User, plain);

      expect(user.id).toBe(1);
      expect(user.name).toBeNull();
    });

    it('should handle @Expose with groups option', () => {
      class User {
        @Expose()
        id!: number;

        @Expose({ groups: ['admin'] })
        email!: string;

        @Expose({ groups: ['user', 'admin'] })
        name!: string;
      }

      const plain = { id: 1, email: 'admin@example.com', name: 'John' };

      // Transform with admin group
      const adminUser = plainToClass(User, plain, { groups: ['admin'] });
      expect(adminUser.id).toBe(1);
      expect(adminUser.email).toBe('admin@example.com');
      expect(adminUser.name).toBe('John');

      // Transform with user group
      const regularUser = plainToClass(User, plain, { groups: ['user'] });
      expect(regularUser.id).toBe(1);
      expect(regularUser.name).toBe('John');
      // email should not be exposed for user group
    });

    it('should handle @Exclude with groups option', () => {
      class User {
        @Expose()
        id!: number;

        @Exclude({ groups: ['public'] })
        password!: string;

        @Expose()
        name!: string;
      }

      const plain = { id: 1, password: 'secret', name: 'John' };

      const publicUser = plainToClass(User, plain, { groups: ['public'] });
      expect(publicUser.id).toBe(1);
      expect(publicUser.name).toBe('John');
      expect(publicUser.password).toBeUndefined();
    });

    it('should handle nested @Type transformations', () => {
      class Address {
        @Expose()
        street!: string;

        @Expose()
        city!: string;
      }

      class User {
        @Expose()
        id!: number;

        @Expose()
        @Type(() => Address)
        address!: Address;
      }

      const plain = {
        id: 1,
        address: { street: '123 Main St', city: 'New York' },
      };

      const user = plainToClass(User, plain);

      expect(user.id).toBe(1);
      expect(user.address).toBeInstanceOf(Address);
      expect(user.address.street).toBe('123 Main St');
      expect(user.address.city).toBe('New York');
    });

    it('should handle @Type with array of objects', () => {
      class Tag {
        @Expose()
        name!: string;
      }

      class Post {
        @Expose()
        title!: string;

        @Expose()
        @Type(() => Tag)
        tags!: Tag[];
      }

      const plain = {
        title: 'My Post',
        tags: [{ name: 'tag1' }, { name: 'tag2' }],
      };

      const post = plainToClass(Post, plain);

      expect(post.title).toBe('My Post');
      expect(post.tags).toHaveLength(2);
      expect(post.tags[0]).toBeInstanceOf(Tag);
      expect(post.tags[0].name).toBe('tag1');
    });

    it('should handle complex nested structures', () => {
      class Comment {
        @Expose()
        text!: string;
      }

      class Post {
        @Expose()
        title!: string;

        @Expose()
        @Type(() => Comment)
        comments!: Comment[];
      }

      class User {
        @Expose()
        name!: string;

        @Expose()
        @Type(() => Post)
        posts!: Post[];
      }

      const plain = {
        name: 'John',
        posts: [
          {
            title: 'Post 1',
            comments: [{ text: 'Comment 1' }, { text: 'Comment 2' }],
          },
        ],
      };

      const user = plainToClass(User, plain);

      expect(user.name).toBe('John');
      expect(user.posts[0]).toBeInstanceOf(Post);
      expect(user.posts[0].comments[0]).toBeInstanceOf(Comment);
      expect(user.posts[0].comments[0].text).toBe('Comment 1');
    });
  });

  describe('plainToClassFromExist', () => {
    it('should update existing instance with plain data', () => {
      class User {
        @Expose()
        id!: number;

        @Expose()
        name!: string;

        @Expose()
        email!: string;
      }

      const user = new User();
      user.id = 1;
      user.name = 'Old Name';
      user.email = 'old@example.com';

      const plain = { id: 1, name: 'New Name', email: 'new@example.com' };
      const updated = plainToClassFromExist(user, plain);

      expect(updated).toBe(user); // Same instance
      expect(updated.id).toBe(1);
      expect(updated.name).toBe('New Name');
      expect(updated.email).toBe('new@example.com');
    });

    it('should handle partial updates', () => {
      class User {
        @Expose()
        id!: number;

        @Expose()
        name!: string;

        @Expose()
        email!: string;
      }

      const user = new User();
      user.id = 1;
      user.name = 'John';
      user.email = 'john@example.com';

      const plain = { name: 'Jane' };
      const updated = plainToClassFromExist(user, plain);

      expect(updated.id).toBe(1); // Unchanged
      expect(updated.name).toBe('Jane'); // Updated
      expect(updated.email).toBe('john@example.com'); // Unchanged
    });

    it('should respect @Exclude in plainToClassFromExist', () => {
      class User {
        @Expose()
        id!: number;

        @Expose()
        name!: string;

        @Exclude()
        password!: string;
      }

      const user = new User();
      user.id = 1;
      user.name = 'John';
      user.password = 'old-password';

      const plain = { id: 1, name: 'Jane', password: 'new-password' };
      const updated = plainToClassFromExist(user, plain);

      expect(updated.name).toBe('Jane');
      expect(updated.password).toBe('old-password'); // Not updated due to @Exclude
    });
  });
});

