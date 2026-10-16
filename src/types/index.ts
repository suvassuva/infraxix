// ==============================================================================
// PVG Ops - Core Domain Types & Service Interfaces
// Offline-first typed architecture
// ==============================================================================

export * from './gps';
export * from './mediaCapture';

export type RecordStatus = 'draft' | 'pending' | 'verified' | 'flagged' | 'rejected';
export type RecordPriority = 'low' | 'medium' | 'high' | 'urgent';
export type UploadState = 'idle' | 'uploading' | 'completed' | 'failed';

// Workspace Domain Models
export type WorkspaceCategory =
  | 'Private Office'
  | 'Meeting Room'
  | 'Dedicated Desk'
  | 'Coworking Floor'
  | 'Lab / Studio'
  | 'Executive Suite';

export type ListingType = 'rent' | 'sell' | 'buy';

export type PropertyCategory =
  | WorkspaceCategory
  | 'Commercial Office'
  | 'Apartment'
  | 'Villa / House'
  | 'Retail Shop'
  | 'Penthouse'
  | 'Land / Plot';

export interface WorkspaceSpecs {
  areaSqFt: number;
  floorNumber?: number;
  totalFloors?: number;
  rent?: number;
  deposit?: number;
  clearHeightFt?: number; // Clear ceiling height in ft
  beamHeightFt?: number;  // Clear height under structural beam in ft
  washrooms?: number;     // Number of washrooms
  powerBackup?: string;   // e.g., '100% DG Backup', 'Partial DG', 'UPS Only', 'None'
  parkingSpaces?: number; // Parking spaces/slots
  capacitySeats?: number;
  amenities?: string[];
  // Optional backward-compatibility fields
  bedrooms?: number;
  bathrooms?: number;
  furnishingStatus?: 'furnished' | 'semi-furnished' | 'unfurnished';
}

export type PropertySpecs = WorkspaceSpecs;

export interface PropertyPricing {
  price?: number;
  currency?: string;
  pricePeriod?: 'month' | 'total';
  securityDeposit?: number;
  negotiable?: boolean;
}

export type UserRole = 'officer' | 'supervisor' | 'admin';

export interface UserProfile {
  uid: string;
  displayName?: string;
  id?: string;
  name?: string;
  email: string;
  role: UserRole;
  facility?: string;
  department?: string;
  status: 'active' | 'suspended' | 'invited';
  createdAt?: string;
  lastActiveAt?: string;
  lastActive?: string;
  recordsCount?: number;
}

// Backward-compatibility alias
export type UserAccount = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'active' | 'suspended' | 'invited';
  lastActive: string;
  recordsCount: number;
  uid?: string;
  displayName?: string;
};

export interface CaptureLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt?: string;
  address?: string;
  elevationMeters?: number;
}

export interface MediaAsset {
  id: string;
  type: 'photo' | 'video' | 'pdf';
  fileName: string;
  fileSize: number; // in bytes
  fileSizeFormatted: string; // e.g. "3.4 MB"
  mimeType: string;
  uri?: string;
  uploadState: UploadState;
  errorMessage?: string;
  capturedAt: string;
  description?: string;
  resolution?: string;
  duration?: string;
  previewColor?: string;
  exif?: {
    camera: string;
    shutter: string;
    iso: string;
    focal: string;
  };
}

// Backward-compatibility alias for AttachmentItem
export interface AttachmentItem {
  id: string;
  name: string;
  size: string;
  type: string;
  mediaType: 'image' | 'video' | 'pdf';
  uri?: string;
  mimeType?: string;
  uploadState?: UploadState;
  status?: string;
  description?: string;
  resolution?: string;
  duration?: string;
  previewColor?: string;
  exif?: {
    camera: string;
    shutter: string;
    iso: string;
    focal: string;
  };
}

export interface RecordMetrics {
  complianceScore: number;
  itemsInspected: number;
  defectsFound: number;
}

export interface RecordTimelineEvent {
  id: string;
  timestamp: string;
  author: string;
  action: string;
  note?: string;
}

