/**
 * om-data-mapper transformation models — TC39 decorators (om's own API).
 * Mirrors models-transform-ct.ts field-for-field; keep both in sync.
 *
 * Note: class-level @Expose()/@Exclude() are documented no-ops in
 * docs/compat-class-transformer.md ("Class-level @Expose / @Exclude") —
 * only field-level decorators are used here.
 */
import { Expose, Exclude, Type } from '@tech-pioneer/data-mapper-class-transformer';

export class OmAddress {
  @Expose()
  city!: string;
  @Expose()
  street!: string;
}

export class OmUser {
  @Expose({ name: 'user_id' })
  id!: number;
  @Expose()
  name!: string;
  @Expose()
  @Type(() => OmAddress)
  address!: OmAddress;
  @Exclude()
  password!: string;
}
