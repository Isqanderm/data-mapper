import { describe, it, expect } from 'vitest';
import { Mapper, Map, MapFrom, Transform, Default } from '../../../src/decorators';

describe('Decorators - Advanced Coverage', () => {
  describe('Complex transformation chains', () => {
    it('should handle MapFrom + Transform + Default together', () => {
      type Source = { value?: number };

      @Mapper()
      class TestMapper {
        @MapFrom((src: Source) => src.value)
        @Transform((val: number | undefined) => (val !== undefined ? val * 2 : undefined))
        @Default(0)
        result!: number;
      }

      const mapper = new TestMapper();
      const result1 = mapper.transform({ value: 5 });
      const result2 = mapper.transform({});

      expect(result1.result).toBe(10);
      expect(result2.result).toBe(0);
    });

    it('should handle multiple properties with different decorator combinations', () => {
      type Source = {
        firstName?: string;
        lastName?: string;
        age?: number;
        email?: string;
      };

      @Mapper()
      class UserMapper {
        @MapFrom((src: Source) => `${src.firstName || ''} ${src.lastName || ''}`.trim())
        @Transform((name: string) => name || 'Anonymous')
        fullName!: string;

        @Map('age')
        @Default(0)
        userAge!: number;

        @Map('email')
        @Transform((email: string | undefined) => email?.toLowerCase())
        @Default('no-email@example.com')
        contactEmail!: string;
      }

      const mapper = new UserMapper();
      const result1 = mapper.transform({
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
        email: 'JOHN@EXAMPLE.COM',
      });

      const result2 = mapper.transform({});

      expect(result1.fullName).toBe('John Doe');
      expect(result1.userAge).toBe(30);
      expect(result1.contactEmail).toBe('john@example.com');

      expect(result2.fullName).toBe('Anonymous');
      expect(result2.userAge).toBe(0);
      expect(result2.contactEmail).toBe('no-email@example.com');
    });
  });

  describe('Nested mappers with MapWith', () => {
    it('should handle nested mapper with manual transformation', () => {
      type AddressSource = { street: string; city: string };
      type AddressTarget = { fullAddress: string };

      type UserSource = { name: string; address: AddressSource };
      type UserTarget = { userName: string; location: AddressTarget };

      @Mapper()
      class AddressMapper {
        @MapFrom((src: AddressSource) => `${src.street}, ${src.city}`)
        fullAddress!: string;
      }

      @Mapper()
      class UserMapper {
        @Map('name')
        userName!: string;

        @MapFrom((src: UserSource) => {
          const addressMapper = new AddressMapper();
          return addressMapper.transform(src.address);
        })
        location!: AddressTarget;
      }

      const mapper = new UserMapper();
      const result = mapper.transform({
        name: 'John',
        address: { street: '123 Main St', city: 'New York' },
      });

      expect(result.userName).toBe('John');
      expect(result.location.fullAddress).toBe('123 Main St, New York');
    });

    it('should handle arrays with nested mappers', () => {
      type ItemSource = { id: number; name: string };
      type ItemTarget = { itemId: number; itemName: string };

      type Source = { items: ItemSource[] };
      type Target = { products: ItemTarget[] };

      @Mapper()
      class ItemMapper {
        @Map('id')
        itemId!: number;

        @Map('name')
        itemName!: string;
      }

      @Mapper()
      class CollectionMapper {
        @MapFrom((src: Source) => src.items.map((item) => new ItemMapper().transform(item)))
        products!: ItemTarget[];
      }

      const mapper = new CollectionMapper();
      const result = mapper.transform({
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
      });

      expect(result.products).toHaveLength(2);
      expect(result.products[0].itemId).toBe(1);
      expect(result.products[1].itemName).toBe('Item 2');
    });
  });

  describe('Error handling in decorators', () => {
    it('should collect errors from multiple properties', () => {
      type Source = { data1: any; data2: any };

      @Mapper()
      class TestMapper {
        @MapFrom((src: Source) => src.data1.nested.value)
        value1!: string;

        @MapFrom((src: Source) => src.data2.nested.value)
        value2!: string;
      }

      const mapper = new TestMapper();
      const result = mapper.tryTransform({ data1: null, data2: null });

      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle errors in Transform decorator', () => {
      type Source = { value: any };

      @Mapper()
      class TestMapper {
        @Map('value')
        @Transform((val: any) => val.toUpperCase())
        result!: string;
      }

      const mapper = new TestMapper();
      const result = mapper.tryTransform({ value: null });

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Complex nested paths', () => {
    it('should handle missing nested properties with Default', () => {
      type Source = {
        user?: {
          profile?: {
            settings?: {
              theme?: string;
            };
          };
        };
      };

      @Mapper()
      class TestMapper {
        @Map('user.profile.settings.theme')
        @Default('light')
        theme!: string;
      }

      const mapper = new TestMapper();
      const result1 = mapper.transform({});
      const result2 = mapper.transform({ user: {} });
      const result3 = mapper.transform({
        user: { profile: { settings: { theme: 'dark' } } },
      });

      expect(result1.theme).toBe('light');
      expect(result2.theme).toBe('light');
      expect(result3.theme).toBe('dark');
    });
  });

  describe('Transform with complex logic', () => {
    it('should handle conditional transformations', () => {
      type Source = { score: number };

      @Mapper()
      class TestMapper {
        @Map('score')
        @Transform((score: number) => {
          if (score >= 90) return 'A';
          if (score >= 80) return 'B';
          if (score >= 70) return 'C';
          if (score >= 60) return 'D';
          return 'F';
        })
        grade!: string;
      }

      const mapper = new TestMapper();
      const result1 = mapper.transform({ score: 95 });
      const result2 = mapper.transform({ score: 75 });
      const result3 = mapper.transform({ score: 55 });

      expect(result1.grade).toBe('A');
      expect(result2.grade).toBe('C');
      expect(result3.grade).toBe('F');
    });

    it('should handle object transformations', () => {
      type Source = { data: { values: number[] } };

      @Mapper()
      class TestMapper {
        @Map('data.values')
        @Transform((values: number[]) => ({
          sum: values.reduce((a, b) => a + b, 0),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          count: values.length,
        }))
        stats!: { sum: number; avg: number; count: number };
      }

      const mapper = new TestMapper();
      const result = mapper.transform({ data: { values: [10, 20, 30] } });

      expect(result.stats.sum).toBe(60);
      expect(result.stats.avg).toBe(20);
      expect(result.stats.count).toBe(3);
    });
  });
});

