import { MappingConfiguration } from "../../src/interface";
import { Mapper } from "../../src";

class Employee {
  constructor(
    public name: string,
    public email: string,
    public age: number,
  ) {}
}

class EmployeeDTO {
  fullName?: string;
  emailAddress?: string;
  isAdult?: boolean;
}

const mappingConfig: MappingConfiguration<Employee, EmployeeDTO> = {
  fullName: 'name',
  emailAddress: 'email',
  isAdult: (source) => source.age >= 18,
};

const employeeMapper = new Mapper<Employee, EmployeeDTO>(mappingConfig);

const employee = new Employee("John Doe", "john.doe@example.com", 30);
const employeeDTO = employeeMapper.execute(employee);

console.log(employeeDTO);
// { fullName: 'John Doe', emailAddress: 'john.doe@example.com', isAdult: true }
