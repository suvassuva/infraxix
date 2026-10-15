# PVG Ops — Firebase Architecture & Setup Guide

This guide details the integration architecture, security rules, environment configuration, and operational guidelines for transitioning **PVG Ops** from default local mock repositories to **Google Firebase** (Firebase Authentication, Cloud Firestore, and Cloud Storage).

---

## 1. Architectural Overview

PVG Ops implements a strict **Repository Pattern & Dependency Injection** architecture. The frontend components and React hooks never bind directly to backend databases, SDKs, or hardcoded fixtures:

```
┌────────────────────────────────────────────────────────┐
│             UI / Presentation Layer                    │
│    (CapturePage, Dashboard, Ledger, Admin, Login)      │
└──────────────────────────┬─────────────────────────────┘
                           │ Consumes typed hooks
                           ▼
┌────────────────────────────────────────────────────────┐
│                 React Hooks Layer                      │
│     (useAuth, useRecords, useGPSCapture, useMedia)     │
└──────────────────────────┬─────────────────────────────┘
                           │ Delegates via interfaces
                           ▼
┌────────────────────────────────────────────────────────┐
│              Repository Contracts                      │
│   (IAuthRepository, IRecordRepository, IMediaRepository)│
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌──────────────────────────┐┌──────────────────────────┐
│  Mock Implementations    ││  Firebase Adapters       │
│  (DEFAULT / ACTIVE)      ││  (OPTIONAL / READY)      │
│  - MockAuthRepository    ││  - FirebaseAuthRepository │
│  - MockRecordRepository  ││  - FirestoreRecordRepo   │
│  - MockMediaRepository   ││  - FirebaseStorageMedia   │
│  Zero network calls      ││  Compiles without keys   │
└──────────────────────────┘└──────────────────────────┘
```

### Safety & Default Mode
- **Default Mode:** `NEXT_PUBLIC_DATA_SOURCE="mock"`
- In default mode, Firebase SDK is **never initialized** and **zero network calls** are transmitted.
- All session profiles in mock mode are explicitly tagged with `isMock: true` and display visual watermarks in the UI to prevent demo data from being mistaken for production.

---

## 2. Step-by-Step Firebase Provisioning

### Step 1: Create Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it `pvg-ops-production` (or your preferred project ID).
3. Disable Google Analytics unless required, then click **Create Project**.

### Step 2: Register Web Application
1. In the Project Overview page, click the **Web icon (`</>`)** to add a web application.
2. Enter an app nickname (e.g. `pvg-ops-web`).
3. Note the configuration object containing `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, and `appId`.

### Step 3: Enable Authentication
1. In the left navigation, open **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, enable **Email/Password**.
4. (Optional) In production, configure Custom Claims (`role: 'officer' | 'supervisor' | 'admin'`) via Firebase Admin SDK or Cloud Functions.

### Step 4: Create Cloud Firestore Database
1. Open **Build > Firestore Database** and click **Create Database**.
2. Select **Start in production mode** (all reads and writes denied by default).
3. Select a cloud region close to your field operations (e.g., `us-central1` or `asia-south1`).

### Step 5: Enable Cloud Storage
1. Open **Build > Storage** and click **Get Started**.
2. Select **Start in production mode**.
3. Choose the default Cloud Storage bucket location.

---

## 3. Production Security Rules

### 3.1 Cloud Firestore Rules (`firestore.rules`)
Deploy these rules to ensure role-based access control and payload validation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserRole() {
      return request.auth.token.role != null ? request.auth.token.role : 'officer';
    }

    function isOfficer() {
      return isAuthenticated() && (getUserRole() == 'officer' || getUserRole() == 'supervisor' || getUserRole() == 'admin');
    }

    function isSupervisor() {
      return isAuthenticated() && (getUserRole() == 'supervisor' || getUserRole() == 'admin');
    }

    function isAdmin() {
      return isAuthenticated() && getUserRole() == 'admin';
    }

    // Records Collection
    match /records/{recordId} {
      // Any authenticated personnel can read records
      allow read: if isAuthenticated();

      // Field officers can create new inspection records
      allow create: if isOfficer()
        && request.resource.data.title.size() >= 3
        && request.resource.data.title.size() <= 120
        && request.resource.data.status in ['draft', 'pending']
        && (request.resource.data.location == null || (
             request.resource.data.location.latitude >= -90.0 &&
             request.resource.data.location.latitude <= 90.0 &&
             request.resource.data.location.longitude >= -180.0 &&
             request.resource.data.location.longitude <= 180.0
           ));

      // Supervisors & Admins can update status (verify, flag, reject)
      // Officers can only update their own draft records
      allow update: if isSupervisor() || (
        isOfficer() &&
        resource.data.capturedBy.email == request.auth.token.email &&
        resource.data.status in ['draft', 'pending']
      );

      // Only Admins can permanently delete records
      allow delete: if isAdmin();
    }

    // Audit Logs Collection (Immutable write-only ledger)
    match /auditLogs/{logId} {
      allow read: if isSupervisor();
      allow create: if isAuthenticated();
      allow update, delete: if false; // Append-only audit integrity
    }
  }
}
```

