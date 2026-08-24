import { describe, it, expect } from 'vitest';
import { Mapper, Map, MapFrom, MapWith, Transform, Default } from '../../../src/decorators';

describe('@MapWith - Nested Mapper Composition', () => {
  describe('Basic nested mapper composition', () => {
    it('should transform nested object using @MapWith with @Map', () => {
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

        @MapWith(AddressMapper)
        @Map('address')
        location!: AddressTarget;
      }

      const mapper = new UserMapper();
      const result = mapper.transform({
        name: 'John',
        address: { street: '123 Main St', city: 'New York' },
      });

      expect(result.userName).toBe('John');
      expect(result.location).toBeDefined();
      expect(result.location.fullAddress).toBe('123 Main St, New York');
    });

    it('should transform nested object using @MapWith with @MapFrom', () => {
      type AddressSource = { street: string; city: string };
      type AddressTarget = { fullAddress: string };

      type UserSource = { name: string; userAddress: AddressSource };
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

        @MapWith(AddressMapper)
        @MapFrom((src: UserSource) => src.userAddress)
        location!: AddressTarget;
      }

      const mapper = new UserMapper();
      const result = mapper.transform({
        name: 'John',
        userAddress: { street: '123 Main St', city: 'New York' },
      });

      expect(result.userName).toBe('John');
      expect(result.location).toBeDefined();
      expect(result.location.fullAddress).toBe('123 Main St, New York');
    });

    it('should handle undefined nested source', () => {
      type AddressSource = { street: string; city: string };
      type AddressTarget = { fullAddress: string };

      type UserSource = { name: string; address?: AddressSource };
      type UserTarget = { userName: string; location?: AddressTarget };

      @Mapper()
      class AddressMapper {
        @MapFrom((src: AddressSource) => `${src.street}, ${src.city}`)
        fullAddress!: string;
      }

      @Mapper()
      class UserMapper {
        @Map('name')
        userName!: string;

        @MapWith(AddressMapper)
        @Map('address')
        location?: AddressTarget;
      }

      const mapper = new UserMapper();
      const result = mapper.transform({ name: 'John' });

      expect(result.userName).toBe('John');
      expect(result.location).toBeUndefined();
    });

    it('should handle null nested source', () => {
      type AddressSource = { street: string; city: string };
      type AddressTarget = { fullAddress: string };

      type UserSource = { name: string; address: AddressSource | null };
      type UserTarget = { userName: string; location?: AddressTarget };

      @Mapper()
      class AddressMapper {
        @MapFrom((src: AddressSource) => `${src.street}, ${src.city}`)
        fullAddress!: string;
      }

      @Mapper()
      class UserMapper {
        @Map('name')
        userName!: string;

        @MapWith(AddressMapper)
        @Map('address')
        location?: AddressTarget;
      }

      const mapper = new UserMapper();
      const result = mapper.transform({ name: 'John', address: null });

      expect(result.userName).toBe('John');
      expect(result.location).toBeUndefined();
    });
  });

  describe('@MapWith with @Default', () => {
    it('should use default value when nested source is undefined', () => {
      type AddressSource = { street: string; city: string };
      type AddressTarget = { fullAddress: string };

      type UserSource = { name: string; address?: AddressSource };
      type UserTarget = { userName: string; location: AddressTarget };

      @Mapper()
      class AddressMapper {
        @MapFrom((src: AddressSource) => `${src.street}, ${src.city}`)
        fullAddress!: string;
      }

      const defaultAddress: AddressTarget = { fullAddress: 'Unknown Address' };

      @Mapper()
      class UserMapper {
        @Map('name')
        userName!: string;

        @MapWith(AddressMapper)
        @Map('address')
        @Default(defaultAddress)
        location!: AddressTarget;
      }

      const mapper = new UserMapper();
      const result = mapper.transform({ name: 'John' });

      expect(result.userName).toBe('John');
      expect(result.location).toEqual(defaultAddress);
    });
  });

  describe('@MapWith with @Transform', () => {
    it('should transform the result of nested mapper', () => {
      type AddressSource = { street: string; city: string };
      type AddressTarget = { fullAddress: string };

      type UserSource = { name: string; address: AddressSource };
      type UserTarget = { userName: string; location: string };

      @Mapper()
      class AddressMapper {
        @MapFrom((src: AddressSource) => `${src.street}, ${src.city}`)
        fullAddress!: string;
      }

      @Mapper()
      class UserMapper {
        @Map('name')
        userName!: string;

        @MapWith(AddressMapper)
        @Map('address')
        @Transform((addr: AddressTarget) => addr.fullAddress.toUpperCase())
        location!: string;
      }

      const mapper = new UserMapper();
      const result = mapper.transform({
        name: 'John',
        address: { street: '123 Main St', city: 'New York' },
      });

      expect(result.userName).toBe('John');
      expect(result.location).toBe('123 MAIN ST, NEW YORK');
    });

    it('should handle @Transform with undefined nested result', () => {
      type AddressSource = { street: string; city: string };
      type AddressTarget = { fullAddress: string };

      type UserSource = { name: string; address?: AddressSource };
      type UserTarget = { userName: string; location?: string };

      @Mapper()
      class AddressMapper {
        @MapFrom((src: AddressSource) => `${src.street}, ${src.city}`)
        fullAddress!: string;
      }

      @Mapper()
      class UserMapper {
        @Map('name')
        userName!: string;

        @MapWith(AddressMapper)
        @Map('address')
        @Transform((addr: AddressTarget | undefined) => addr?.fullAddress.toUpperCase())
        location?: string;
      }

      const mapper = new UserMapper();
      const result = mapper.transform({ name: 'John' });

      expect(result.userName).toBe('John');
      expect(result.location).toBeUndefined();
    });
  });

  describe('Arrays with nested mappers', () => {
    it('should transform array of objects using nested mapper', () => {
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
      expect(result.products[0].itemName).toBe('Item 1');
      expect(result.products[1].itemId).toBe(2);
      expect(result.products[1].itemName).toBe('Item 2');
    });
  });

  describe('Error handling in safe mode', () => {
    it('should handle errors in nested mapper gracefully', () => {
      type AddressSource = { data: any };
      type AddressTarget = { fullAddress: string };

      type UserSource = { name: string; address: AddressSource };
      type UserTarget = { userName: string; location?: AddressTarget };

      @Mapper()
      class AddressMapper {
        @MapFrom((src: AddressSource) => src.data.nested.value)
        fullAddress!: string;
      }

      @Mapper()
      class UserMapper {
        @Map('name')
        userName!: string;

        @MapWith(AddressMapper)
        @Map('address')
        location?: AddressTarget;
      }

      const mapper = new UserMapper();
      const result = mapper.tryTransform({
        name: 'John',
        address: { data: null },
      });

      expect(result.result.userName).toBe('John');
      // The nested mapper handles its own errors, so the location will have errors
      // but the outer mapper continues
      expect(result.result.location).toBeDefined();
    });

    it('should catch errors in @MapFrom transformer for nested mapper', () => {
      type AddressSource = { street: string; city: string };
      type AddressTarget = { fullAddress: string };

      type UserSource = { name: string; data: any };
      type UserTarget = { userName: string; location?: AddressTarget };

      @Mapper()
      class AddressMapper {
        @MapFrom((src: AddressSource) => `${src.street}, ${src.city}`)
        fullAddress!: string;
      }

      @Mapper()
      class UserMapper {
        @Map('name')
        userName!: string;

        @MapWith(AddressMapper)
        @MapFrom((src: UserSource) => src.data.nested.address)
        location?: AddressTarget;
      }

      const mapper = new UserMapper();
      const result = mapper.tryTransform({
        name: 'John',
        data: null,
      });

      expect(result.result.userName).toBe('John');
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Unsafe mode', () => {
    it('should throw errors in unsafe mode', () => {
      type AddressSource = { data: any };
      type AddressTarget = { fullAddress: string };

      type UserSource = { name: string; address: AddressSource };
      type UserTarget = { userName: string; location: AddressTarget };

      @Mapper({ unsafe: true })
      class AddressMapper {
        @MapFrom((src: AddressSource) => src.data.nested.value)
        fullAddress!: string;
      }

      @Mapper({ unsafe: true })
      class UserMapper {
        @Map('name')
        userName!: string;

        @MapWith(AddressMapper)
        @Map('address')
        location!: AddressTarget;
      }

      const mapper = new UserMapper();

      expect(() =>
        mapper.transform({
          name: 'John',
          address: { data: null },
        }),
      ).toThrow();
    });
  });

  describe('Complex nested scenarios', () => {
    it('should handle deeply nested mappers', () => {
      type CitySource = { name: string; country: string };
      type CityTarget = { fullName: string };

      type AddressSource = { street: string; city: CitySource };
      type AddressTarget = { streetName: string; cityInfo: CityTarget };

      type UserSource = { name: string; address: AddressSource };
      type UserTarget = { userName: string; location: AddressTarget };

      @Mapper()
      class CityMapper {
        @MapFrom((src: CitySource) => `${src.name}, ${src.country}`)
        fullName!: string;
      }

      @Mapper()
      class AddressMapper {
        @Map('street')
        streetName!: string;

        @MapWith(CityMapper)
        @Map('city')
        cityInfo!: CityTarget;
      }

      @Mapper()
      class UserMapper {
        @Map('name')
        userName!: string;

        @MapWith(AddressMapper)
        @Map('address')
        location!: AddressTarget;
      }

      const mapper = new UserMapper();
      const result = mapper.transform({
        name: 'John',
        address: {
          street: '123 Main St',
          city: { name: 'New York', country: 'USA' },
        },
      });

      expect(result.userName).toBe('John');
      expect(result.location.streetName).toBe('123 Main St');
      expect(result.location.cityInfo.fullName).toBe('New York, USA');
    });

    it('should handle @MapWith with multiple decorators', () => {
      type AddressSource = { street: string; city: string };
      type AddressTarget = { fullAddress: string };

      type UserSource = { name: string; primaryAddress?: AddressSource };
      type UserTarget = { userName: string; location: string };

      @Mapper()
      class AddressMapper {
        @MapFrom((src: AddressSource) => `${src.street}, ${src.city}`)
        fullAddress!: string;
      }

      @Mapper()
      class UserMapper {
        @Map('name')
        userName!: string;

        @MapWith(AddressMapper)
        @MapFrom((src: UserSource) => src.primaryAddress)
        @Transform((addr: AddressTarget | undefined) => addr?.fullAddress || 'No address')
        location!: string;
      }

      const mapper = new UserMapper();

      const result1 = mapper.transform({
        name: 'John',
        primaryAddress: { street: '123 Main St', city: 'New York' },
      });

      const result2 = mapper.transform({ name: 'Jane' });

      expect(result1.userName).toBe('John');
      expect(result1.location).toBe('123 Main St, New York');

      expect(result2.userName).toBe('Jane');
      // When primaryAddress is undefined, nested mapper returns undefined,
      // and Transform handles it
      expect(result2.location).toBe('No address');
    });
  });
});


