import { Mapper } from "../src";

class Address {
  constructor(
    public street: string,
    public city: string,
  ) {}
}

class User {
  constructor(
    public name: string,
    public address: Address,
  ) {}
}

interface AddressDTO {
  streetName: string;
  cityName: string;
}

interface UserDTO {
  fullName: string;
  address: AddressDTO;
}

interface UserNestedDTO {
  fullName: string;
  streetName: string;
  cityName: string;
}

describe("Mapper", () => {
  it("maps simple properties correctly", () => {
    const userMapper = new Mapper<User, UserDTO>({
      fullName: "name",
    });

    const user = new User("John Doe", new Address("123 Main St", "Anytown"));
    const userDTO = userMapper.map(user);

    expect(userDTO.fullName).toBe(user.name);
  });

  it("maps nested properties correctly using dot notation", () => {
    const userMapper = new Mapper<User, UserNestedDTO>({
      fullName: "name",
      streetName: "address.street",
      cityName: "address.city",
    });

    const user = new User("Jane Doe", new Address("456 Elm St", "Springfield"));
    const userDTO = userMapper.map(user);

    expect(userDTO.streetName).toBe(user.address.street);
    expect(userDTO.cityName).toBe(user.address.city);
  });

  it("handles transformation functions correctly", () => {
    const userMapper = new Mapper<User, UserDTO>({
      fullName: "name",
      address: (user) => ({
        streetName: user.address.street.toUpperCase(),
        cityName: user.address.city.toLowerCase(),
      }),
    });

    const user = new User("John Doe", new Address("123 Main St", "Anytown"));
    const userDTO = userMapper.map(user);

    expect(userDTO.address.streetName).toBe(user.address.street.toUpperCase());
    expect(userDTO.address.cityName).toBe(user.address.city.toLowerCase());
  });

  it('should correctly map using a nested mapper', () => {
    const addressMapper = new Mapper<Address, AddressDTO>({
      cityName: 'city',
      streetName: 'street',
    });
    const userMapper = new Mapper<User, UserDTO>({
      fullName: 'name',
      address: addressMapper,
    });

    const user = new User("John Doe", new Address("Anytown", "123 Main St"));
    const userDTO = userMapper.map(user);

    expect(userDTO.fullName).toEqual(user.name);
    expect(userDTO.address.cityName).toEqual(user.address.city);
    expect(userDTO.address.streetName).toEqual(user.address.street);
  });
});
