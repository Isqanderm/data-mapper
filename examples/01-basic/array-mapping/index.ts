import { Mapper, MapFrom, plainToInstance } from 'om-data-mapper';

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

// The decorator API maps from a single Source object, so combining two
// independent inputs (an employee and a job catalog) is modelled as a
// tuple source that each @MapFrom callback destructures.
type EmployeeAndJobs = [employee: Employee, jobs: JobType[]];

@Mapper<EmployeeAndJobs, EmployeeDTO>()
class EmployeeMapper {
  @MapFrom(([employee]: EmployeeAndJobs) => employee.name)
  fullName!: string;

  @MapFrom(([employee]: EmployeeAndJobs) => employee.email)
  emailAddress!: string;

  @MapFrom(([employee]: EmployeeAndJobs) => employee.age >= 18)
  isAdult!: boolean;

  @MapFrom(([employee, jobs]: EmployeeAndJobs) => jobs.find((job) => job.id === employee.jobId)!)
  job!: JobType;

  @MapFrom(([, jobs]: EmployeeAndJobs) => jobs[0].name)
  jobName!: string;
}

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
const employeeDTO = plainToInstance<EmployeeAndJobs, EmployeeDTO>(EmployeeMapper, [employee, jobs]);

console.log(employeeDTO);

// {
//   fullName: 'John Doe',
//   emailAddress: 'john.doe@example.com',
//   isAdult: true,
//   job: {
//     id: 1, name: 'Electronic'
//   },
//   jobName: 'Electronic'
// }
