import { performance } from 'perf_hooks';
import { Mapper } from '../src';

export class Address {
  constructor(public street: string, public city: string) {}
}

export interface AddressDTO {
  streetName: string;
  cityName: string;
}

class SimpleUser {
  constructor(public id: number, public name: string) {}
}

interface SimpleUserDTO {
  userId: number;
  userName: string;
}

class AdvancedUser {
  constructor(public name: string, public age: number, public address: Address) {}
}

interface AdvancedUserDTO {
  fullName: string;
  isAdult: boolean;
  address: AddressDTO;
}

interface AdvancedUserDotsDTO {
  fullName: string;
  isAdult: boolean;
  streetName: string;
  cityName: string;
}

describe('Mapper Performance Tests', () => {
  it('Simple mapping performance', () => {
    const N = 1_000_000;
    const simpleUsers = Array.from({ length: N }, (_, i) => new SimpleUser(i, `User ${i}`));
    const simpleUserMapper = new Mapper<SimpleUser, SimpleUserDTO>({
      userId: 'id',
      userName: 'name',
    });

    const start = performance.now();
    const simpleUserDTOs = simpleUsers.map(user => simpleUserMapper.execute(user));
    const end = performance.now();

    console.log(`Mapping ${N} SimpleUser objects took ${end - start} ms`);
    expect(simpleUserDTOs.length).toEqual(N);
  });

  it('Nested mapping performance', () => {
    const N = 1_000_000;
    const advancedUsers = Array.from({ length: N }, (_, i) => new AdvancedUser(`User ${i}`, i % 30 + 18, new Address(`Street ${i}`, `City ${i}`)));
    const addressMapper = new Mapper<Address, AddressDTO>({
      streetName: 'street',
      cityName: 'city',
    });
    const advancedUserMapper = new Mapper<AdvancedUser, AdvancedUserDTO>({
      fullName: 'name',
      isAdult: user => user.age >= 18,
      address: addressMapper,
    });

    const start = performance.now();
    const advancedUserDTOs = advancedUsers.map(user => advancedUserMapper.execute(user));
    const end = performance.now();

    console.log(`Mapping ${N} nested objects took ${end - start} ms`);
    expect(advancedUserDTOs.length).toEqual(N);
  });

  it('Dots mapping performance', () => {
    const N = 1_000_000;
    const advancedUsers = Array.from({ length: N }, (_, i) => new AdvancedUser(`User ${i}`, i % 30 + 18, new Address(`Street ${i}`, `City ${i}`)));
    const advancedUserMapper = new Mapper<AdvancedUser, AdvancedUserDotsDTO>({
      fullName: 'name',
      isAdult: user => user.age >= 18,
      streetName: 'address.street',
      cityName: "address.city",
    });

    const start = performance.now();
    const advancedUserDTOs = advancedUsers.map(user => advancedUserMapper.execute(user));
    const end = performance.now();

    console.log(`Mapping ${N} AdvancedUser objects took ${end - start} ms`);
    expect(advancedUserDTOs.length).toEqual(N);
  });
});
