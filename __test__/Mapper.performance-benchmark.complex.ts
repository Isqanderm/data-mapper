import { Suite } from "benchmark";
import mapper from "@cookbook/mapper-js";
import { Mapper } from "../src/Mapper";

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

const countryMapper = Mapper.create<Country, CountryDTO>({
  countryName: "name",
  countryCode: "code",
});

const addressMapper = Mapper.create<Address, AddressDTO>({
  streetName: "street",
  cityName: "city",
  country: countryMapper,
  fullAddress: function (object) {
    return `${object.city}, ${object.street}, ${object.country?.name}`;
  },
});

const userMapper = Mapper.create<User, UserDTO>({
  fullName: "name",
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

const mappingJs = mapper((map) => ({
  'fullName': map('name').value,
  'address.streetName': map('address.street').value,
  'address.cityName': map('address.city').value,
  'address.fullAddress': map('address')
    // @ts-ignore
    .transform(({ city, street, country }: Address): string => `${city}, ${street}, ${country?.name}`)
    .value,
  'address.country.countryName': map('address.country.name').value,
  'address.country.countryCode': map('address.country.code').value,
}));

const user: User = {
  name: "John Doe",
  address: {
    street: "Main St",
    city: "Metropolis",
    country: {
      name: "USA",
      code: "US",
    },
  },
};

const suite = new Suite();

suite
  .add("UserMapper#execute", function () {
    userMapper.execute(user);
  })
  .add("@cookbook/mapper-js", function () {
    // @ts-ignore
    mappingJs(user);
  })
  .add("Vanilla mapper", function () {
    mapUser(user);
  })
  .on("cycle", function (event: any) {
    console.log(String(event.target));
  })
  .on("complete", function (this: any) {
    console.log("Fastest is " + this.filter("fastest").map("name"));
  })
  .run({ async: true });
