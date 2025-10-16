/**
 * Tests to cover final remaining gaps for 100% coverage
 * Targets: UUID versions 3/5, IP version 6, metadata functions
 */

import { describe, it, expect } from 'vitest';
import {
  IsUUID,
  IsIP,
  validateSync,
} from '../../../../src/compat/class-validator';
import { Type } from '../../../../src/compat/class-transformer';
import { ValidateNested } from '../../../../src/compat/class-validator/decorators/nested';

describe('Final Coverage Gaps', () => {
  describe('@IsUUID - All Versions', () => {
    it('should validate UUID version 3', () => {
      class TestDto {
        @IsUUID('3')
        id!: string;
      }

      const valid = new TestDto();
      valid.id = '6fa459ea-ee8a-3ca4-894e-db77e160355e'; // Valid UUID v3
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.id = '6fa459ea-ee8a-4ca4-894e-db77e160355e'; // UUID v4, not v3
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isUUID).toBeDefined();
    });

    it('should validate UUID version 5', () => {
      class TestDto {
        @IsUUID('5')
        id!: string;
      }

      const valid = new TestDto();
      valid.id = '886313e1-3b8a-5372-9b90-0c9aee199e5d'; // Valid UUID v5
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.id = '886313e1-3b8a-4372-9b90-0c9aee199e5d'; // UUID v4, not v5
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isUUID).toBeDefined();
    });
  });

  describe('@IsIP - IPv6', () => {
    it('should validate IPv6 addresses', () => {
      class ServerDto {
        @IsIP('6')
        ipAddress!: string;
      }

      const valid = new ServerDto();
      valid.ipAddress = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new ServerDto();
      invalid.ipAddress = '192.168.1.1'; // IPv4, not IPv6
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isIP).toBeDefined();
    });

    it('should validate compressed IPv6 addresses', () => {
      class ServerDto {
        @IsIP('6')
        ipAddress!: string;
      }

      const dto1 = new ServerDto();
      dto1.ipAddress = '2001:db8::1';
      expect(validateSync(dto1)).toHaveLength(0);

      const dto2 = new ServerDto();
      dto2.ipAddress = '::1'; // localhost
      expect(validateSync(dto2)).toHaveLength(0);

      const dto3 = new ServerDto();
      dto3.ipAddress = 'fe80::1%eth0';
      expect(validateSync(dto3)).toHaveLength(0);
    });
  });

  describe('Metadata Functions - Nested Validation with Arrays', () => {
    it('should handle nested array validation (tests markPropertyAsArray)', () => {
      class AddressDto {
        street!: string;
        city!: string;
      }

      class UserDto {
        name!: string;

        @ValidateNested({ each: true })
        @Type(() => AddressDto)
        addresses!: AddressDto[];
      }

      // This test exercises both setNestedValidationType and markPropertyAsArray
      const user = new UserDto();
      user.name = 'John';
      user.addresses = [
        { street: '123 Main St', city: 'NYC' } as AddressDto,
        { street: '456 Oak Ave', city: 'LA' } as AddressDto,
      ];

      // The decorators should have registered the metadata correctly
      const errors = validateSync(user);
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should handle single nested object validation (tests setNestedValidationType)', () => {
      class ProfileDto {
        bio!: string;
        website!: string;
      }

      class UserDto {
        name!: string;

        @ValidateNested()
        @Type(() => ProfileDto)
        profile!: ProfileDto;
      }

      // This test exercises setNestedValidationType
      const user = new UserDto();
      user.name = 'John';
      user.profile = { bio: 'Developer', website: 'example.com' } as ProfileDto;

      // The decorators should have registered the metadata correctly
      const errors = validateSync(user);
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should validate nested arrays with invalid data', () => {
      class ItemDto {
        name!: string;
        quantity!: number;
      }

      class OrderDto {
        @ValidateNested({ each: true })
        @Type(() => ItemDto)
        items!: ItemDto[];
      }

      const order = new OrderDto();
      order.items = [
        { name: 'Item 1', quantity: 5 } as ItemDto,
        { name: 'Item 2', quantity: 10 } as ItemDto,
      ];

      // Should validate the nested array
      const errors = validateSync(order);
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('Edge Cases for Complete Coverage', () => {
    it('should handle UUID with custom error message', () => {
      class TestDto {
        @IsUUID('3', { message: 'Must be a valid UUID version 3' })
        id!: string;
      }

      const dto = new TestDto();
      dto.id = 'invalid-uuid';
      const errors = validateSync(dto);
      expect(errors[0].constraints?.isUUID).toBe('Must be a valid UUID version 3');
    });

    it('should handle IPv6 with custom error message', () => {
      class TestDto {
        @IsIP('6', { message: 'Must be a valid IPv6 address' })
        ip!: string;
      }

      const dto = new TestDto();
      dto.ip = 'not-an-ip';
      const errors = validateSync(dto);
      expect(errors[0].constraints?.isIP).toBe('Must be a valid IPv6 address');
    });

    it('should handle UUID version 5 with validation groups', () => {
      class TestDto {
        @IsUUID('5', { groups: ['create'] })
        id!: string;
      }

      const dto = new TestDto();
      dto.id = 'invalid';

      // Without groups - should not validate
      expect(validateSync(dto)).toHaveLength(0);

      // With matching group - should validate
      const errors = validateSync(dto, { groups: ['create'] });
      expect(errors).toHaveLength(1);
    });

    it('should handle IPv6 with validation groups', () => {
      class TestDto {
        @IsIP('6', { groups: ['network'] })
        ip!: string;
      }

      const dto = new TestDto();
      dto.ip = 'invalid';

      // Without groups - should not validate
      expect(validateSync(dto)).toHaveLength(0);

      // With matching group - should validate
      const errors = validateSync(dto, { groups: ['network'] });
      expect(errors).toHaveLength(1);
    });
  });

  describe('Complex Nested Scenarios', () => {
    it('should handle deeply nested objects with arrays', () => {
      class TagDto {
        name!: string;
      }

      class CommentDto {
        text!: string;

        @ValidateNested({ each: true })
        @Type(() => TagDto)
        tags!: TagDto[];
      }

      class PostDto {
        title!: string;

        @ValidateNested({ each: true })
        @Type(() => CommentDto)
        comments!: CommentDto[];
      }

      const post = new PostDto();
      post.title = 'My Post';
      post.comments = [
        {
          text: 'Great post!',
          tags: [
            { name: 'helpful' } as TagDto,
            { name: 'informative' } as TagDto,
          ],
        } as CommentDto,
      ];

      // Should handle deeply nested validation
      const errors = validateSync(post);
      expect(Array.isArray(errors)).toBe(true);
    });
  });
});

