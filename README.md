# MERN Cyber Crime Reporting System

A full-stack cyber crime complaint management and investigation platform built using the MERN stack (**MongoDB Atlas**, **Express.js**, **React 19**, and **Node.js**). The platform utilizes **Horizon UI** with **Tailwind CSS** on the frontend and includes role-based access controls, officer approval workflows, an SLA-enforced automated escalation engine, comprehensive analytics, system health metrics, in-memory caching, secure session management, and robust file upload controls.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Module & Feature Specification](#module--feature-specification)
3. [Dashboard Workspaces](#dashboard-workspaces)
4. [SLA Escalation Engine (Phase D)](#sla-escalation-engine-phase-d)
5. [Session & Authentication Security](#session--authentication-security)
6. [Evidence Upload & Storage Controls](#evidence-upload--storage-controls)
7. [Database Schema Reference](#database-schema-reference)
8. [API Endpoints Reference](#api-endpoints-reference)
9. [Performance, Caching & Testing](#performance-caching--testing)
10. [Folder Structure](#folder-structure)
11. [Setup & Installation](#setup--installation)
12. [Troubleshooting & Maintenance](#troubleshooting--maintenance)
13. [Production Deployment Notes](#production-deployment-notes)

---

## System Architecture

The application is split into a React-based single-page application (SPA) and an Express-based REST API, communicating via JSON payloads over HTTP.

```
[React SPA Frontend] --(apiFetch over HTTPS with credentials)--> [Express.js Backend API]
  - Horizon UI & Tailwind CSS                                      - Port 5000 (Default)
  - React Router v6 & Role Guards                                  - Security Middlewares (Helmet, CORS, Rate Limit)
  - TanStack Table v8 & ApexCharts                                 - Central appConfig & Cookie Parser
                                                                   - Async Handler & Centralized Error Handler
                                                                        |
                                                                        +---> [MongoDB Atlas Cluster]
                                                                        |       - 17 Collections
                                                                        |       - Custom Document Indexes
                                                                        |       - Database Schema Validators
                                                                        |
                                                                        +---> [Local Disk Uploads]
                                                                                - Safe Multipart Multer Storage
                                                                                - Automated File Cleanup
```

### Key Architectural Layers
1. **Frontend Services**: API calls are routed through a centralized helper `src/services/api.js` using `credentials: "include"`. This ensures HTTP-only cookies containing session identifiers are automatically sent with every request.
2. **Security & Performance Middlewares**: Located in `backend/middleware/security.js`. It wraps requests with Helmet security headers, GZIP compression, a general rate limiter, an auth-specific rate limiter, and a request timeout handler to prevent hanging connections.
3. **Session Verification**: The `authMiddleware` checks for the JWT in either the HTTP-only `ccrs_session` cookie or the HTTP `Authorization` header. It then queries the `sessions` collection to confirm the session is active and has not been revoked.
4. **Data Aggregation and Caching**: The stats cache in `backend/utils/memoryCache.js` buffers high-frequency dashboard analytics requests with configurable time-to-live (TTL) thresholds, minimizing DB load.

---

## Module & Feature Specification

### 1. User Management & RBAC Workflow
The system enforces Role-Based Access Control (RBAC) across four user roles:
*   **User (Citizen)**: Can submit complaints, save drafts, track complaint status, upload evidence, and message investigators.
*   **PendingOfficer**: A registered officer waiting for admin verification. Access to officer-only resources is blocked.
*   **InvestigationOfficer**: An approved case handler who can update complaints, manage reminders, and view assignments in their assigned department/unit.
*   **Admin**: Superuser with complete system control, user CRUD, officer approvals, calendar management, system health checks, escalations configurator, advanced analytics, and audit logs.

#### Officer Registration and Approval Pipeline
```
[Officer Registers] ---> [User Created as PendingOfficer] ---> [Admin Review Dashboard]
  - Submits Unit/Dept      - officerRequestStatus: "Pending"     - GET /api/users/officer-requests
  - Submits CNIC/Phone     - isApprovedOfficer: false            - POST /api/users/:id/officer-review
                                                                     |
                                  +----------------------------------+----------------------------------+
                                  | (Approve Action)                                                     | (Reject Action)
                                  v                                                                      v
                     [Role -> InvestigationOfficer]                                         [Role -> PendingOfficer]
                     - isApprovedOfficer: true                                              - isApprovedOfficer: false
                     - officerRequestStatus: "Approved"                                     - officerRequestStatus: "Rejected"
                     - Assigned Unit/Department locked                                      - Notification Sent
```
*   **Token Verification**: If configured via `OFFICER_ENROLLMENT_TOKEN` in the environment, registration for `InvestigationOfficer` roles is strictly blocked unless the matching token is provided.
*   **OTP Verification Simulation**: Registrants provide a phone number. An OTP simulation sends codes to Email/SMS notification stores. Verification updates `phoneVerified` to `true`.
*   **CNIC Integrity**: Users are validated to ensure CNIC values are present and meet length requirements.

### 2. Complaint Submission & Department Routing
Citizens submit complaints by specifying details, location (city), severity, and category.
*   **Auto-routing**: The backend dynamically infers the target `department` based on the incident type:
    *   *phishing* / *scam* $\rightarrow$ **Phishing**
    *   *fraud* $\rightarrow$ **Financial Fraud**
    *   *account* $\rightarrow$ **Account Security**
    *   *malware* / *ransom* $\rightarrow$ **Malware Analysis**
    *   *harassment* / *abuse* $\rightarrow$ **Harassment**
    *   *Default* $\rightarrow$ **General Cyber Crime**
*   **Severity Autofill**: Severity defaults to **High** but is automatically adjusted to **Critical** for ransomware/ransom keywords, **High** for fraud/phishing/scams, or **Medium** for others.
*   **Drafts System**: Users can save progressive edits as drafts under the `complaintdrafts` collection. Drafts persist across sessions and are converted to active complaints only upon formal submission.

### 3. Investigation & Q&A Workspace
*   **Assignments**: Admins assign cases to officers. The system enforces department matching: an officer can only be assigned to complaints matching their configured `unit` department.
*   **Case Notes**: Append-only chronological case notes on complaints. Neither officers nor admins can modify or delete existing notes.
*   **Q&A Messages**: A real-time message exchange module linked to the complaint, allowing users and investigators to communicate.
*   **Reminders & Calendar**: Officers and Admins can schedule investigation deadlines, follow-ups, and user meetings on an interactive calendar.

---

## Dashboard Workspaces

### Citizen Portal
*   **Report Crime**: Submit new incidents with attachments.
*   **Drafts Manager**: Retrieve and modify incomplete drafts.
*   **Status Timeline Tracker**: An order-tracking-style progressive timeline highlighting complaint transitions from `Pending` $\rightarrow$ `In Review` $\rightarrow$ `Under Investigation` $\rightarrow$ `Resolved` / `Closed`.
*   **Q&A Board**: Direct Q&A thread with the assigned officer.

### Officer Workspace
*   **Investigations Panel**: Access assigned cases and modify status.
*   **Alert Center**: View system alerts and SLA approaching warnings.
*   **Officer Calendar**: Set due dates, schedule events, and log internal reviews.

### Admin Control Panel
1.  **Overview Dashboard**: Stat cards showing Total Complaints, Pending Cases, Resolved Cases, and High Severity Alerts, alongside a tabular list of recent complaints and a quick-assign panel.
2.  **User & Officer Manager**: Complete user database control, editing roles/status, and reviewing pending officer requests with approval/rejection logging.
3.  **System Health**: Real-time operational metrics:
    *   *Application Uptime & Environment*
    *   *Database Connection State & Pools*
    *   *API Throughput* (24h, 7d, 30d write actions)
    *   *Active Session Counts & Online Officer Estimates*
    *   *Evidence Upload Footprint* (Total files & disk storage size)
    *   *SLA compliance percentages*
4.  **Advanced Analytics**:
    *   *Filters*: Scope reports by date range (from/to), city, category, officer, status, and department.
    *   *Visuals*: Trend charts, donut charts for severities, and bar charts for categories.
    *   *Exporters*: Generate print-ready summaries, export clean CSV files, and generate client-side PDFs.
5.  **Officer Performance**: Tabular evaluation ranking officers by assigned cases, resolved cases, resolution rates, and average resolution times in hours.
6.  **Escalations Control**: Configurator for adjusting global SLA parameters and triggering manual engine cycles.
7.  **Audit Log Feed**: Real-time event log tracking Registration, Complaint, Resolution, Assignment, Evidence, Message, Escalation, and Account events, exportable to CSV.

---

## SLA Escalation Engine (Phase D)

The system features an automated SLA evaluation and reassignment cycle to ensure critical complaints do not breach response deadlines.

```
       [SLA Cycle Fired] ---> Checks All Open Complaints ("Pending", "In Review", "Under Investigation")
                                  |
            +---------------------+---------------------+
            |                                           |
     (SLA Deadline Passed)                       (SLA Approaching)
            |                                           v
            v                                  [Dispatch SLA Warning]
     [Trigger SLA Breach]                      - Sets `slaWarnedAt`
     - Increment Escalation Level (Max 3)      - Logs Warning event
     - Write immutable Escalation Log          - Notifies Officer via In-App Alert
     - Notify Administrators                   
            |
            +---> Auto-Reassignment Enabled?
                    |
                    +---> YES ---> [Select Eligible Senior Officer]
                    |                - Must match Complaint Department
                    |                - Prioritizes most resolved cases (experience)
                    |                - Breaks ties by lightest current open workload
                    |                - Reassigns case, updates Assignment, notifies Officer
                    |
                    +---> NO  ---> [Queue Escalation]
                                     - Places complaint in active Escalations Queue
```

### 1. SLA Thresholds
SLA thresholds are defined by severity:
*   **Critical**: 24 Hours
*   **High**: 48 Hours
*   **Medium**: 96 Hours
*   **Low**: 168 Hours

### 2. Escalation Configuration Properties (`EscalationConfig`)
Admins manage a global configuration document with the following properties:
*   `enabled`: Toggle the background engine execution.
*   `autoReassign`: Enable automatic reassignment of breached cases.
*   `warnBeforeHours`: Lead time in hours to trigger warnings before a breach occurs.
*   `reminderIntervalHours`: Minimum wait time between successive escalations on the same case.
*   `maxLevel`: Limit of escalation cycles allowed per complaint (capped at 3).
*   `notifyAdmins` & `notifyOfficers`: Toggles for push/in-app alert dispatches.
*   `triggers`: Define which breach types trigger escalation (`unassigned`, `notUpdated`, `inactive`).

### 3. Execution Lifecycle
The engine runs automatically on a background scheduler configured via `ESCALATION_INTERVAL_MIN` (defaulting to every 15 minutes). It can also be manually triggered via `POST /api/escalations/run`.

---

## Session & Authentication Security

Authentication utilizes a hybrid JWT and server-side session tracking system:

```
[User Login Request] ---> Verify Password (bcrypt) ---> Write Session Object
                                                          - Generate unique `sessionId`
                                                          - Store in `sessions` collection
                                                          - Embed `sid` claim inside JWT
                                                              |
                                      +-----------------------+-----------------------+
                                      |                                               |
                                      v                                               v
                         [Set HTTP-only Cookie]                          [Return Token in Response Body]
                         - Name: `ccrs_session`                          - Saved to `localStorage` (compatibility)
                         - Path: `/`                                     - Sent as `Authorization: Bearer <token>`
                         - SameSite: "Lax"
                         - Secure: true (in Production)
```

### Authentication Verification Workflow
For every protected route request:
1.  **Extraction**: The backend extracts the JWT from the `ccrs_session` cookie or the `Authorization` header.
2.  **JWT Verification**: Verifies the signature against `JWT_SECRET` and confirms the expiration.
3.  **Active Session Validation**: Queries the `sessions` collection using the `sid` claim:
    *   *Is the session present?*
    *   *Has `revokedAt` been populated?*
    *   *Has the session passed its `expiresAt` date?*
4.  **Security Actions**: If a validation fails, the request is rejected with a `401 Unauthorized` status, and the `ccrs_session` cookie is cleared.
5.  **Logout**: Triggers immediate session revocation by updating `revokedAt` to `new Date()` and clearing client cookies.

---

## Evidence Upload & Storage Controls

The backend handles multi-file evidence uploads using `multer` with strict validation to prevent server resource abuse.

*   **Size Limits**: Capped at **100 MB** per file and **1 GB** total upload size per request.
*   **File Count**: Limited to a maximum of **10** files per request.
*   **Supported File Types**: Restricted to images, PDF, ZIP, TXT, and CSV.
*   **Content-Length Validation**: Evaluates the `Content-Length` header before Multer processes files to prevent large uploads from consuming memory.
*   **Cleanup on Validation Failure**: If a file upload fails validation, the system automatically deletes any temporarily written files using `fs.unlink`.
*   **Database Association**: Uploaded files generate entries in the `evidence` collection, linking metadata (file path, MIME type, size) to the corresponding complaint.

---

## Database Schema Reference

The system uses 17 collections in MongoDB Atlas, managed via Mongoose models:

### 1. User (`users`)
Tracks registered users, role status, phone verification status, and officer approval history.
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["Admin", "InvestigationOfficer", "PendingOfficer", "User"], default: "User" },
  isApprovedOfficer: { type: Boolean, default: false },
  officerRequestStatus: { type: String, enum: ["None", "Pending", "Approved", "Rejected"], default: "None" },
  officerRequestedAt: { type: Date },
  officerReviewedAt: { type: Date },
  officerReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  officerReviewReason: { type: String, default: "" },
  unit: { type: String, default: "" },
  phoneNumber: { type: String, default: "" },
  phoneVerified: { type: Boolean, default: false },
  cnic: { type: String, default: "" },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" }
}
```

### 2. Complaint (`complaints`)
Contains complaint details, severity, status, routing, and escalation properties.
```javascript
{
  referenceId: { type: String, unique: true, index: true },
  complainantName: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, default: "" },
  incidentType: { type: String, required: true },
  department: { type: String, default: "" },
  city: { type: String, default: "" },
  incidentSummary: { type: String, required: true },
  evidenceLinks: { type: [String], default: [] },
  severity: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "High" },
  status: { type: String, enum: ["Pending", "In Review", "Under Investigation", "Resolved", "Closed"], default: "Pending" },
  caseNotes: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  statusHistory: [{
    status: { type: String },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  }],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resolvedAt: { type: Date },
  escalationLevel: { type: Number, default: 0 },
  escalated: { type: Boolean, default: false },
  lastEscalatedAt: { type: Date },
  slaWarnedAt: { type: Date },
  evidence: [{ type: mongoose.Schema.Types.ObjectId, ref: "Evidence" }]
}
```

### 3. Session (`sessions`)
Stores active tokens and details for login sessions.
```javascript
{
  sessionId: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  revokedAt: { type: Date, default: null },
  userAgent: { type: String, default: "" },
  ipAddress: { type: String, default: "" }
}
```

### 4. Assignment (`assignments`)
Tracks case assignments and investigator status updates.
```javascript
{
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["Assigned", "In Progress", "Completed"], default: "Assigned" },
  notes: { type: String, default: "" }
}
```

### 5. Evidence (`evidence`)
Stores file metadata for files uploaded to the local filesystem.
```javascript
{
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  mimeType: { type: String, default: "" },
  size: { type: Number, default: 0 }
}
```

### 6. EscalationConfig (`escalationconfigs`)
Configuration document for background engine runs.
```javascript
{
  key: { type: String, default: "global", unique: true },
  enabled: { type: Boolean, default: true },
  slaHours: {
    Critical: { type: Number, default: 24 },
    High: { type: Number, default: 48 },
    Medium: { type: Number, default: 96 },
    Low: { type: Number, default: 168 }
  },
  triggers: {
    unassigned: { type: Boolean, default: true },
    notUpdated: { type: Boolean, default: true },
    inactive: { type: Boolean, default: true }
  },
  autoReassign: { type: Boolean, default: true },
  warnBeforeHours: { type: Number, default: 6 },
  reminderIntervalHours: { type: Number, default: 24 },
  maxLevel: { type: Number, default: 3 },
  notifyAdmins: { type: Boolean, default: true },
  notifyOfficers: { type: Boolean, default: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}
```

### 7. EscalationLog (`escalationlogs`)
Chronological audit logs of SLA breaches and reassignments.
```javascript
{
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", required: true, index: true },
  referenceId: { type: String, default: "" },
  level: { type: Number, default: 1 },
  type: { type: String, enum: ["Triggered", "Reassigned", "Queued", "Warning", "Violation", "Resolved", "AdminOverride"], required: true },
  reason: { type: String, default: "" },
  severity: { type: String, default: "" },
  slaHours: { type: Number },
  ageHours: { type: Number },
  fromOfficer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  toOfficer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  adminOverride: { type: Boolean, default: false },
  by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  city: { type: String, default: "" },
  category: { type: String, default: "" }
}
```

### 8. ComplaintDraft (`complaintdrafts`)
User-owned snapshots of in-progress complaint forms.
```javascript
{
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, default: "Untitled draft" },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }
}
```

### 9. ComplaintMessage (`complaintMessages`)
Internal messages between citizens and investigation teams.
```javascript
{
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderRole: { type: String, enum: ["Admin", "InvestigationOfficer", "User"], required: true },
  message: { type: String, required: true }
}
```

### 10. Notification (`notifications`)
Stores in-app messages and communication channels.
```javascript
{
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["Complaint", "Status", "Assignment", "OTP", "Support", "System"], default: "System" },
  channel: { type: String, enum: ["InApp", "Email", "SMS"], default: "InApp" },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  read: { type: Boolean, default: false }
}
```

### 11. OfficerApprovalLog (`officerApprovalLogs`)
History of approvals and rejections of officer applications.
```javascript
{
  officer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, enum: ["Approved", "Rejected"], required: true },
  department: { type: String, default: "" },
  reason: { type: String, default: "" }
}
```

### 12. OtpVerification (`otpverifications`)
Tracks registration OTP lifecycle.
```javascript
{
  phone: { type: String, required: true, index: true },
  purpose: { type: String, default: "registration" },
  codeHash: { type: String, required: true, select: false },
  attempts: { type: Number, default: 0 },
  resendCount: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  lastSentAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date }
}
```

### 13. Reminder (`reminders`)
Tracks calendar reminders for officers.
```javascript
{
  officer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true },
  category: { type: String, enum: ["EvidenceReview", "UserMeeting", "InvestigationDeadline", "CaseFollowUp", "InternalReview", "Custom"], default: "Custom" },
  notes: { type: String, default: "" },
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint" },
  complaintRef: { type: String, default: "" },
  dueAt: { type: Date, required: true },
  allDay: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date }
}
```

### 14. SupportTicket (`supportTickets`)
Citizen support and feedback requests.
```javascript
{
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  requesterName: { type: String, default: "" },
  requesterEmail: { type: String, default: "" },
  category: { type: String, default: "General" },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ["Open", "In Progress", "Closed"], default: "Open" },
  adminReply: { type: String, default: "" },
  resolvedAt: { type: Date },
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String, default: "" }
}
```

### 15. Faq (`faqs`)
Stores Frequently Asked Questions.
```javascript
{
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String, default: "General" }
}
```

### 16. AdminAnalytics (`admin_analytics`)
Cached system analytics.
```javascript
{
  scopeKey: { type: String, default: "global", unique: true },
  totalComplaints: { type: Number, default: 0 },
  monthlyCounts: [{ year: Number, month: Number, label: String, count: Number }],
  yearlyCounts: [{ year: Number, label: String, count: Number }],
  categoryStats: [{ label: String, count: Number }],
  pieChartData: [{ label: String, count: Number }],
  statusSummary: [{ label: String, count: Number }],
  generatedAt: { type: Date, default: Date.now }
}
```

### 17. UserAnalytics (`user_analytics`)
Cached dashboard data for individual users.
```javascript
{
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  scopeRole: { type: String, enum: ["User", "InvestigationOfficer"], required: true },
  totalComplaints: { type: Number, default: 0 },
  monthlyCounts: [{ year: Number, month: Number, label: String, count: Number }],
  yearlyCounts: [{ year: Number, label: String, count: Number }],
  categoryStats: [{ label: String, count: Number }],
  pieChartData: [{ label: String, count: Number }],
  statusSummary: [{ label: String, count: Number }],
  generatedAt: { type: Date, default: Date.now }
}
```

---

## API Endpoints Reference

### Authentication & User Management
| Method | Path | Allowed Roles | Payload / Query | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/users/register` | Public | `{ name, email, password, role, unit, phoneNumber, cnic, officerEnrollmentToken }` | Register a new user or pending officer |
| `POST` | `/api/users/login` | Public | `{ email, password }` | Authenticate user, set cookie, and return token |
| `POST` | `/api/users/logout` | All Roles | None | Revoke session and clear cookies |
| `GET` | `/api/users/me` | All Roles (Auth) | None | Get current user profile details |
| `POST` | `/api/users/otp/verify`| All Roles (Auth) | None | Simulate OTP verification |
| `GET` | `/api/users` | Admin | None | List all registered users |
| `GET` | `/api/users/officer-requests`| Admin | None | List pending officer applications |
| `POST` | `/api/users/:id/officer-review`| Admin | `{ action: "approve" \| "reject", department, reason }` | Approve or reject officer applications |
| `GET` | `/api/users/officer-approval-logs`| Admin | None | Retrieve officer application logs |
| `PATCH` | `/api/users/:id` | Admin | `{ name, role, unit, status, phoneNumber, cnic }` | Update user details |
| `DELETE`| `/api/users/:id` | Admin | None | Delete user account |
| `POST` | `/api/users/admin/create`| Admin | `{ name, email, password }` | Create an additional admin account |

