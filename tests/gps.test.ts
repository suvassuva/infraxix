import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { GeolocationService } from '@/services/geolocationService';
import { MockRecordRepository } from '@/repositories/MockRecordRepository';
import { GPS_VERIFICATION_DISCLAIMER } from '@/types';

describe('GPS Geolocation Service & Capture Layer Tests', () => {
  let service: GeolocationService;

  beforeEach(() => {
    service = new GeolocationService();
  });

  describe('validateGPSCoordinates', () => {
    it('should approve valid latitude -90..90 and longitude -180..180 with positive accuracy', () => {
      const validPoints = [
        { lat: 0, lng: 0, acc: 10 },
        { lat: 37.774929, lng: -122.419416, acc: 4.2 },
        { lat: 90, lng: 180, acc: 0 },
        { lat: -90, lng: -180, acc: 1.5 },
        { lat: -33.8688, lng: 151.2093, acc: 15.8 },
      ];

      for (const pt of validPoints) {
        const res = service.validateGPSCoordinates(pt.lat, pt.lng, pt.acc);
        assert.strictEqual(res.valid, true, `Point (${pt.lat}, ${pt.lng}) should be valid`);
        assert.strictEqual(res.error, undefined);
      }
    });

    it('should reject latitude strictly outside -90..90 degrees', () => {
      const invalidLats = [90.0001, -90.0001, 120, -100, NaN];

      for (const lat of invalidLats) {
        const res = service.validateGPSCoordinates(lat, 0, 5);
        assert.strictEqual(res.valid, false, `Latitude ${lat} should be rejected`);
        assert.strictEqual(res.error?.code, 'INVALID_COORDINATES');
      }
    });

    it('should reject longitude strictly outside -180..180 degrees', () => {
      const invalidLngs = [180.0001, -180.0001, 200, -181, NaN];

      for (const lng of invalidLngs) {
        const res = service.validateGPSCoordinates(0, lng, 5);
        assert.strictEqual(res.valid, false, `Longitude ${lng} should be rejected`);
        assert.strictEqual(res.error?.code, 'INVALID_COORDINATES');
      }
    });

    it('should reject negative accuracy in meters', () => {
      const res = service.validateGPSCoordinates(37.7749, -122.4194, -0.1);
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error?.code, 'INVALID_COORDINATES');
    });
  });

  describe('checkGeolocationSupport & Insecure Context Handling', () => {
    it('should reject non-browser environments when window is undefined', () => {
      const res = service.checkGeolocationSupport(undefined);
      assert.strictEqual(res.supported, false);
      assert.strictEqual(res.error?.code, 'UNSUPPORTED');
    });

    it('should detect and reject insecure context (HTTP / isSecureContext = false)', () => {
      const fakeWindow = {
        isSecureContext: false,
        navigator: {
          geolocation: {
            getCurrentPosition: () => {},
          },
        },
      } as unknown as Window;

      const res = service.checkGeolocationSupport(fakeWindow);
      assert.strictEqual(res.isSecure, false);
      assert.strictEqual(res.error?.code, 'INSECURE_CONTEXT');
      assert.ok(res.error?.message.includes('secure context'));
    });

    it('should detect unsupported browsers missing navigator.geolocation', () => {
      const fakeWindow = {
        isSecureContext: true,
        navigator: {},
      } as unknown as Window;

      const res = service.checkGeolocationSupport(fakeWindow);
      assert.strictEqual(res.supported, false);
      assert.strictEqual(res.error?.code, 'UNSUPPORTED');
    });

    it('should approve valid secure browser environment with geolocation API', () => {
      const fakeWindow = {
        isSecureContext: true,
        navigator: {
          geolocation: {
            getCurrentPosition: () => {},
          },
        },
      } as unknown as Window;

      const res = service.checkGeolocationSupport(fakeWindow);
      assert.strictEqual(res.supported, true);
      assert.strictEqual(res.isSecure, true);
      assert.strictEqual(res.error, undefined);
    });
  });

  describe('mapGeolocationError', () => {
    it('should map PERMISSION_DENIED (code 1)', () => {
      const err = { code: 1, message: 'User denied Geolocation' };
      const mapped = service.mapGeolocationError(err);
      assert.strictEqual(mapped.code, 'PERMISSION_DENIED');
      assert.ok(mapped.message.includes('denied'));
    });

    it('should map POSITION_UNAVAILABLE (code 2)', () => {
      const err = { code: 2, message: 'Position unavailable' };
      const mapped = service.mapGeolocationError(err);
      assert.strictEqual(mapped.code, 'POSITION_UNAVAILABLE');
      assert.ok(mapped.message.includes('unavailable'));
    });

    it('should map TIMEOUT (code 3)', () => {
      const err = { code: 3, message: 'Timed out' };
      const mapped = service.mapGeolocationError(err);
      assert.strictEqual(mapped.code, 'TIMEOUT');
      assert.ok(mapped.message.includes('timed out'));
    });

    it('should map insecure context error messages', () => {
      const err = new Error('Only secure origins are allowed');
      const mapped = service.mapGeolocationError(err);
      assert.strictEqual(mapped.code, 'INSECURE_CONTEXT');
    });

    it('should map unknown unexpected errors gracefully', () => {
      const err = new Error('Device sensor failure');
      const mapped = service.mapGeolocationError(err);
      assert.strictEqual(mapped.code, 'UNKNOWN_ERROR');
      assert.strictEqual(mapped.message, 'Device sensor failure');
    });
  });

  describe('captureCurrentPosition single-shot and verification policy', () => {
    it('should query position once via getCurrentPosition, never call watchPosition', async () => {
      let getCurrentPositionCalled = 0;
      let watchPositionCalled = 0;

      const mockTimestamp = 1776100000000;
      const fakeWindow = {
        isSecureContext: true,
        navigator: {
          geolocation: {
            getCurrentPosition: (success: PositionCallback) => {
              getCurrentPositionCalled += 1;
              const fakePosition = {
                coords: {
                  latitude: 37.774929,
                  longitude: -122.419416,
                  accuracy: 5.4,
                  altitude: 22.0,
                  altitudeAccuracy: 1.0,
                  heading: null,
                  speed: null,
                },
                timestamp: mockTimestamp,
              } as unknown as GeolocationPosition;
              success(fakePosition);
            },
            watchPosition: () => {
              watchPositionCalled += 1;
              return 1;
            },
          },
        },
      } as unknown as Window;

      const captured = await service.captureCurrentPosition({}, fakeWindow);

      // Verify single-shot execution
      assert.strictEqual(getCurrentPositionCalled, 1);
      assert.strictEqual(watchPositionCalled, 0, 'Must NOT track in background or invoke watchPosition');

      // Verify accuracy, coordinates, and timestamp
      assert.strictEqual(captured.latitude, 37.774929);
      assert.strictEqual(captured.longitude, -122.419416);
      assert.strictEqual(captured.accuracyMeters, 5.4);
      assert.strictEqual(captured.timestamp, mockTimestamp);
      assert.strictEqual(captured.capturedAt, new Date(mockTimestamp).toISOString());

      // Verify verification policy disclaimer
      assert.strictEqual(
        captured.isIndependentlyVerified,
        false,
        'Coordinates must not claim to be independently verified'
      );
      assert.strictEqual(captured.verificationDisclaimer, GPS_VERIFICATION_DISCLAIMER);
    });

    it('should reject when browser returns invalid out-of-bounds coordinates', async () => {
      const fakeWindow = {
        isSecureContext: true,
        navigator: {
          geolocation: {
            getCurrentPosition: (success: PositionCallback) => {
              const fakePosition = {
                coords: {
                  latitude: 99.9999, // Out of bounds!
                  longitude: 10.0,
                  accuracy: 5.0,
                },
                timestamp: Date.now(),
              } as unknown as GeolocationPosition;
              success(fakePosition);
            },
          },
        },
      } as unknown as Window;

      await assert.rejects(
        async () => {
          await service.captureCurrentPosition({}, fakeWindow);
        },
        {
          code: 'INVALID_COORDINATES',
        }
      );
    });

    it('should reject when geolocation permission is denied by user', async () => {
      const fakeWindow = {
        isSecureContext: true,
        navigator: {
          geolocation: {
            getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => {
              const fakeErr = {
                code: 1, // PERMISSION_DENIED
                message: 'User denied Geolocation',
                PERMISSION_DENIED: 1,
                POSITION_UNAVAILABLE: 2,
                TIMEOUT: 3,
              } as GeolocationPositionError;
              error(fakeErr);
            },
          },
        },
      } as unknown as Window;

      await assert.rejects(
        async () => {
          await service.captureCurrentPosition({}, fakeWindow);
        },
        {
          code: 'PERMISSION_DENIED',
        }
      );
    });
  });

  describe('Mock Repository Integration with Confirmed GPS Data', () => {
    it('should save confirmed captured GPS data into a mock record without backend', async () => {
      const repo = new MockRecordRepository([]);

      const confirmedGps = {
        latitude: 37.774929,
        longitude: -122.419416,
        accuracyMeters: 4.8,
        capturedAt: '2026-10-13T10:00:00.000Z',
        address: 'Browser Geolocation Fix (±5m)',
        elevationMeters: 18,
      };

      const created = await repo.createRecord({
        title: 'Emergency Generator GPS Inspection',
        category: 'Equipment Safety',
        facility: 'Central Logistics Hub A',
        priority: 'high',
        notes: 'GPS telemetry captured at generator pad.',
        location: confirmedGps,
      });

      assert.ok(created.id);
      assert.ok(created.location);
      assert.strictEqual(created.location?.latitude, 37.774929);
      assert.strictEqual(created.location?.longitude, -122.419416);
      assert.strictEqual(created.location?.accuracyMeters, 4.8);
      assert.strictEqual(created.location?.capturedAt, '2026-10-13T10:00:00.000Z');

      // Verify retrieval from local repository
      const fetched = await repo.getRecord(created.id);
      assert.ok(fetched);
      assert.strictEqual(fetched?.location?.latitude, 37.774929);
      assert.strictEqual(fetched?.location?.longitude, -122.419416);
      assert.strictEqual(fetched?.location?.accuracyMeters, 4.8);
    });
  });
});
