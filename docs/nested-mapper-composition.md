# Nested Mapper Composition with @MapWith

The `@MapWith` decorator enables you to compose mappers by using one mapper class to transform nested objects within another mapper. This feature restores the nested mapper composition capability from the legacy BaseMapper API.

## Basic Usage

### Simple Nested Mapping with @Map

Use `@MapWith` together with `@Map` to transform a nested object:

```typescript
import { Mapper, Map, MapFrom, MapWith } from 'om-data-mapper';

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

console.log(result);
// {
//   userName: 'John',
//   location: { fullAddress: '123 Main St, New York' }
// }
```

### Nested Mapping with @MapFrom

Use `@MapWith` with `@MapFrom` to transform data from a custom source path:

```typescript
@Mapper()
class UserMapper {
  @Map('name')
  userName!: string;

  @MapWith(AddressMapper)
  @MapFrom((src: UserSource) => src.userAddress)
  location!: AddressTarget;
}

const result = mapper.transform({
  name: 'John',
  userAddress: { street: '123 Main St', city: 'New York' },
});
```

## Advanced Features

### Handling Undefined/Null Values

The `@MapWith` decorator gracefully handles undefined or null nested sources:

```typescript
type UserSource = { name: string; address?: AddressSource };

@Mapper()
class UserMapper {
  @Map('name')
  userName!: string;

  @MapWith(AddressMapper)
  @Map('address')
  location?: AddressTarget;
}

const result = mapper.transform({ name: 'John' });
// { userName: 'John', location: undefined }
```

### Using Default Values

Combine `@MapWith` with `@Default` to provide fallback values:

```typescript
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

const result = mapper.transform({ name: 'John' });
// { userName: 'John', location: { fullAddress: 'Unknown Address' } }
```

### Transforming Nested Results

Use `@Transform` to further process the result from the nested mapper:

```typescript
@Mapper()
class UserMapper {
  @Map('name')
  userName!: string;

  @MapWith(AddressMapper)
  @Map('address')
  @Transform((addr: AddressTarget) => addr.fullAddress.toUpperCase())
  location!: string;
}

const result = mapper.transform({
  name: 'John',
  address: { street: '123 Main St', city: 'New York' },
});
// { userName: 'John', location: '123 MAIN ST, NEW YORK' }
```

### Deeply Nested Mappers

You can nest mappers multiple levels deep:

```typescript
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

const result = mapper.transform({
  name: 'John',
  address: {
    street: '123 Main St',
    city: { name: 'New York', country: 'USA' },
  },
});
// {
//   userName: 'John',
//   location: {
//     streetName: '123 Main St',
//     cityInfo: { fullName: 'New York, USA' }
//   }
// }
```

## Working with Arrays

To transform arrays of objects using nested mappers, use `@MapFrom` with array mapping:

```typescript
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
  @MapFrom((src: Source) => 
    src.items.map((item) => new ItemMapper().transform(item))
  )
  products!: ItemTarget[];
}

const result = mapper.transform({
  items: [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
  ],
});
// {
//   products: [
//     { itemId: 1, itemName: 'Item 1' },
//     { itemId: 2, itemName: 'Item 2' }
//   ]
// }
```

## Error Handling

### Safe Mode (Default)

In safe mode, errors in nested mappers are caught and collected:

```typescript
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

// result.result.userName === 'John'
// result.errors will contain error information
```

### Unsafe Mode

In unsafe mode, errors are thrown immediately:

```typescript
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
// This will throw an error
mapper.transform({
  name: 'John',
  address: { data: null },
});
```

## Combining Multiple Decorators

You can combine `@MapWith` with multiple decorators for complex transformations:

```typescript
@Mapper()
class UserMapper {
  @Map('name')
  userName!: string;

  @MapWith(AddressMapper)
  @MapFrom((src: UserSource) => src.primaryAddress)
  @Transform((addr: AddressTarget | undefined) => addr?.fullAddress || 'No address')
  location!: string;
}
```

## Performance

The `@MapWith` decorator uses JIT compilation just like other decorators, ensuring optimal performance. The nested mapper instance is created once during compilation and reused for all transformations.

## Best Practices

1. **Keep mappers focused**: Each mapper should handle a single level of transformation
2. **Use type safety**: Leverage TypeScript types for source and target objects
3. **Handle undefined gracefully**: Use optional types and `@Default` when nested data might be missing
4. **Combine decorators wisely**: Use `@Transform` for post-processing nested results
5. **Test thoroughly**: Write tests for both successful transformations and error cases

## Migration from Legacy API

If you're migrating from the legacy BaseMapper API, here's how to convert nested mapper usage:

### Legacy API
```typescript
const userMapper = Mapper.create<UserSource, UserTarget>({
  userName: 'name',
  location: addressMapper, // Pass mapper instance
});
```

### Decorator API
```typescript
@Mapper()
class UserMapper {
  @Map('name')
  userName!: string;

  @MapWith(AddressMapper) // Pass mapper class
  @Map('address')
  location!: AddressTarget;
}
```

The key difference is that the Decorator API uses mapper **classes** instead of mapper **instances**, allowing for better type inference and JIT compilation optimization.