### Complaints Management
| Method | Path | Allowed Roles | Payload / Query | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/complaints` | User | `{ complainantName, email, phoneNumber, incidentType, city, incidentSummary, evidenceLinks, severity }` | Submit a new complaint |
| `GET` | `/api/complaints/search` | User (own), Officer (assigned), Admin (all) | `?complaintId=` or `?referenceId=` | Search complaints by ID or reference number |
| `GET` | `/api/complaints/stats` | All Roles (Auth) | None | Get dashboard counts |
| `GET` | `/api/complaints/assigned` | Officer, Admin | None | List assigned complaints |
| `GET` | `/api/complaints/city-stats` | Admin | None | Get complaint metrics grouped by city |
| `POST` | `/api/complaints/:id/assign`| Admin | `{ officerId, notes }` | Assign complaint to matching officer |
| `PATCH` | `/api/complaints/:id/status`| Officer (assigned), Admin | `{ status, severity, notes }` | Update complaint status and append notes |
| `DELETE`| `/api/complaints/:id` | Admin | None | Delete a complaint and its dependencies |

### Evidence & Messaging
| Method | Path | Allowed Roles | Payload / Query | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/complaints/:id/evidence`| User, Officer, Admin | Form Data: `evidenceFiles` (file array) | Upload files to local storage and link them to the case |
| `GET` | `/api/complaints/:id/evidence`| User, Officer, Admin | None | List files linked to the case |
| `DELETE`| `/api/complaints/:id/evidence/:evidenceId`| Admin | None | Delete a linked file |
| `POST` | `/api/complaints/:id/messages`| User, Officer, Admin | `{ message }` | Post a new Q&A message |
| `GET` | `/api/complaints/:id/messages`| User, Officer, Admin | None | Retrieve Q&A message history |

