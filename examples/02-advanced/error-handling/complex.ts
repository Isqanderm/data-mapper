import { Mapper, MappingConfiguration } from '../../src';

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

const countryMapper = Mapper.create<Country, CountryDTO>({
  countryName: 'name',
  countryCode: 'code',
});

const addressMapper = Mapper.create<Address, AddressDTO>({
  streetName: 'street',
  cityName: 'city',
  country: countryMapper,
  fullAddress: (source) => {
    if (!source.city || !source.street || !source.country?.name) {
      throw new Error('Incomplete address data');
    }
    return `${source.city}, ${source.street}, ${source.country.name}`;
  },
});

const userMapper = Mapper.create<User, UserDTO>({
  fullName: 'name',
  isAdult: (source) => {
    if (source.age === undefined) {
      throw new Error('Age is required');
    }
    return source.age >= 18;
  },
  address: addressMapper,
});

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
  const target = userMapper.execute(source);
  console.log('Mapped user:', target);
} catch (error) {
  const e = error as Error;
  console.error('An error occurred during mapping:', e.message);
}

try {
  const targetWithError = userMapper.execute(sourceWithError);
  console.log('Mapped user with error:', targetWithError);
} catch (error) {
  const e = error as Error;
  console.error('An error occurred during mapping:', e.message);
}
