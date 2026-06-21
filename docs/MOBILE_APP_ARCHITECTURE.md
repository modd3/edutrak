# EduTrak Mobile App — Technical Architecture Document

> **Version:** 1.0
> **Scope:** Full-stack mobile architecture for EduTrak School Management System
> **Target:** Expo (React Native) with offline-first, scaling to 10,000+ concurrent users

---

## 1. Executive Summary

This document defines a **production-grade, industry-scale architecture** for converting EduTrak from a web SPA to a cross-platform mobile app with **offline-first** capabilities. The architecture is designed to support **thousands of schools (tenants)**, each with **hundreds of concurrent users** (teachers, admins, parents), while maintaining data integrity both online and offline.

**Key design goals:**

- Support 10,000+ concurrent mobile users per API cluster
- Full offline capabilities for rural Kenyan schools with intermittent internet
- < 2-second screen loads even on low-end Android devices (2GB RAM)
- Data sync within 5 seconds of reconnecting to internet
- Incremental rollout — existing web app continues working during migration

---

## 2. Does Expo Scale? — Industry Evidence

### 2.1 Production Users of Expo / React Native at Scale

| Company | Users | App Type | Expo / RN |
|---|---|---|---|
| **Discord** | 150M+ | Social chat | Expo SDK 50+ |
| **Shopify** | Millions of merchants | Point of Sale | React Native |
| **Walmart** | 100M+ monthly visits | Retail | React Native |
| **Tesla** | 5M+ vehicle owners | Car control | React Native |
| **Meta (Facebook)** | Billions | Ads Manager | React Native |
| **Airbnb** | 500M+ bookings | Travel (migrated from RN → native, then back) | React Native |
| **Uber Eats** | 80M+ | Food delivery | Expo (for dashboard) |
| **Microsoft** | Enterprise | Office Mobile | React Native |

**The bottleneck is never the mobile framework — it is always the backend architecture, database, and sync strategy.** Expo handles the UI layer; the backend (your existing Express + Prisma + PostgreSQL) and the sync engine determine scale.

### 2.2 Expo-Specific Scaling Strengths

| Capability | How Expo Handles It |
|---|---|
| OTA Updates | Push JS bundle updates instantly — no app store review cycle |
| Build Pipeline | EAS Build compiles in cloud — no local Xcode/Android Studio needed |
| App Size | Optimized tree-shaking — ~15MB APK; ~25MB IPA |
| Performance | Hermes engine for low-RAM devices; 60fps UI |
| Caching | Native image caching, network caching, SQLite persistence |
| Push Notifications | Expo Notifications — handles millions of push tokens |
| Bundle Delivery | EAS Update with CDN — instant delivery across regions |

---

## 3. High-Level Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                        MOBILE APP (Expo)                         │
│                                                                   │
│  ┌─────────────────────┐  ┌────────────────────────────────┐    │
│  │     UI Layer         │  │     State & Sync Layer         │    │
│  │  ┌─────────────────┐ │  │  ┌──────────────────────────┐ │    │
│  │  │ Screens          │ │  │  │ Zustand (Global State)   │ │    │
│  │  │ ─ Dashboard      │ │  │  │ Auth store, UI state     │ │    │
│  │  │ ─ Students       │ │  │  └──────────────────────────┘ │    │
│  │  │ ─ Assessments    │ │  │  ┌──────────────────────────┐ │    │
│  │  │ ─ Fees           │ │  │  │ TanStack Query (Caching) │ │    │
│  │  │ ─ Reports        │ │  │  │ API response cache       │ │    │
│  │  │ ─ Attendance     │ │  │  └──────────────────────────┘ │    │
│  │  └─────────────────┘ │  │  ┌──────────────────────────┐ │    │
│  │  ┌─────────────────┐ │  │  │ WatermelonDB (Offline)   │ │    │
│  │  │ Shared Components│ │  │  │ Local SQLite database    │ │    │
│  │  │ ─ DataTable      │ │  │  │ Record-level sync       │ │    │
│  │  │ ─ Forms          │ │  │  └──────────────────────────┘ │    │
│  │  │ ─ Charts         │ │  │  ┌──────────────────────────┐ │    │
│  │  │ ─ Print          │ │  │  │ Sync Engine              │ │    │
│  │  └─────────────────┘ │  │  │ Queue + conflict resolver │ │    │
│  └─────────────────────┘  │  └──────────────────────────┘ │    │
│                            └────────────────────────────────┘    │
└──────────────────────┬───────────────────────────────────────────┘
                       │ HTTPS + WSS + GraphQL
                       │
