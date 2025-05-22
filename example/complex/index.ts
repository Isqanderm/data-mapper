import { Mapper } from "../../src";

type Address = {
  street?: string;
  city?: string;
}

type AddressDTO = {
  streetName?: string;
  cityName?: string;
  fullAddress?: string;
}

type User = {
  name?: string;
  address?: Address;
}

type UserDTO = {
  fullName?: string;
  address?: AddressDTO;
}

const addressMapper = Mapper.create<Address, AddressDTO>({
  streetName: "street",
  cityName: "city",
  fullAddress: function (object) {
    return `${object.city}, ${object.street}`;
  },
});

const userMapper = Mapper.create<User, UserDTO>({
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
