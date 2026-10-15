# PVG Ops — Precision Field Verification & Inspection Platform

A high-performance, accessible, and responsive frontend foundation designed for frontline inspectors, safety supervisors, and compliance administrators.

> **Phase 1 Architecture:** Built following a **FRONTEND-FIRST** workflow. This build is completely isolated from cloud storage, Firebase, external REST APIs, and databases. Hardware sensors (camera, GPS) are never requested automatically.

---

## 🚀 Key Features & Highlights

- **Next.js App Router (16.x) & React 19:** Utilizing modern server/client components with strict TypeScript.
- **Design System Tokens:**
  - **Surfaces:** Clean white (`#ffffff`) and soft slate (`#f8fafc`) surfaces.
  - **Actions:** High-contrast primary blue (`#2563eb` / `#1d4ed8`).
  - **Borders & Dividers:** Accessible neutral borders (`#e2e8f0` / `#cbd5e1`).
  - **Typography & Accessibility:** WCAG AA contrast, focus rings, keyboard navigability (ESC key dialog dismissal).
- **Zero Unsolicited Hardware Access:**
  - Simulated optical camera feed toggle on demand with preview still capture.
  - Manual simulated GPS coordinate tagging (Bay Area logistics sites).
  - Explicit user actions only—no automatic browser permission prompts on page load.
- **Demo-Ready In-Memory State:** Comprehensive mock inspection records, officer profiles, and audit log entries.

---

## 🗺️ Route Directory

| Route | Name | Description |
|---|---|---|
| `/` | Platform Home | Public landing, architecture summary, and live UI Kit sandbox |
| `/login` | Authentication | Field sign-in card with one-click officer/supervisor/admin presets |
| `/dashboard` | Operations Command | KPI metrics cards, facility compliance gauges, and live inspection queue |
| `/capture` | Field Station | Manual inspection entry, simulated camera viewfinder, and simulated GPS |
| `/records` | Records Ledger | Searchable, filterable repository with Table and Grid views |
| `/records/[id]` | Record Details | Dynamic audit trail, inspector details, and supervisor sign-off modals |
| `/settings` | System Settings | Profile settings, hardware safety enforcement, and cache purging |
| `/admin` | Administration | User roster management, audit logs, and account provisioning modal |
| `/privacy` | Privacy & Compliance | Formal charter detailing zero unsolicited tracking and data boundaries |

---

## 🧩 UI Component Architecture (`src/components/ui`)

- **`Button`**: Variants (`primary`, `secondary`, `outline`, `ghost`, `danger`), sizes (`sm`, `md`, `lg`), loading spinner states, icon slots.
- **`Card`**: Structured cards (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`).
- **`Badge`**: Status indicators (`success`, `warning`, `error`, `info`, `neutral`, `pending`) with optional animated dots.
- **`Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`**: Styled form controls with accessible labels, helper texts, and error feedback.
- **`Dialog`**: Accessible modal dialog with backdrop blur, focus trap, and keyboard `ESC` dismissal.
- **`Feedback`**: `Spinner`, `Skeleton`, `SkeletonCard`, `EmptyState`, and `ErrorState` components.

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Type Checking & Production Build
```bash
# Type check and build bundle
npm run build

# Run linting
npm run lint
```