┌──────────────────────▼───────────────────────────────────────────┐
│                    BACKEND API CLUSTER                            │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Load        │  │  Express     │  │  Prisma ORM          │   │
│  │  Balancer    │◄─┤  API Nodes   │◄─┤  (PostgreSQL)        │   │
│  │  (Nginx/     │  │  (×3-5)     │  │  Connection Pooling  │   │
│  │   DigitalOcean)│  └──────────────┘  └──────────────────────┘   │
│  └──────────────┘  ┌──────────────┐  ┌──────────────────────┐   │
│                     │  Socket.io   │  │  Redis + BullMQ      │   │
│                     │  (Real-time) │  │  Queue & Cache       │   │
│                     └──────────────┘  └──────────────────────┘   │
│                     ┌───────────────────────────────────────┐   │
│                     │  Sync API Endpoints                    │   │
│                     │  ─ POST /sync/push (client changes)   │   │
│                     │  ─ GET  /sync/pull (server changes)   │   │
│                     │  ─ POST /sync/conflict (resolve)      │   │
│                     └───────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Offline-First Data Layer (Deep Dive)

### 4.1 Data Classification Matrix

| Category | Examples | Must Work Offline? | Sync Direction | Conflict Strategy |
|---|---|---|---|---|
| **Critical** | Student records, teacher records, class lists | ✅ Yes | Bidirectional | Last-Write-Wins (LWW) |
| **Transactional** | Assessment scores, attendance, fee records | ✅ Yes | Client → Server | Queue & Retry |
| **Reference** | Subjects, academic years, grade scales | ✅ Yes (cached) | Server → Client | Server wins |
| **Config** | School settings, term dates | ✅ Yes (cached) | Server → Client | Server wins |
| **Media** | Photos, documents, reports | ❌ No (show placeholder) | Client → Server | N/A (deduplicate) |

### 4.2 WatermelonDB Schema Design

WatermelonDB is chosen over raw SQLite because:

- **Record-level sync** — tracks `created_at`, `updated_at`, `deleted_at` per record
- **Pull-based sync** — efficient delta sync with server
- **Lazy loading** — only loads records visible on screen (30fps scrolling with 10k+ records)
- **Relationships** — first-class support for `belongsTo`, `hasMany`

```text
┌─────────────────────────────────────────────────────────┐
│               WatermelonDB Model Example                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  table: students                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  id (app_generated_ulid)          sync status    │   │
│  │  admissionNo        ───────────── ──────────     │   │
│  │  firstName                        created_at     │   │
│  │  lastName                         updated_at     │   │
│  │  schoolId          ›────────────── deleted_at    │   │
│  │  classId           ›────────────── _status       │   │
│  │  enrollmentStatus                 (synced/      │   │
│  │  ...fields                         pending/     │   │
│  └───────────────────────────────────────────created)│   │
│                                                           │
│  Sync protocol:                                          │
│  1. App sends: { created: [], updated: [], deleted: [] } │
│  2. Server returns: { changes: [], conflicts: [] }       │
│  3. App applies server changes, resolves conflicts       │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Sync Engine Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                      SYNC ENGINE FLOW                         │
│                                                                │
│  [Offline]                                                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ User creates  │───►│ WatermelonDB │───►│ Sync Queue   │   │
│  │ assessment    │    │ saves locally│    │ (pending)    │   │
│  └──────────────┘    └──────────────┘    └──────┬───────┘   │
│                                                   │           │
│  [Online]                                         ▼           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ Background    │───►│ POST /sync/  │◄───│ Dequeue &    │   │
│  │ Sync Trigger  │    │ push        │    │ send batch   │   │
│  │ (NetInfo)     │    └──────┬───────┘    └──────────────┘   │
│  └──────────────┘           │                                 │
│                              ▼                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ Apply server  │◄───│  Response    │◄───│ Server        │   │
│  │ changes       │    │  (conflicts) │    │ processes     │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│                                                                │
│  [Reconnection]                                               │
│  • Immediate: high-priority (assessments, attendance)         │
│  • Deferred: reference data (static lists)                    │
│  • Batch: non-critical updates (profile edits)                │
└──────────────────────────────────────────────────────────────┘
```