### 3.2 Cloud Storage Rules (`storage.rules`)
Deploy these rules to enforce file size limits, content types, and authenticated uploads:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isUnderMaxSize() {
      // 50 MB limit enforced at storage edge
      return request.resource.size < 50 * 1024 * 1024;
    }

    function isValidMediaType() {
      return request.resource.contentType.matches('image/.*')
          || request.resource.contentType.matches('video/.*');
    }

    match /media/{recordId}/{fileName} {
      // Public or authenticated read based on operational policy
      allow read: if isAuthenticated();

      // Authenticated personnel can upload valid media within limits
      allow create: if isAuthenticated()
                   && isUnderMaxSize()
                   && isValidMediaType();

      // Only admins can delete raw media assets
      allow delete: if request.auth.token.role == 'admin';
    }
  }
}
```

---

## 4. Firestore Composite Indexes

For efficient sorting and multi-field queries, deploy `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "records",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "records",
      "queryScope": "COLENDING",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "records",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "priority", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## 5. Environment Variables & Activation

### 5.1 Local Configuration
Create `.env.local` by copying `.env.example`:

```bash
cp .env.example .env.local
```

### 5.2 Connecting Firebase
To activate Firebase, modify `.env.local`:

```env
# Switch data source to firebase
NEXT_PUBLIC_DATA_SOURCE="firebase"
NEXT_PUBLIC_DEMO_MODE=false

# Client SDK Credentials (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyA..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="pvg-ops.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="pvg-ops"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="pvg-ops.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:abcdef123456"
```

If any variable is empty, malformed, or if `NEXT_PUBLIC_DATA_SOURCE` is omitted, the application **automatically falls back to Mock Mode** with a console warning.

---

## 6. Critical Security & Credential Safeguards

> [!CAUTION]
> **NEVER COMMIT SERVICE-ACCOUNT KEYS OR SECRETS**
> 1. Private keys from Google Cloud Console (`service-account.json`, `private_key`) grant full administrative bypass privileges to your cloud infrastructure.
> 2. Client configuration (`NEXT_PUBLIC_FIREBASE_*`) is visible in the client browser bundle and is protected by **Security Rules**, NOT by secrecy.
> 3. `.gitignore` is configured to automatically reject:
>    - `*serviceAccount*.json`
>    - `*service-account*.json`
>    - `firebase-adminsdk*.json`
>    - `*.key` / `*.cert` / `.env*.local`

---

## 7. Firebase Readiness Status Matrix

| Component | Repository Contract | Mock Implementation | Firebase Adapter | Ready for Live Connection? |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | `IAuthRepository` | `MockAuthRepository` (active) | `FirebaseAuthRepository` | **READY** (Requires env credentials) |
| **Records Ledger** | `IRecordRepository` | `MockRecordRepository` (active) | `FirestoreRecordRepository` | **READY** (Requires Firestore provision) |
| **Media & Storage** | `IMediaRepository` | `MockMediaRepository` (active) | `FirebaseStorageMediaRepository` | **READY** (Requires Storage provision) |
| **GPS Telemetry** | Typed Service | In-memory validated fix | Persists coordinates to record | **READY** (Hardware browser API) |
| **Sensor Capture** | Typed Service | Canvas / MediaRecorder | Blob upload via `IMediaRepository` | **READY** (Hardware browser API) |
| **Security Rules** | Documented | N/A | Defined in `docs/FIREBASE_SETUP.md` | **READY** (Ready to deploy via CLI) |
| **Admin Claims** | Type definitions | Static role selector | Cloud Function claim trigger needed | **PENDING** (Cloud Function setup) |
