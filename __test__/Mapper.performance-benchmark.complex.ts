import { Suite } from 'benchmark';
import { Mapper } from '../src/Mapper';

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
  address?: Address;
}

class UserDTO {
  fullName?: string;
  address?: AddressDTO;
}

const countryMapper = new Mapper<Country, CountryDTO>({
  countryName: 'name',
  countryCode: 'code',
});

const addressMapper = new Mapper<Address, AddressDTO>({
  streetName: 'street',
  cityName: 'city',
  country: countryMapper,
  fullAddress: function (object) {
    return `${object.city}, ${object.street}, ${object.country?.name}`;
  },
});

const userMapper = new Mapper<User, UserDTO>({
  fullName: 'name',
  address: addressMapper,
});

function mapCountry(source: Country): CountryDTO {
  return {
    countryName: source.name,
    countryCode: source.code,
  };
}

function mapAddress(source: Address): AddressDTO {
  return {
    streetName: source.street,
    cityName: source.city,
    country: mapCountry(source.country!),
    fullAddress: `${source.city}, ${source.street}, ${source.country?.name}`,
  };
}

function mapUser(source: User): UserDTO {
  return {
    fullName: source.name,
    address: mapAddress(source.address!),
  };
}

const user: User = {
  name: 'John Doe',
  address: {
    street: 'Main St',
    city: 'Metropolis',
    country: {
      name: 'USA',
      code: 'US',
    },
  },
};

const suite = new Suite();

suite
  .add('UserMapper#execute', function () {
    userMapper.execute(user);
  })
  .add('Vanilla mapper', function () {
    mapUser(user);
  })
  .on('cycle', function (event: any) {
    console.log(String(event.target));
  })
  .on('complete', function (this: any) {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ async: true });
