import { Suite } from "benchmark";
import { Mapper } from "../src/Mapper";
import { MappingConfiguration } from "../src/interface";

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

interface UserDetails {
  age: number;
}

interface Source {
  id: number;
  name: string;
  details: UserDetails;
  address: Address;
}

interface Target {
  userId: number;
  fullName: string;
  age: number;
  address: AddressDTO;
}

const countryMapper = new Mapper<Country, CountryDTO>({
  countryName: "name",
  countryCode: "code",
}, {}, { useUnsafe: true } );

const addressMapper = new Mapper<Address, AddressDTO>({
  streetName: "street",
  cityName: "city",
  country: countryMapper,
  fullAddress: (source) => {
    if (!source.city || !source.street || !source.country?.name) {
      throw new Error("Incomplete address data");
    }
    return `${source.city}, ${source.street}, ${source.country.name}`;
  },
}, {} , { useUnsafe: true });

const mappingConfig: MappingConfiguration<Source, Target> = {
  userId: "id",
  fullName: "name",
  age: "details.age",
  address: addressMapper,
};

const sourceData: Source = {
  id: 1,
  name: "John Doe",
  details: {
    age: 30,
  },
  address: {
    street: "123 Main St",
    city: "Metropolis",
    country: {
      name: "USA",
      code: "US",
    },
  },
};

const sourceDataWithError: Source = {
  id: 1,
  name: "John Doe",
  details: {
    age: 30,
  },
  address: {
    street: "",
    city: "",
    country: {
      name: "",
      code: "US",
    },
  },
};

const mapper = new Mapper<Source, Target>(mappingConfig, {}, { useUnsafe: true });

function vanillaMapper(source: Source): Target {
  const location = source.address;
  const country = location.country;

  const address: AddressDTO = {
    streetName: location.street,
    cityName: location.city,
    country: {
      countryName: country?.name,
      countryCode: country?.code,
    },
    fullAddress: `${location.city}, ${location.street}, ${location.country?.name}`,
  };

  return {
    userId: source.id,
    fullName: source.name,
    age: source.details.age,
    address,
  };
}

const fullAddress = (source: any) => {
  if (!source.city || !source.street || !source.country?.name) {
    throw new Error("Incomplete address data");
  }
  return `${source.city}, ${source.street}, ${source.country.name}`;
}

function alternativeMapper(source: Source): Target {
  const location = source.address;
  const country = location.country;

  let fullAddressResult = "";
  try {
    fullAddressResult = fullAddress(location)
  } catch (e) {}

  const address: AddressDTO = {
    streetName: location.street,
    cityName: location.city,
    country: {
      countryName: country?.name,
      countryCode: country?.code,
    },
    fullAddress: fullAddressResult,
  };

  return {
    userId: source.id,
    fullName: source.name,
    age: source.details.age,
    address,
  };
}

const suite = new Suite();
mapper.compile();

suite
  .add("Mapper#execute with valid data", function () {
    mapper.execute(sourceData);
  })
  .add("Mapper#execute with invalid data", function () {
    mapper.execute(sourceDataWithError);
  })
  .add("Vanilla mapper with valid data", function () {
    vanillaMapper(sourceData)
  })
  .add("Vanilla mapper with invalid data", function () {
    alternativeMapper(sourceDataWithError)
  })
  .on("cycle", function (event: any) {
    console.log(String(event.target));
  })
  .on("complete", function (this: any) {
    console.log("Fastest is " + this.filter("fastest").map("name"));
  })
  .run({ async: true });
