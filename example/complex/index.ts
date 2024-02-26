import { Mapper } from "../../src";

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

const addressMapper = new Mapper<Address, AddressDTO>({
  streetName: "street",
  cityName: "city",
  fullAddress: function (object) {
    return `${object.city}, ${object.street}`;
  },
});

const userMapper = new Mapper<User, UserDTO>({
  fullName: "name",
  address: addressMapper,
});

const user = {
  name: "John Doe",
  address: {
    street: "Main St",
    city: "Metropolis",
  },
};

const userDTO = userMapper.execute(user);
console.log(userDTO);
// {
//   fullName: "John Doe",
//   address: {
//     streetName: "Main St",
//     cityName: "Metropolis",
//     fullAddress: "Metropolis, Main St",
//   },
// }