### Support Tickets & FAQs
| Method | Path | Allowed Roles | Payload / Query | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/support-tickets` | User, Officer, Admin | `{ requesterName, requesterEmail, category, subject, message }` | Submit a support request |
| `GET` | `/api/support-tickets` | User, Officer, Admin | None | List submitted support tickets |
| `PATCH` | `/api/support-tickets/:id`| Officer, Admin | `{ status, adminReply }` | Respond to and update support tickets |
| `PATCH` | `/api/support-tickets/:id/feedback`| User | `{ rating, feedback }` | Rate resolved support tickets |
| `GET` | `/api/support-tickets/faq/list`| User, Officer, Admin | None | Get seeded FAQ questions |
| `DELETE`| `/api/support-tickets/:id` | Admin | None | Delete support tickets |

### System Reports & Analytics dashboards
| Method | Path | Allowed Roles | Payload / Query | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/summary` | User, Officer, Admin | `?refresh=true` | Get cached system-wide analytics |
| `GET` | `/api/reports/summary/admin`| Admin | `?refresh=true` | Get cached admin dashboard data |
| `GET` | `/api/reports/summary/user` | User, Officer | `?refresh=true` | Get cached user dashboard data |
| `GET` | `/api/reports/system-health`| Admin | None | Get live system health diagnostics |
| `GET` | `/api/reports/officer-performance`| Admin | None | Get officer productivity metrics |
| `GET` | `/api/reports/escalations`| Admin | None | List open cases and their SLA usage |
| `GET` | `/api/reports/audit-log` | Admin | `?limit=150` | Retrieve system audit logs |
| `GET` | `/api/reports/analytics` | Admin | `?from=&to=&city=&category=&officer=&status=&department=` | Get advanced analytics metrics |

