import { Mapper } from '../../src';

type Employee = {
  name: string;
  email: string;
  age: number;
  jobId: number;
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

const employeeMapper = Mapper.create<[Employee, JobType[]], EmployeeDTO>({
  fullName: '$0.name',
  emailAddress: '$0.email',
  isAdult: ([source]) => source.age >= 18,
  job: ([source, jobs]) => jobs.find((job) => job.id === source.jobId)!,
  jobName: '$1.[0].name',
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
  jobId: 1,
};
const employeeDTO = employeeMapper.execute([employee, jobs]);

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
