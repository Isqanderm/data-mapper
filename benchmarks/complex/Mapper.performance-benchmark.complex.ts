import { Suite } from 'benchmark';
import { Mapper } from '../../src';

interface Country {
  name?: string;
  code?: string;
}

interface CountryDTO {
  countryName?: string;
  countryCode?: string;
}

interface Address {
  street?: string;
  city?: string;
  country?: Country;
}

interface AddressDTO {
  streetName?: string;
  cityName?: string;
  country?: CountryDTO;
  fullAddress?: string;
}

interface User {
  name?: string;
  address?: Address;
}

interface UserDTO {
  fullName?: string;
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
  fullAddress: (object) => `${object.city}, ${object.street}, ${object.country?.name}`,
});

const userMapper = Mapper.create<User, UserDTO>({
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
    const results = this.map((bench: any) => ({
      name: bench.name,
      hz: bench.hz,
      rme: bench.stats.rme,
      sampleCount: bench.stats.sample.length,
    }));
    console.log(JSON.stringify(results, null, 2));
  })
  .run({ async: true });