### Drafts System
| Method | Path | Allowed Roles | Payload / Query | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/drafts` | All Roles (Auth) | None | Get list of user's drafts |
| `POST` | `/api/drafts` | All Roles (Auth) | `{ title, data }` | Save an in-progress draft |
| `GET` | `/api/drafts/:id` | All Roles (Auth) | None | Retrieve draft details |
| `DELETE`| `/api/drafts/:id` | All Roles (Auth) | None | Delete draft |

### OTP Validation Simulation
| Method | Path | Allowed Roles | Payload / Query | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/otp/request` | Public | `{ phone, purpose }` | Request validation code |
| `POST` | `/api/otp/resend` | Public | `{ phone, purpose }` | Resend verification code |
| `POST` | `/api/otp/verify` | Public | `{ phone, code, purpose }` | Verify OTP code |

### Reminders & Calendar
| Method | Path | Allowed Roles | Payload / Query | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/reminders` | Officer, Admin | None | Get officer's reminders |
| `POST` | `/api/reminders` | Officer, Admin | `{ title, category, notes, complaint, dueAt, allDay }` | Add calendar reminder |
| `PATCH` | `/api/reminders/:id` | Officer, Admin | `{ title, notes, dueAt, completed, completedAt }` | Update reminder |
| `DELETE`| `/api/reminders/:id` | Officer, Admin | None | Remove reminder |

### SLA Escalation Rules Control
| Method | Path | Allowed Roles | Payload / Query | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/escalations/config` | Admin | None | Retrieve global SLA configurations |
| `PUT` | `/api/escalations/config` | Admin | `{ enabled, autoReassign, notifyAdmins, notifyOfficers, warnBeforeHours, maxLevel, slaHours, triggers }` | Update global SLA configurations |
| `GET` | `/api/escalations/queue` | Admin | None | List escalated complaints |
| `GET` | `/api/escalations/logs` | Admin | `?type=&limit=` | Retrieve SLA breach history |
| `GET` | `/api/escalations/stats` | Admin | None | Get SLA performance statistics |
| `POST` | `/api/escalations/run` | Admin | None | Run escalation engine cycle immediately |
| `POST` | `/api/escalations/:complaintId/reassign`| Admin | `{ officerId }` | Manually reassign an escalated case |

