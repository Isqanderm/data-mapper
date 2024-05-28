import { MappingConfiguration } from "../../src/interface";
import { Mapper } from "../../src";

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
      apartment: number;
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
      apartment: "address.apartment",
      floor: "address.floor",
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
    floor: 10,
    apartment: 40,
  },
);

const employeeDTO = employeeMapper.execute(employee);

console.log(employeeDTO);
// { fullName: 'John Doe', emailAddress: 'john.doe@example.com', isAdult: true }