### 4.4 Conflict Resolution Strategy

| Scenario | Strategy | Implementation |
|---|---|---|
| Same field edited offline by same user | Last-Write-Wins | `updated_at` comparison |
| Two teachers edit same student record | Version Vector | `version` field incremented on each save |
| Rollback detected | Soft-delete + audit | `deleted_at` set, not actually deleted |
| Network failure during sync | Exponential backoff | Retry after 2s → 4s → 8s → 30s → 5min |
| Schema mismatch | API version check | `api-version` header; force app update if incompatible |

---

## 5. Authentication & Security

### 5.1 Offline Auth Flow

```text
┌─────────────────────────────────────────────────────────────────┐
│                         AUTH FLOW                                │
│                                                                   │
│  [First Login — Online Required]                                 │
│  1. POST /auth/login (email + password)                          │
│  2. Server returns: { accessToken, refreshToken, user, school }  │
│  3. App stores:                                                   │
│     • accessToken → SecureStore (30min expiry)                    │
│     • refreshToken → SecureStore (30 day expiry)                  │
│     • user profile → WatermelonDB                                │
│     • school context → Zustand store                             │
│                                                                   │
│  [Subsequent Logins — Works Offline]                             │
│  1. App checks SecureStore for cached session                    │
│  2. If refreshToken exists and not expired: auto-authenticate    │
│  3. If offline: use cached user profile from WatermelonDB        │
│  4. Show dashboard with cached data immediately                  │
│  5. Background: attempt refreshToken → server sync              │
│                                                                   │
│  [Token Refresh]                                                 │
│  • Axios interceptor catches 401                                 │
│  • Attempts refreshToken automatically                           │
│  • If refresh fails: redirect to login                           │
│  • If offline: queue refresh for when online                    │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 RBAC on Mobile

The existing role-based access control transfers directly:

- **Super Admin** — Full system access (all schools)
- **Admin (per school)** — School-wide management
- **Teacher** — Class/subject scoped access
- **Parent** — View own children's data
- **Student** — View own data (limited)

Permissions are **cached locally** and enforced at the UI level (conditionally rendering components) AND at the API level (server-side validation).

---

## 6. Performance Targets

| Metric | Target | How Achieved |
|---|---|---|
| App cold start | < 3 seconds | Hermes engine + bundle splitting |
| Screen transition | < 300ms | React Navigation lazy loading |
| List scroll (10k rows) | 60fps | WatermelonDB lazy rendering |
| API response (online) | < 500ms | CDN + Redis cache layer |
| Sync after reconnect | < 5 seconds | Prioritized queue + delta sync |
| App size (Android) | < 25MB | Hermes, asset optimization |
| Battery drain | < 5% per hour | Batch sync, minimal background work |
| Data usage per sync | < 100KB | Delta sync (only changed fields) |

---

## 7. Infrastructure & Deployment

### 7.1 Mobile Build Pipeline

```text
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Developer   │──►│  GitHub      │──►│  EAS Build   │──►│  Expo        │
│  Code        │   │  Actions     │   │  (Cloud)     │   │  Update CDN  │
│  (TypeScript)│   │  CI/CD       │   │              │   │  (OTA)       │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
                                                    │
                                                    ▼
                                          ┌──────────────────┐
                                          │  App Store       │
                                          │  Google Play     │
                                          │  (Initial build) │
                                          └──────────────────┘