---

## Performance, Caching & Testing

### 1. In-Memory Cache Optimization
The system uses a memory cache module (`backend/utils/memoryCache.js`) to cache dashboard data:
*   General statistics requests (`/api/complaints/stats`) are cached for **15 seconds** (adjustable via `CACHE_STATS_TTL_MS`).
*   Advanced analytics results (`/api/reports/analytics`) are cached for **30 seconds**. This reduces the database workload for dashboard queries that filter across multiple fields.

### 2. Database Indexing Optimization
The system configures database indexes to optimize query performance:
*   `users`: Compounded index on `{ role: 1, officerRequestStatus: 1 }` and `{ status: 1 }`.
*   `complaints`: Indexes on `{ createdBy: 1, createdAt: -1 }`, `{ assignedTo: 1, createdAt: -1 }`, `{ status: 1, severity: 1 }`, `{ department: 1 }`, `{ city: 1 }`, and `{ escalated: 1, status: 1 }`.
*   `sessions`: Index on `{ user: 1, revokedAt: 1, expiresAt: 1 }`.
*   `evidence`: Index on `{ complaint: 1, createdAt: -1 }`.
*   `reminders`: Compounded index on `{ officer: 1, dueAt: 1 }` and `{ officer: 1, completed: 1 }`.
*   `escalationlogs`: Index on `{ type: 1, createdAt: -1 }`.