export interface CaptureRecord {
  id: string;
  referenceNumber: string;
  ownerUid: string; // demo owner UID
  capturedBy: {
    name: string;
    role: string;
    email: string;
  };
  title: string;
  category: string;
  facility: string;
  priority: RecordPriority;
  status: RecordStatus;
  notes: string;
  location?: CaptureLocation; // Optional location: may be undefined if GPS was skipped
  mediaReferences: MediaAsset[];
  attachments?: AttachmentItem[]; // optional for backward compatibility
  metrics: RecordMetrics;
  tags: string[];
  consentVersion: string;
  createdAt: string;
  updatedAt: string;
  capturedAt?: string;
  reviewedAt?: string;
  certifiedAt?: string;
  timeline: RecordTimelineEvent[];
  // Real Estate Extended Fields
  listingType?: ListingType;
  propertyCategory?: PropertyCategory;
  specs?: PropertySpecs;
  pricing?: PropertyPricing;
  verificationBadge?: string;
  doorstepCoordinates?: CaptureLocation;
  supervisorNote?: string;
  reviewerName?: string;
}

// Backward-compatibility alias
export type RecordItem = Partial<CaptureRecord> & {
  id: string;
  referenceNumber: string;
  title: string;
  category: string;
  facility: string;
  status: RecordStatus;
  priority: RecordPriority;
  notes: string;
  capturedBy: {
    name: string;
    role: string;
    email: string;
  };
  attachments: AttachmentItem[];
  metrics: RecordMetrics;
  tags: string[];
  timeline: RecordTimelineEvent[];
  location?: CaptureLocation;
  listingType?: ListingType;
  propertyCategory?: PropertyCategory;
  specs?: PropertySpecs;
  pricing?: PropertyPricing;
  verificationBadge?: string;
  doorstepCoordinates?: CaptureLocation;
};

export interface AppError {
  code:
    | 'VALIDATION_ERROR'
    | 'INVALID_COORDINATES'
    | 'INVALID_TITLE'
    | 'FILE_LIMIT_EXCEEDED'
    | 'NOT_FOUND'
    | 'UPLOAD_FAILED'
    | 'STORAGE_ERROR'
    | 'PERMISSION_DENIED';
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface RecordFilterOptions {
  searchTerm?: string;
  category?: string;
  status?: string;
  priority?: string;
  ownerUid?: string;
  sortBy?: 'newest' | 'oldest' | 'score' | 'title' | 'price_low' | 'price_high';
  page?: number;
  pageSize?: number;
  listingType?: ListingType | 'all';
  propertyCategory?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CreateRecordDTO {
  title: string;
  category?: string;
  facility?: string;
  priority?: RecordPriority;
  notes?: string;
  location?: CaptureLocation;
  mediaReferences?: MediaAsset[];
  metrics?: Partial<RecordMetrics>;
  itemsInspected?: number;
  defectsFound?: number;
  tags?: string[];
  consentVersion?: string;
  ownerUid?: string;
  authorName?: string;
  authorEmail?: string;
  authorRole?: string;
  // Real Estate Extensions
  listingType?: ListingType;
  propertyCategory?: PropertyCategory;
  specs?: Partial<PropertySpecs>;
  pricing?: Partial<PropertyPricing>;
  verificationBadge?: string;
  doorstepCoordinates?: CaptureLocation;
}

export interface UpdateRecordDTO {
  title?: string;
  notes?: string;
  category?: string;
  facility?: string;
  status?: RecordStatus;
  priority?: RecordPriority;
  metrics?: Partial<RecordMetrics>;
  tags?: string[];
  supervisorNote?: string;
  reviewerName?: string;
  // Real Estate Extensions
  listingType?: ListingType;
  propertyCategory?: PropertyCategory;
  specs?: Partial<PropertySpecs>;
  pricing?: Partial<PropertyPricing>;
  verificationBadge?: string;
  location?: Partial<CaptureLocation>;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'failure';
}

export interface QuickStats {
  totalRecords: number;
  pendingReview: number;
  approvedToday: number;
  flaggedItems: number;
  systemHealth: number;
}
