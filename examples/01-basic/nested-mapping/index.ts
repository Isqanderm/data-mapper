import { Mapper, Map, MapFrom, plainToInstance } from 'om-data-mapper';

class Employee {
  constructor(
    public person: { fullName: string },
    public email: string,
    public age: number,
  ) {}
}

type EmployeeDTO = {
  fullName?: string;
  emailAddress?: string;
  isAdult?: boolean;
};

@Mapper<Employee, EmployeeDTO>()
class EmployeeMapper {
  @Map('person.fullName')
  fullName!: string;

  @Map('email')
  emailAddress!: string;

  @MapFrom((source: Employee) => source.age >= 18)
  isAdult!: boolean;
}

const employee = new Employee({ fullName: 'John Doe' }, 'john.doe@example.com', 30);
const employeeDTO = plainToInstance<Employee, EmployeeDTO>(EmployeeMapper, employee);

console.log(employeeDTO);
// { fullName: 'John Doe', emailAddress: 'john.doe@example.com', isAdult: true }
