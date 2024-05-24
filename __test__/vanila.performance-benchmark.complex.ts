import { Suite } from "benchmark";

class Address {
  street?: string;
  city?: string;
}

class AddressDTO {
  streetName?: string;
  cityName?: string;
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

function mapAddress(source: Address): AddressDTO {
  return {
    streetName: source.street,
    cityName: source.city,
    fullAddress: `${source.city}, ${source.street}`,
  };
}

function mapUser(source: User): UserDTO {
  return {
    fullName: source.name,
    address: mapAddress(source.address!),
  };
}

const user: User = {
  name: "John Doe",
  address: {
    street: "Main St",
    city: "Metropolis",
  },
};

// Создание тестового набора
const suite = new Suite();

suite
  .add("ManualMapper#execute", function () {
    mapUser(user);
  })
  .on("cycle", function (event: any) {
    console.log(String(event.target));
  })
  .on("complete", function (this: any) {
    console.log("Fastest is " + this.filter("fastest").map("name"));
  })
  .run({ async: true });
