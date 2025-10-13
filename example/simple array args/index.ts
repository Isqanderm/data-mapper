import { Mapper } from '../../src';

type Employee = {
  name: string;
  email: string;
  age: number;
  jobs: JobType[];
};

type JobType = {
  id: number;
  name: string;
};

type EmployeeDTO = {
  fullName: string;
  emailAddress: string;
  isAdult: boolean;
  job: JobType;
  jobName: string;
};

const employeeMapper = Mapper.create<Employee, EmployeeDTO>({
  fullName: 'name',
  emailAddress: 'email',
  isAdult: (source) => source.age >= 18,
  job: (source) => source.jobs[0],
  jobName: 'jobs.[0].name',
});

const jobs: JobType[] = [
  {
    id: 1,
    name: 'Electronic',
  },
  {
    id: 2,
    name: 'Janitor',
  },
  {
    id: 3,
    name: 'Driver',
  },
];

const employee: Employee = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  age: 30,
  jobs,
};
const employeeDTO = employeeMapper.execute(employee);

console.log(employeeDTO);

// {
//   errors: [],
//   result: {
//     fullName: 'John Doe',
//     emailAddress: 'john.doe@example.com',
//     isAdult: true,
//     job: {
//       id: 1, name: 'Electronic'
//     },
//     jobName: 'Electronic'
//   }
// }
