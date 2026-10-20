import { CaptureRecord } from '@/types';

/**
 * Escapes a cell value for safe RFC 4180 compliant CSV export.
 */
function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }
  const str = String(val);
  // If the cell contains comma, double-quote, or newline, escape quotes and wrap in quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates an Excel-ready UTF-8 CSV string from a list of CaptureRecords.
 */
export function generateRecordsCsv(records: CaptureRecord[]): string {
  const headers = [
    'Reference ID',
    'Title',
    'Category',
    'Listing Type',
    'Status',
    'Priority',
    'Facility / Building',
    'Price / Rent',
    'Security Deposit',
    'Area (Sq Ft)',
    'Capacity (Seats)',
    'Floor Number',
    'Total Floors',
    'Clear Height (Ft)',
    'Beam Height (Ft)',
    'Power Backup',
    'Washrooms',
    'Parking Spaces',
    'Contact Phone',
    'Address',
    'Latitude',
    'Longitude',
    'Location Link',
    'Field Officer Name',
    'Field Officer Email',
    'Field Officer Role',
    'Created At',
    'Last Updated',
    'Reviewer Name',
    'Supervisor Note',
    'Media Count',
    'Notes / Description',
  ];

  const rows = records.map((record) => {
    const specs = record.specs;
    const pricing = record.pricing;
    const location = record.location || record.doorstepCoordinates;
    const capturedBy = record.capturedBy;
    const mediaCount = (record.mediaReferences?.length || 0) + (record.attachments?.length || 0);

    const price = specs?.rent ?? pricing?.price ?? '';
    const deposit = specs?.deposit ?? pricing?.securityDeposit ?? '';

    return [
      record.referenceNumber || record.id || '',
      record.title || '',
      record.propertyCategory || record.category || '',
      record.listingType || '',
      record.status || '',
      record.priority || '',
      record.facility || '',
      price,
      deposit,
      specs?.areaSqFt ?? '',
      specs?.capacitySeats ?? '',
      specs?.floorNumber ?? '',
      specs?.totalFloors ?? '',
      specs?.clearHeightFt ?? '',
      specs?.beamHeightFt ?? '',
      specs?.powerBackup ?? '',
      specs?.washrooms ?? '',
      specs?.parkingSpaces ?? '',
      record.mobileNumber || specs?.mobileNumber || '',
      location?.address || '',
      location?.latitude ?? '',
      location?.longitude ?? '',
      record.locationLink || specs?.locationLink || '',
      capturedBy?.name || '',
      capturedBy?.email || '',
      capturedBy?.role || '',
      record.createdAt || '',
      record.updatedAt || '',
      record.reviewerName || '',
      record.supervisorNote || '',
      mediaCount,
      record.notes || '',
    ]
      .map(escapeCsvValue)
      .join(',');
  });

  // \uFEFF is the UTF-8 Byte Order Mark (BOM).
  // This informs Microsoft Excel to interpret characters correctly as UTF-8.
  return '\uFEFF' + [headers.map(escapeCsvValue).join(','), ...rows].join('\r\n');
}

/**
 * Triggers a browser download of the CSV ledger file.
 */
export function downloadRecordsCsv(records: CaptureRecord[], filename?: string): void {
  const csvContent = generateRecordsCsv(records);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = filename || `infraxix_audit_ledger_${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
