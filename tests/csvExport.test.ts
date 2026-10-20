import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateRecordsCsv } from '../src/utils/csvExport';
import { CaptureRecord } from '../src/types';

describe('generateRecordsCsv Unit Tests', () => {
  it('should include UTF-8 BOM and correct header line', () => {
    const csv = generateRecordsCsv([]);
    assert.ok(csv.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM for Microsoft Excel');
    assert.ok(csv.includes('Reference ID,Title,Category,Listing Type,Status,Priority'));
  });

  it('should properly format records and escape commas and quotes', () => {
    const mockRecord: CaptureRecord = {
      id: 'rec-123',
      referenceNumber: 'INF-2026-999',
      ownerUid: 'uid-1',
      title: 'Grand "Tower" Hub, Suite A',
      category: 'Coworking Floor',
      propertyCategory: 'Coworking Floor',
      listingType: 'rent',
      facility: 'Tower One, MG Road',
      priority: 'high',
      status: 'verified',
      notes: 'Line 1\nLine 2 with "quotes" and, commas',
      capturedBy: {
        name: 'Officer John Doe',
        email: 'john@infraxix.com',
        role: 'officer',
      },
      specs: {
        areaSqFt: 4500,
        rent: 125000,
        deposit: 250000,
        capacitySeats: 60,
        floorNumber: 4,
        totalFloors: 10,
        clearHeightFt: 12,
        beamHeightFt: 10,
        powerBackup: '100% DG Backup',
        washrooms: 4,
        parkingSpaces: 6,
        mobileNumber: '+91 9876543210',
      },
      location: {
        latitude: 12.9716,
        longitude: 77.5946,
        accuracyMeters: 5,
        address: 'MG Road, Bengaluru, Karnataka',
      },
      mediaReferences: [
        {
          id: 'm1',
          fileName: 'photo.jpg',
          fileSize: 1024,
          fileSizeFormatted: '1 MB',
          mimeType: 'image/jpeg',
          uploadState: 'completed',
          capturedAt: '2026-10-20T10:00:00Z',
          type: 'photo',
        },
      ],
      metrics: { complianceScore: 98, itemsInspected: 10, defectsFound: 0 },
      tags: ['workspace'],
      consentVersion: '1.0',
      createdAt: '2026-10-20T10:00:00Z',
      updatedAt: '2026-10-20T10:30:00Z',
      reviewerName: 'Admin Sarah',
      supervisorNote: 'All documentation verified',
      timeline: [],
    };

    const csv = generateRecordsCsv([mockRecord]);
    
    // Check that quotes and commas are escaped RFC 4180 style
    assert.ok(csv.includes('"Grand ""Tower"" Hub, Suite A"'));
    assert.ok(csv.includes('"Line 1\nLine 2 with ""quotes"" and, commas"'));
    assert.ok(csv.includes('INF-2026-999'));
    assert.ok(csv.includes('125000'));
    assert.ok(csv.includes('4500'));
    assert.ok(csv.includes('+91 9876543210'));
    assert.ok(csv.includes('Officer John Doe'));
    assert.ok(csv.includes('Admin Sarah'));
  });
});
