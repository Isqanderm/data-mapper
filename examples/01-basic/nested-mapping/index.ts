import { Mapper } from '../../src';

class Employee {
  constructor(
    public person: { fullName: string },
    public email: string,
    public age: number,
  ) {}
}

class EmployeeDTO {
  fullName?: string;
  emailAddress?: string;
  isAdult?: boolean;
}

const employeeMapper = Mapper.create<Employee, EmployeeDTO>({
  fullName: 'person.fullName',
  emailAddress: 'email',
  isAdult: (source) => source.age >= 18,
});

const employee = new Employee({ fullName: 'John Doe' }, 'john.doe@example.com', 30);
const employeeDTO = employeeMapper.execute(employee);

console.log(employeeDTO);
// { fullName: 'John Doe', emailAddress: 'john.doe@example.com', isAdult: true }