Indices are synchronized on server boot via `User.syncIndexes()`, `Complaint.syncIndexes()`, `Evidence.syncIndexes()`, and `Session.syncIndexes()`. This can also be manually run using `npm run ensure:indexes`.

### 3. API Load Testing Tools
The codebase includes load testing tools in `backend/scripts/load-test/`:

*   **Autocannon Performance Scripts**: Simulated connections are managed by `run-autocannon.js`:
    *   **Smoke Test**: Runs a quick test scenario.
        ```bash
        cd backend
        npm run load:test:smoke
        ```
    *   **Full Stress Test**: Simulates 1,000 concurrent connections over 30 seconds across endpoints for health, log-in, dashboard statistics, and queries.
        ```bash
        cd backend
        npm run load:test
        ```
*   **k6 Integration Scenarios**: Configured in `k6-load.js`. Run using the k6 CLI:
    ```bash
    k6 run backend/scripts/load-test/k6-load.js
    ```

---

## Folder Structure

```
horizon-tailwind-react-main/
├── backend/
│   ├── config/
│   │   └── appConfig.js             # Parses environment variables and exports configuration
│   ├── controllers/                 # Express controllers containing business logic
│   │   ├── assignmentController.js  # Case assignment management
│   │   ├── complaintController.js   # Complaint submission, search, and details
│   │   ├── draftController.js       # Citizen complaint form drafts
│   │   ├── escalationController.js  # SLA rules and reassignment API
│   │   ├── evidenceController.js    # Multer upload hooks and metadata associations
│   │   ├── messageController.js     # Citizen-investigator Q&A messaging
│   │   ├── notificationController.js# Notification center management
│   │   ├── otpController.js         # Phone verification OTP simulation
│   │   ├── reminderController.js    # Investigator calendar and reminder management
│   │   ├── reportController.js      # System Health, Performance, and Advanced Analytics
│   │   ├── supportTicketController.js # Support ticket management
│   │   └── userController.js        # Authentication, profile, and officer approval
│   ├── middleware/                  # Request handling and security logic
│   │   ├── authMiddleware.js        # Extracts JWT and verifies active sessions
│   │   ├── errorHandler.js          # Handles 404 and global exceptions
│   │   ├── roles.js                 # Verifies role-based access limits
│   │   ├── security.js              # Helmet, CORS, Rate Limiters, and Request Timeout config
│   │   ├── upload.js                # Multer configuration and file type validation
│   │   └── uploadValidation.js      # Checks request length and handles cleanup
│   ├── models/                      # Mongoose schemas
│   │   ├── AdminAnalytics.js
│   │   ├── Assignment.js
│   │   ├── Complaint.js
│   │   ├── ComplaintDraft.js
│   │   ├── ComplaintMessage.js
│   │   ├── EscalationConfig.js
│   │   ├── EscalationLog.js
│   │   ├── Evidence.js
│   │   ├── Faq.js
│   │   ├── Notification.js
│   │   ├── OfficerApprovalLog.js
│   │   ├── OtpVerification.js
│   │   ├── Reminder.js
│   │   ├── Session.js
│   │   ├── SupportTicket.js
│   │   ├── User.js
│   │   └── UserAnalytics.js
│   ├── routes/                      # Express routers
│   ├── scripts/                     # Database maintenance scripts
│   │   ├── ensureIndexes.js         # Creates database indexes
│   │   ├── syncValidators.js        # Updates MongoDB Atlas JSON validators
│   │   └── load-test/               # Performance testing scripts
│   ├── uploads/                     # Directory for uploaded evidence files
│   ├── utils/                       # Common utilities
│   │   ├── analyticsStore.js        # Populates cached analytics reports
│   │   ├── escalationEngine.js      # Background SLA evaluation
│   │   ├── memoryCache.js           # In-memory key-value cache
│   │   ├── notify.js                # Dispatches in-app notifications
│   │   ├── otpProvider.js           # Simulation functions for OTP codes
│   │   ├── seedAdmin.js             # Seeds default administrator accounts
│   │   ├── seedFaq.js               # Seeds base support FAQ data
│   │   └── sessionService.js        # Creates, verifies, and revokes login sessions
│   ├── .env.example                 # Template for backend configuration
│   ├── package.json                 # Backend package dependencies and run scripts
│   └── server.js                    # Server bootstrap and database connection
├── src/                             # React application source
│   ├── components/                  # Shared React components
│   │   ├── RoleGuard.jsx            # Dynamic routing access protector
│   │   └── ui/                      # Dashboard UI controls
│   ├── layouts/                     # Admin dashboard shell layouts
│   ├── routes.js                    # Defines views and roles configurations
│   ├── services/                    # Frontend HTTP API client
│   │   └── api.js                   # central apiFetch configuration
│   ├── utils/                       # Frontend helper utilities
│   │   ├── auth.js                  # Login/session helpers
│   │   └── exporters.js             # CSV exporters and PDF printing functions
│   └── views/                       # React view components
│       ├── admin/                   # Admin, Officer, and shared view workspaces
│       ├── auth/                    # Registration and sign-in view containers
│       └── public/                  # Static information pages and status checkers
├── tailwind.config.js               # Tailwind design system configurations
├── package.json                     # Shared frontend configurations
└── README.md                        # Application documentation
```

