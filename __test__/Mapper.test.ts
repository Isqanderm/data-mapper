import { Mapper } from "../src";

class Address {
  constructor(
    public city: string,
    public street: string,
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
      address: "address",
    });

    const user = new User("John Doe", new Address("123 Main St", "Anytown"));
    const userDTO = userMapper.execute(user);

    expect(userDTO.fullName).toBe(user.name);
  });

  it("maps nested properties correctly using dot notation", () => {
    const userMapper = new Mapper<User, UserNestedDTO>({
      fullName: "name",
      streetName: "address.street",
      cityName: "address.city",
    });

    const user = new User("Jane Doe", new Address("456 Elm St", "Springfield"));
    const userDTO = userMapper.execute(user);

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
    const userDTO = userMapper.execute(user);

    expect(userDTO.address.streetName).toBe(user.address.street.toUpperCase());
    expect(userDTO.address.cityName).toBe(user.address.city.toLowerCase());
  });

  it("should correctly map using a nested mapper", () => {
    const addressMapper = new Mapper<Address, AddressDTO>({
      cityName: "city",
      streetName: "street",
    });
    const userMapper = new Mapper<User, UserDTO>({
      fullName: "name",
      address: addressMapper,
    });

    const user = new User("John Doe", new Address("Anytown", "123 Main St"));
    const userDTO = userMapper.execute(user);

    expect(userDTO.fullName).toEqual(user.name);
    expect(userDTO.address.cityName).toEqual(user.address.city);
    expect(userDTO.address.streetName).toEqual(user.address.street);
  });

  describe("Nested Mappers", () => {
    it("should correctly map objects with three levels of nesting", () => {
      class Address {
        constructor(
          public city: string,
          public street: string,
        ) {}
      }

      class ContactInfo {
        constructor(
          public email: string,
          public address: Address,
        ) {}
      }

      class Person {
        constructor(
          public name: string,
          public contactInfo: ContactInfo,
        ) {}
      }

      interface AddressDTO {
        city: string;
        street: string;
      }

      interface ContactInfoDTO {
        email: string;
        address: AddressDTO;
      }

      interface PersonDTO {
        name: string;
        contactInfo: ContactInfoDTO;
      }

      const addressMapper = new Mapper<Address, AddressDTO>({
        city: "city",
        street: "street",
      });

      const contactInfoMapper = new Mapper<ContactInfo, ContactInfoDTO>({
        email: "email",
        address: addressMapper,
      });

      const personMapper = new Mapper<Person, PersonDTO>({
        name: "name",
        contactInfo: contactInfoMapper,
      });

      const person = new Person(
        "John Doe",
        new ContactInfo(
          "john@example.com",
          new Address("New York", "5th Avenue"),
        ),
      );

      const personDTO = personMapper.execute(person);

      // Проверки
      expect(personDTO.name).toEqual(person.name);
      expect(personDTO.contactInfo.email).toEqual(person.contactInfo.email);
      expect(personDTO.contactInfo.address.city).toEqual(
        person.contactInfo.address.city,
      );
      expect(personDTO.contactInfo.address.street).toEqual(
        person.contactInfo.address.street,
      );
    });
  });

  it("maps simple properties with default values", () => {
    class User {
      constructor(
        public name: string,
        public lastName?: string,
      ) {}
    }

    interface UserDTO {
      firstName: string;
      lastName: string;
    }

    const userMapper = new Mapper<User, UserDTO>(
      {
        firstName: "name",
        lastName: "lastName",
      },
      { lastName: null },
    );

    const user = new User("John Doe");
    const userDTO = userMapper.execute(user);

    expect(userDTO.firstName).toBe(user.name);
    expect(userDTO.lastName).toBe(null);
  });

  it("should correctly map using a nested mapper with default values", () => {
    class Address {
      constructor(
        public city: string,
        public street?: string,
      ) {}
    }

    class User {
      constructor(
        public name: string,
        public address: Address,
      ) {}
    }

    const addressMapper = new Mapper<Address, AddressDTO>(
      {
        cityName: "city",
        streetName: "street",
      },
      { streetName: "AnyStreet" },
    );
    const userMapper = new Mapper<User, UserDTO>({
      fullName: "name",
      address: addressMapper,
    });

    const user = new User("John Doe", new Address("Anytown"));
    const userDTO = userMapper.execute(user);

    expect(userDTO.fullName).toEqual(user.name);
    expect(userDTO.address.cityName).toEqual(user.address.city);
    expect(userDTO.address.streetName).toEqual('AnyStreet');
  });
});
