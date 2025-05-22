import { Mapper } from "../../src";

type Employee = {
  name: string,
  email: string,
  age: number,
  jobId: number,
}

type EmployeeDTO = {
  fullName: string;
  name: string;
  emailAddress: string;
  isAdult: boolean;
}

const employeeMapper = Mapper.create<Employee, EmployeeDTO>({
  fullName: "name",
  emailAddress: "email",
  name: 'name',
  isAdult: (source) => source.age >= 18,
});

const employee: Employee = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  age: 30,
  jobId: 1,
};
const employeeDTO = employeeMapper.execute(employee);

console.log(employeeDTO);

// {
//   errors: [],
//   result: {
//     fullName: 'John Doe',
//     emailAddress: 'john.doe@example.com',
//     name: 'John Doe',
//     isAdult: true
//   }
// }