---

## Setup & Installation

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account with an active cluster connection.

### Installation Steps

1.  **Clone the Repository** and navigate to the root directory.
2.  **Install Root Dependencies**:
    ```bash
    npm install
    ```
3.  **Install Backend Dependencies**:
    ```bash
    cd backend
    npm install
    ```
4.  **Configure Environment Variables**:
    Create a `.env` file in the `backend/` directory, using the values in `backend/.env.example` as a template:
    ```ini
    PORT=5000
    MONGO_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/cybercrime?retryWrites=true&w=majority
    JWT_SECRET=super_secure_jwt_passphrase_here
    JWT_EXPIRES_IN=7d
    CORS_ORIGIN=http://localhost:3000
    OFFICER_ENROLLMENT_TOKEN=fia_agent_enrollment_verification_key
    MAX_FILE_SIZE_MB=100
    MAX_TOTAL_UPLOAD_MB=1024
    MAX_FILES_PER_REQUEST=10
    RATE_LIMIT_WINDOW_MS=60000
    RATE_LIMIT_MAX=300
    RATE_LIMIT_AUTH_MAX=20
    MONGO_MAX_POOL_SIZE=50
    MONGO_MIN_POOL_SIZE=5
    SESSION_COOKIE_NAME=ccrs_session
    SESSION_COOKIE_SECURE=false
    SESSION_MAX_AGE_MS=604800000
    ESCALATION_INTERVAL_MIN=15
    DEFAULT_ADMIN_EMAIL=admin@cybercrime.local
    DEFAULT_ADMIN_PASSWORD=AdminPassword123!
    ```

