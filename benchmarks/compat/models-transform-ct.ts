/**
 * Upstream class-transformer transformation models — legacy decorators
 * applied PROGRAMMATICALLY (no experimentalDecorators needed in this repo).
 * Mirrors models-transform-om.ts field-for-field; keep both in sync.
 */
import 'reflect-metadata';
import { Expose, Exclude, Type } from 'class-transformer';

export class CtAddress {
  city!: string;
  street!: string;
}
Expose()(CtAddress.prototype, 'city');
Expose()(CtAddress.prototype, 'street');

export class CtUser {
  id!: number;
  name!: string;
  address!: CtAddress;
  password!: string;
}
Expose({ name: 'user_id' })(CtUser.prototype, 'id');
Expose()(CtUser.prototype, 'name');
Expose()(CtUser.prototype, 'address');
Type(() => CtAddress)(CtUser.prototype, 'address');
Exclude()(CtUser.prototype, 'password');
