import { Mapper, Map, MapFrom, plainToInstance } from 'om-data-mapper';

type Employee = {
  name: string;
  email: string;
  age: number;
  jobId: number;
};

type EmployeeDTO = {
  fullName: string;
  name: string;
  emailAddress: string;
  isAdult: boolean;
};

@Mapper<Employee, EmployeeDTO>()
class EmployeeMapper {
  @Map('name')
  fullName!: string;

  @Map('email')
  emailAddress!: string;

  @Map('name')
  name!: string;

  @MapFrom((source: Employee) => source.age >= 18)
  isAdult!: boolean;
}

const employee: Employee = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  age: 30,
  jobId: 1,
};
const employeeDTO = plainToInstance<Employee, EmployeeDTO>(EmployeeMapper, employee);

console.log(employeeDTO);

// {
//   fullName: 'John Doe',
//   emailAddress: 'john.doe@example.com',
//   name: 'John Doe',
//   isAdult: true
// }
