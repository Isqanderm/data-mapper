import { Mapper, MappingConfiguration } from "../src";

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
    const { result: userDTO } = userMapper.execute(user);

    expect(userDTO.fullName).toBe(user.name);
  });

  it("maps nested properties correctly using dot notation", () => {
    const userMapper = new Mapper<User, UserNestedDTO>({
      fullName: "name",
      streetName: "address.street",
      cityName: "address.city",
    });

    const user = new User("Jane Doe", new Address("456 Elm St", "Springfield"));
    const { result: userDTO } = userMapper.execute(user);

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
    const { result: userDTO } = userMapper.execute(user);

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
    const { result: userDTO } = userMapper.execute(user);

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

      const { result: personDTO } = personMapper.execute(person);

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
    interface User {
      name: string;
      lastName?: string;
      years?: number;
    }

    interface UserDTO {
      firstName: string;
      lastName: string;
      profile: {
        years: number;
      };
    }

    const userMapper = new Mapper<User, UserDTO>(
      {
        firstName: "name",
        lastName: "lastName",
        profile: {
          years: "years",
        },
      },
      { lastName: null, profile: { years: 31 } },
    );

    const user: User = {
      name: "John",
    };
    const { result: userDTO } = userMapper.execute(user);

    expect(userDTO).toStrictEqual({
      firstName: "John",
      lastName: null,
      profile: {
        years: 31,
      },
    });
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
    const { result: userDTO } = userMapper.execute(user);

    expect(userDTO).toStrictEqual({
      fullName: "John Doe",
      address: {
        cityName: "Anytown",
        streetName: "AnyStreet",
      },
    });
  });

  it("should correctly map from array and nested object", () => {
    class Employee {
      constructor(
        public name: string,
        public email: string,
        public age: number,
        public array: { number: number }[],
        public address: {
          city: string;
          street: string;
          houseNumber: number;
        },
        public apartment: {
          number: number;
          floor: number;
        },
      ) {}
    }

    interface EmployeeDTO {
      fullName?: string;
      emailAddress?: string;
      isAdult?: boolean;
      address: {
        city: string;
        street: string;
        houseNumber: number;
        full: {
          apartment: number;
          floor: string;
        };
      };
      array: number;
    }

    const mappingConfig: MappingConfiguration<Employee, EmployeeDTO> = {
      fullName: "name",
      emailAddress: "email",
      isAdult: (source) => source.age >= 18,
      address: {
        city: "address.city",
        street: "address.street",
        houseNumber: "address.houseNumber",
        full: {
          apartment: "apartment.number",
          floor: "apartment.floor",
        },
      },
      // @ts-ignore
      array: "array[0].number",
    };
    const employeeMapper = new Mapper<Employee, EmployeeDTO>(mappingConfig);

    const employee = new Employee(
      "John Doe",
      "john.doe@example.com",
      30,
      [{ number: 1 }, { number: 2 }],
      {
        city: "Moscow",
        street: "Red square",
        houseNumber: 22,
      },
      {
        floor: 10,
        number: 40,
      },
    );

    const employeeDTO = employeeMapper.execute(employee);

    expect(employeeDTO).toStrictEqual({
      errors: [],
      result: {
        address: {
          city: "Moscow",
          street: "Red square",
          houseNumber: 22,
          full: {
            apartment: 40,
            floor: 10,
          },
        },
        array: 1,
        emailAddress: "john.doe@example.com",
        fullName: "John Doe",
        isAdult: true,
      },
    });
  });
});