```

### 7.2 Backend Scaling (Existing + Enhancements)

| Component | Current | Enhanced for Mobile |
|---|---|---|
| API Server | Express (single node) | Horizontal scaling (×3-5 nodes behind load balancer) |
| Database | PostgreSQL (single) | Connection pooling (PgBouncer) + Read replicas |
| Cache | Redis (optional) | Redis mandatory — session cache + sync queue |
| Queue | Bull | BullMQ with priority queues for sync |
| File Storage | Local | S3/CloudFlare R2 for images + reports |
| Real-time | None | Socket.io for live sync triggers |

### 7.3 Recommended Cloud Architecture (DigitalOcean / AWS)

```text
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION CLUSTER                            │
│                                                                   │
│  [Load Balancer]                                                  │
│       │                                                          │
│  ┌────┴────┐  ┌────┴────┐  ┌────┴────┐                         │
│  │ API N1  │  │ API N2  │  │ API N3  │  (Auto-scaled)           │
│  └────┬────┘  └────┬────┘  └────┬────┘                         │
│       │            │            │                               │
│  ┌────▼────────────▼────────────▼─────────────────────┐       │
│  │              Redis (ElastiCache / DO Managed)       │       │
│  │  • Session cache • Sync queue • Rate limiting      │       │
│  │  • BullMQ queue • Socket.io adapter (pub/sub)      │       │
│  └────────────────────────────┬────────────────────────┘       │
│                               │                                │
│  ┌────────────────────────────▼────────────────────────┐       │
│  │              PostgreSQL (Managed DB)                  │       │
│  │  • Primary (writes) • Read replica (reads)          │       │
│  │  • PgBouncer (connection pooling)                   │       │
│  │  • Automated backups + point-in-time recovery       │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                   │
│  CDN: CloudFront / CloudFlare (static assets + API caching)     │
│  Monitoring: Sentry (crash) + Datadog / Grafana (metrics)        │
│  Notifications: FCM (Firebase) + APNs (Apple)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Data Model Additions for Sync Support

### 8.1 Prisma Schema Additions (Backend)

```prisma
/// Add to EVERY model that supports offline sync
model Student {
  /// ...existing fields...

  // Sync metadata (new fields)
  syncVersion    Int      @default(1)
  lastSyncAt     DateTime?
  deletedAt      DateTime?
  createdBy      String?  /// User ID who created record
  updatedBy      String?  /// User ID who last updated
}

/// New table for tracking sync operations
model SyncLog {
  id            String   @id @default(uuid())
  tenantId      String
  deviceId      String   /// Unique device identifier
  action        String   /// "CREATE", "UPDATE", "DELETE"
  tableName     String   /// e.g. "students", "assessments"
  recordId      String
  payload       Json     /// Full record snapshot
  status        String   /// "PENDING", "CONFIRMED", "CONFLICT", "FAILED"
  createdAt     DateTime @default(now())
  resolvedAt    DateTime?
}
```

### 8.2 API Endpoints (New)

```typescript
// REST endpoints for sync (new routes)
POST   /api/v2/sync/push       // Client pushes local changes
GET    /api/v2/sync/pull       // Client pulls server changes (since timestamp)
POST   /api/v2/sync/resolve    // Client sends conflict resolution
GET    /api/v2/sync/status     // Client checks sync state

// Modified existing endpoints
GET    /api/v2/students?since=2024-01-01T00:00:00Z  // Delta sync
```

---

