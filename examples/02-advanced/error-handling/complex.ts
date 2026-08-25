import { Mapper, Map, MapFrom, MapWith, plainToInstance } from 'om-data-mapper';

class Country {
  name?: string;
  code?: string;
}

class CountryDTO {
  countryName?: string;
  countryCode?: string;
}

class Address {
  street?: string;
  city?: string;
  country?: Country;
}

class AddressDTO {
  streetName?: string;
  cityName?: string;
  country?: CountryDTO;
  fullAddress?: string;
}

class User {
  name?: string;
  age?: number;
  address?: Address;
}

class UserDTO {
  fullName?: string;
  isAdult?: boolean;
  address?: AddressDTO;
}

@Mapper<Country, CountryDTO>()
class CountryMapper {
  @Map('name')
  countryName!: string;

  @Map('code')
  countryCode!: string;
}

// `unsafe: true` disables the mapper's internal try/catch so a throwing
// @MapFrom transformer propagates as a real exception, matching this
// example's try/catch-around-the-mapper pattern.
@Mapper<Address, AddressDTO>({ unsafe: true })
class AddressMapper {
  @Map('street')
  streetName!: string;

  @Map('city')
  cityName!: string;

  @MapWith(CountryMapper)
  @Map('country')
  country!: CountryDTO;

  @MapFrom((source: Address) => {
    if (!source.city || !source.street || !source.country?.name) {
      throw new Error('Incomplete address data');
    }
    return `${source.city}, ${source.street}, ${source.country.name}`;
  })
  fullAddress!: string;
}

@Mapper<User, UserDTO>({ unsafe: true })
class UserMapper {
  @Map('name')
  fullName!: string;

  @MapFrom((source: User) => {
    if (source.age === undefined) {
      throw new Error('Age is required');
    }
    return source.age >= 18;
  })
  isAdult!: boolean;

  @MapWith(AddressMapper)
  @Map('address')
  address!: AddressDTO;
}

const source: User = {
  name: 'John Doe',
  age: 25,
  address: {
    street: 'Main St',
    city: 'Metropolis',
    country: {
      name: 'USA',
      code: 'US',
    },
  },
};

const sourceWithError: User = {
  name: 'Jane Doe',
  age: 0,
  address: {
    street: 'Main St',
    city: '',
    country: {
      name: '',
      code: 'US',
    },
  },
};

try {
  const target = plainToInstance<User, UserDTO>(UserMapper, source);
  console.log('Mapped user:', target);
} catch (error) {
  const e = error as Error;
  console.error('An error occurred during mapping:', e.message);
}

try {
  const targetWithError = plainToInstance<User, UserDTO>(UserMapper, sourceWithError);
  console.log('Mapped user with error:', targetWithError);
} catch (error) {
  const e = error as Error;
  console.error('An error occurred during mapping:', e.message);
}
