import { Mapper, Map, MapFrom, plainToInstance } from 'om-data-mapper';

class Employee {
  constructor(
    public name: string,
    public email: string,
    public age: number,
    public array: { numbers: { number: number }[] }[],
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
      floor: number;
    };
  };
  array: number[];
}

@Mapper<Employee, EmployeeDTO>()
class EmployeeMapper {
  @Map('name')
  fullName!: string;

  @Map('email')
  emailAddress!: string;

  @MapFrom((source: Employee) => source.age >= 18)
  isAdult!: boolean;

  @MapFrom((source: Employee) => ({
    city: source.address.city,
    street: source.address.street,
    houseNumber: source.address.houseNumber,
    full: {
      apartment: source.address.apartment,
      floor: source.address.floor,
    },
  }))
  address!: EmployeeDTO['address'];

  // Takes the first `number` out of each element's `numbers` array
  @MapFrom((source: Employee) => source.array.map((item) => item.numbers[0].number))
  array!: number[];
}

const employee = new Employee(
  'John Doe',
  'john.doe@example.com',
  30,
  [{ numbers: [{ number: 1 }] }, { numbers: [{ number: 2 }] }],
  {
    city: 'Moscow',
    street: 'Red square',
    houseNumber: 22,
    floor: 10,
    apartment: 40,
  },
);

const employeeDTO = plainToInstance<Employee, EmployeeDTO>(EmployeeMapper, employee);

console.log(employeeDTO);