## 9. Push Notifications Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                 PUSH NOTIFICATION FLOW                         │
│                                                                │
│  [Backend Event]                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ New           │───►│ BullMQ Job   │───►│ Push         │   │
│  │ assessment    │    │ (Notify)     │    │ Notification │   │
│  │ published     │    │              │    │ Service      │   │
│  └──────────────┘    └──────────────┘    └──────┬───────┘   │
│                                                   │           │
│                                                   ▼           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Expo Push API  ───►  FCM (Android) + APNs (Apple)   │  │
│  │  (Managed by Expo Notifications)                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                   │           │
│                                                   ▼           │
│  ┌──────────────┐                                              │
│  │ Device       │                                              │
│  │ receives     │                                              │
│  │ notification │                                              │
│  │ → triggers   │                                              │
│  │ background   │                                              │
│  │ sync         │                                              │
│  └──────────────┘                                              │
└──────────────────────────────────────────────────────────────┘
```

**Push notification use cases:**

- New assignment/test published → teachers notified
- Student record updated → parents notified
- Fee payment received → admin notified
- Sync conflict detected → user prompted to resolve

---

## 10. Migration Strategy (Web → Mobile)

### Phase 1: Foundation (Weeks 1-3)

| Task | Effort | Dependencies |
|---|---|---|
| Set up Expo project with TypeScript | 2 days | Node 18+, Expo CLI |
| Configure EAS Build pipeline | 1 day | Expo account |
| Create shared UI components (DataTable, Forms, Cards) | 5 days | React Native Paper |
| Implement auth flow (online + offline) | 3 days | Zustand + SecureStore |
| Set up WatermelonDB schema for core models | 5 days | Prisma schema reference |
| Implement base navigation (Expo Router) | 2 days | Role-based route config |

### Phase 2: Core Offline Features (Weeks 4-8)

| Task | Effort | Dependencies |
|---|---|---|
| Dashboard (offline-cached metrics) | 5 days | WatermelonDB |
| Student management (CRUD + offline) | 7 days | WatermelonDB |
| Teacher management (CRUD + offline) | 4 days | WatermelonDB |
| Class & Subject management | 5 days | WatermelonDB |
| Assessment entry (offline-first) | 7 days | Sync engine |
| Grade viewing (cached) | 3 days | TanStack Query persist |

### Phase 3: Sync Engine & Advanced Features (Weeks 9-14)

| Task | Effort | Dependencies |
|---|---|---|
| Backend sync API endpoints | 5 days | Prisma schema update |
| Sync engine (queue + conflict resolution) | 10 days | WatermelonDB sync adapter |
| Attendance tracking (offline) | 5 days | Sync engine |
| Fee recording (offline queue) | 5 days | Sync engine |
| Push notifications | 3 days | Expo Notifications |
| Background sync service | 5 days | NetInfo + AppState |

### Phase 4: Polish & Deploy (Weeks 15-17)

| Task | Effort | Dependencies |
|---|---|---|
| Performance optimization (Hermes, bundle split) | 5 days | Profiling |
| Offline media handling (profile photos) | 3 days | Async image caching |
| Biometric auth (fingerprint/face) | 2 days | Expo Local Auth |
| Beta testing (TestFlight + Play Console) | 7 days | EAS Build |
| App store submission | 5 days | Screenshots, metadata |

---

## 11. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Data conflict between offline users | Medium | High | Version vectors + audit trail |
| Large sync payload (>1MB) | Medium | Medium | Delta sync + compression (gzip) |
| Low-end device performance | Medium | High | Lazy rendering, batch operations |
| User switches devices | Low | High | Cloud backup of WatermelonDB |
| API breaking changes | Medium | Medium | API versioning + EAS Update rolled app |
| Battery drain from sync | Medium | Low | Batch sync + network-aware scheduling |

---

## 12. Monitoring & Observability

| What | Tool | Purpose |
|---|---|---|
| Crash reporting | Sentry + Expo Analytics | Real-time error tracking |
| Sync health | Custom dashboard (Prometheus) | Queue depth, sync failures |
| API latency | Datadog / Grafana | p50/p95/p99 response times |
| User engagement | Mixpanel / PostHog | Feature adoption, retention |
| Connectivity stats | Network Information API | Offline duration, retry counts |
| Push delivery | Expo Push API analytics | Delivery rate, open rate |

---

## 13. Conclusion

**Expo (React Native) is absolutely production-ready for EduTrak's scale.** The same companies that power global apps (Discord, Shopify, Uber) use Expo in their stack. The critical success factors are:

1. **Strong sync engine** — WatermelonDB handles offline data integrity
2. **Scalable backend** — Your existing Express + Prisma + PostgreSQL with horizontal scaling
3. **Priority-based sync** — Critical data syncs first, reference data caches later
4. **Incremental adoption** — Existing web app remains fully functional during migration

The estimated total effort is **~17 weeks** with a dedicated team, or **~25 weeks** for a single developer working full-time.

**Recommended next step:** Set up the Expo project and implement Phase 1 (Foundation) to validate the architecture with a working prototype on both iOS and Android.