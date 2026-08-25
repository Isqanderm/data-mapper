import { Mapper, Map, MapFrom, MapWith, plainToInstance } from 'om-data-mapper';

type Address = {
  street?: string;
  city?: string;
};

type AddressDTO = {
  streetName?: string;
  cityName?: string;
  fullAddress?: string;
};

type User = {
  name?: string;
  address?: Address;
};

type UserDTO = {
  fullName?: string;
  address?: AddressDTO;
};

@Mapper<Address, AddressDTO>()
class AddressMapper {
  @Map('street')
  streetName!: string;

  @Map('city')
  cityName!: string;

  @MapFrom((source: Address) => `${source.city}, ${source.street}`)
  fullAddress!: string;
}

@Mapper<User, UserDTO>()
class UserMapper {
  @Map('name')
  fullName!: string;

  @MapWith(AddressMapper)
  @Map('address')
  address!: AddressDTO;
}

const user: User = {
  name: 'John Doe',
  address: {
    street: 'Main St',
    city: 'Metropolis',
  },
};

const userDTO = plainToInstance<User, UserDTO>(UserMapper, user);
console.log(userDTO);
// {
//   fullName: "John Doe",
//   address: {
//     streetName: "Main St",
//     cityName: "Metropolis",
//     fullAddress: "Metropolis, Main St",
//   },
// }
