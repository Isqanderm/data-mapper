import { Suite } from 'benchmark';
import { Mapper } from '../src/Mapper';

class Address {
  street?: string;
  city?: string;
}

class AddressDTO {
  streetName?: string;
  cityName?: string;
  fullAddress?: string;
}

class User {
  name?: string;
  address?: Address;
}

class UserDTO {
  fullName?: string;
  address?: AddressDTO;
}

const addressMapper = new Mapper<Address, AddressDTO>({
  streetName: 'street',
  cityName: 'city',
  fullAddress: function (object) {
    return `${object.city}, ${object.street}`;
  },
});

const userMapper = new Mapper<User, UserDTO>({
  fullName: 'name',
  address: addressMapper,
});

const user: User = {
  name: 'John Doe',
  address: {
    street: 'Main St',
    city: 'Metropolis',
  },
};

// Создание тестового набора
const suite = new Suite();

suite
  .add('UserMapper#execute', function () {
    userMapper.execute(user);
  })
  .on('cycle', function (event: any) {
    console.log(String(event.target));
  })
  .on('complete', function (this: any) {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ async: true });