5.  **Initialize Database Schemas & Seed Data**:
    Run these scripts from the `backend/` directory:
    ```bash
    # Sync JSON validator schemas with Atlas collections
    npm run sync:validators

    # Apply database indexes to speed up query execution
    npm run ensure:indexes
    ```

6.  **Start the Backend API Server**:
    *   **Production mode**:
        ```bash
        npm start
        ```
    *   **Development mode** (runs with nodemon):
        ```bash
        npm run dev
        ```
    The server will startup on the configured `PORT` (default is `5000`). It will automatically seed the database with the default Admin account (`admin@cybercrime.local` / `AdminPassword123!`) and default FAQ entries.

7.  **Start the React Frontend**:
    Open a new terminal window at the root directory of the project:
    ```bash
    npm start
    ```
    The React application will launch at `http://localhost:3000`.

---

## Troubleshooting & Maintenance

| Problem | Potential Root Cause | Diagnostic Steps & Solution |
| :--- | :--- | :--- |
| **CORS Errors in Browser Console** | Misconfigured origin validation. | Ensure `CORS_ORIGIN` in `backend/.env` matches the frontend address (`http://localhost:3000`). |
| **401 Unauthorized after Login** | Missing cookies or invalid signature. | Check that the browser is accepting the `ccrs_session` cookie. Verify that `JWT_SECRET` matches on server restarts. |
| **Database connection timeouts** | Blocked IP addresses or network limits. | Whitelist the server's IP address (or `0.0.0.0/0` for development) in the MongoDB Atlas dashboard. |
| **Multer Uploads failing with 413** | File size exceeds limits. | Check `MAX_FILE_SIZE_MB` and `MAX_TOTAL_UPLOAD_MB` settings in `backend/.env`. |
| **403 Forbidden for Officers** | Officer account is pending approval. | An Admin must approve the investigator registration request using the Officer Requests dashboard. |

---

## Production Deployment Notes

When deploying to production, apply these configurations:

1.  **Environment Configuration**:
    Set `NODE_ENV=production` and `SESSION_COOKIE_SECURE=true`. The secure cookie flag requires that the application be served over HTTPS.
2.  **Origin Restriction**:
    Restrict the `CORS_ORIGIN` configuration to the specific domain name of the hosted frontend application.
3.  **Reverse Proxy Setup**:
    When running behind a reverse proxy like Nginx or AWS ALB, set `TRUST_PROXY=true` in the environment variables to ensure rate limiting correctly identifies client IP addresses.
4.  **Persistent Storage Integration**:
    The system currently stores uploaded files on the local filesystem. For multi-instance deployments behind a load balancer, replace the local directory storage with a shared volume or cloud storage integration (such as AWS S3).
5.  **Shared Session Cache**:
    If scaling horizontally, transition the system from local memory caching to a distributed cache store like Redis to share session configurations across all active instances.
