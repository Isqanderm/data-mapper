/**
 * Tests for medium priority validators - Network, Localization, Formats
 */

import { describe, it, expect } from 'vitest';
import {
  IsMagnetURI,
  IsDataURI,
  IsISO31661Alpha2,
  IsISO31661Alpha3,
  IsLocale,
  IsSemVer,
  IsMimeType,
  IsTimeZone,
  IsRFC3339,
  validate,
  validateSync,
} from '../../../../src/compat/class-validator';

describe('class-validator-compat - Medium Priority Validators (Network & Formats)', () => {
  // ============================================================================
  // Network & URI
  // ============================================================================

  describe('@IsMagnetURI', () => {
    it('should validate valid Magnet URI', async () => {
      class TorrentDto {
        @IsMagnetURI()
        magnetLink!: string;
      }

      const valid = new TorrentDto();
      valid.magnetLink =
        'magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid Magnet URI', async () => {
      class TorrentDto {
        @IsMagnetURI()
        magnetLink!: string;
      }

      const invalid = new TorrentDto();
      invalid.magnetLink = 'not-a-magnet-link';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('magnetLink');
      expect(errors[0].constraints).toHaveProperty('isMagnetURI');
    });
  });

  describe('@IsDataURI', () => {
    it('should validate valid Data URI', async () => {
      class ImageDto {
        @IsDataURI()
        dataUri!: string;
      }

      const valid = new ImageDto();
      valid.dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate Data URI without MIME type', async () => {
      class ImageDto {
        @IsDataURI()
        dataUri!: string;
      }

      const valid = new ImageDto();
      valid.dataUri = 'data:;base64,SGVsbG8sIFdvcmxkIQ==';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid Data URI', async () => {
      class ImageDto {
        @IsDataURI()
        dataUri!: string;
      }

      const invalid = new ImageDto();
      invalid.dataUri = 'not-a-data-uri';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('dataUri');
      expect(errors[0].constraints).toHaveProperty('isDataURI');
    });
  });

  // ============================================================================
  // Localization
  // ============================================================================

  describe('@IsISO31661Alpha2', () => {
    it('should validate valid alpha-2 country codes', async () => {
      class AddressDto {
        @IsISO31661Alpha2()
        countryCode!: string;
      }

      const valid = new AddressDto();
      valid.countryCode = 'US';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid alpha-2 code', async () => {
      class AddressDto {
        @IsISO31661Alpha2()
        countryCode!: string;
      }

      const invalid = new AddressDto();
      invalid.countryCode = 'USA';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('countryCode');
      expect(errors[0].constraints).toHaveProperty('isISO31661Alpha2');
    });
  });

  describe('@IsISO31661Alpha3', () => {
    it('should validate valid alpha-3 country codes', async () => {
      class AddressDto {
        @IsISO31661Alpha3()
        countryCode!: string;
      }

      const valid = new AddressDto();
      valid.countryCode = 'USA';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid alpha-3 code', async () => {
      class AddressDto {
        @IsISO31661Alpha3()
        countryCode!: string;
      }

      const invalid = new AddressDto();
      invalid.countryCode = 'US';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('countryCode');
      expect(errors[0].constraints).toHaveProperty('isISO31661Alpha3');
    });
  });

  describe('@IsLocale', () => {
    it('should validate valid locale', async () => {
      class UserDto {
        @IsLocale()
        locale!: string;
      }

      const valid = new UserDto();
      valid.locale = 'en-US';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate locale without region', async () => {
      class UserDto {
        @IsLocale()
        locale!: string;
      }

      const valid = new UserDto();
      valid.locale = 'en';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid locale', async () => {
      class UserDto {
        @IsLocale()
        locale!: string;
      }

      const invalid = new UserDto();
      invalid.locale = 'invalid';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('locale');
      expect(errors[0].constraints).toHaveProperty('isLocale');
    });
  });

  // ============================================================================
  // Formats & Standards
  // ============================================================================

  describe('@IsSemVer', () => {
    it('should validate valid semantic version', async () => {
      class PackageDto {
        @IsSemVer()
        version!: string;
      }

      const valid = new PackageDto();
      valid.version = '1.2.3';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate semver with prerelease', async () => {
      class PackageDto {
        @IsSemVer()
        version!: string;
      }

      const valid = new PackageDto();
      valid.version = '2.0.0-beta.1';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid semver', async () => {
      class PackageDto {
        @IsSemVer()
        version!: string;
      }

      const invalid = new PackageDto();
      invalid.version = '1.2';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('version');
      expect(errors[0].constraints).toHaveProperty('isSemVer');
    });
  });

  describe('@IsMimeType', () => {
    it('should validate valid MIME type', async () => {
      class FileDto {
        @IsMimeType()
        contentType!: string;
      }

      const valid = new FileDto();
      valid.contentType = 'text/html';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate complex MIME type', async () => {
      class FileDto {
        @IsMimeType()
        contentType!: string;
      }

      const valid = new FileDto();
      valid.contentType = 'application/vnd.ms-excel';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid MIME type', async () => {
      class FileDto {
        @IsMimeType()
        contentType!: string;
      }

      const invalid = new FileDto();
      invalid.contentType = 'invalid';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('contentType');
      expect(errors[0].constraints).toHaveProperty('isMimeType');
    });
  });

  describe('@IsTimeZone', () => {
    it('should validate valid timezone', async () => {
      class EventDto {
        @IsTimeZone()
        timezone!: string;
      }

      const valid = new EventDto();
      valid.timezone = 'America/New_York';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate European timezone', async () => {
      class EventDto {
        @IsTimeZone()
        timezone!: string;
      }

      const valid = new EventDto();
      valid.timezone = 'Europe/Moscow';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid timezone', async () => {
      class EventDto {
        @IsTimeZone()
        timezone!: string;
      }

      const invalid = new EventDto();
      invalid.timezone = 'not-a-timezone';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('timezone');
      expect(errors[0].constraints).toHaveProperty('isTimeZone');
    });
  });

  describe('@IsRFC3339', () => {
    it('should validate valid RFC 3339 date', async () => {
      class EventDto {
        @IsRFC3339()
        timestamp!: string;
      }

      const valid = new EventDto();
      valid.timestamp = '2024-01-15T10:30:00Z';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate RFC 3339 with timezone offset', async () => {
      class EventDto {
        @IsRFC3339()
        timestamp!: string;
      }

      const valid = new EventDto();
      valid.timestamp = '2024-01-15T10:30:00+03:00';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid RFC 3339 date', async () => {
      class EventDto {
        @IsRFC3339()
        timestamp!: string;
      }

      const invalid = new EventDto();
      invalid.timestamp = '2024-01-15';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('timestamp');
      expect(errors[0].constraints).toHaveProperty('isRFC3339');
    });
  });

  describe('Sync validation', () => {
    it('should work with validateSync', () => {
      class TestDto {
        @IsSemVer()
        version!: string;

        @IsLocale()
        locale!: string;
      }

      const valid = new TestDto();
      valid.version = '1.2.3';
      valid.locale = 'en-US';

      const errors = validateSync(valid);
      expect(errors).toHaveLength(0);
    });
  });
});
