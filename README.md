# FRMS - Facility Request Management System

![FRMS Logo](./docs/logo.txt)

**A centralized system for the Punjab Tianjin University of Technology (PTUT) community to track, manage, and resolve facility maintenance requests.**

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Setup Instructions](#setup-instructions)
5. [Environment Variables](#environment-variables)
6. [Running Locally](#running-locally)
7. [API Endpoints](#api-endpoints)
8. [User Dashboards](#user-dashboards)
9. [Mock Data & Offline Testing](#mock-data--offline-testing)
10. [Database Schema](#database-schema)
11. [Troubleshooting](#troubleshooting)
12. [Known Limitations](#known-limitations)
13. [Future Work](#future-work)

---

## Overview

FRMS is a full-stack web application designed to streamline the process of submitting, approving, and resolving facility maintenance requests at PTUT. The system provides role-based dashboards for four user types:

- **Requestor**: Submit and track facility issues.
- **Department Head**: Approve or reject pending requests from their department.
- **Admin**: Manage vendors, dispatch tickets, create users, and view audit logs.
- **Vendor**: Accept assigned work orders and mark tasks as complete.

---

## Architecture

### High-Level System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRMS Architecture                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐               │
│  │  React Frontend  │◄────────┤   JWT Auth       │               │
│  │  (Vite + Tailwind)         │   (2hr tokens)   │               │
│  └────────┬─────────┘         └──────────────────┘               │
│           │                                                       │
│           │ HTTP/REST                                            │
│           ▼                                                       │
│  ┌──────────────────────────────────────────────────┐            │
│  │     .NET 10 API (Entity Framework Core)          │            │
│  │  ┌─────────────────────────────────────────┐    │            │
│  │  │ Controllers:                            │    │            │
│  │  │ • AuthController      (login/register)  │    │            │
│  │  │ • FacilityRequests    (tickets/CRUD)    │    │            │
│  │  │ • VendorsController   (vendor mgmt)     │    │            │
│  │  │ • AdminController     (users/logs)      │    │            │
│  │  └─────────────────────────────────────────┘    │            │
│  │  ┌─────────────────────────────────────────┐    │            │
│  │  │ Models:                                 │    │            │
│  │  │ • User, Department, Vendor              │    │            │
│  │  │ • FacilityRequest, RequestLog           │    │            │
│  │  └─────────────────────────────────────────┘    │            │
│  └─────────────────────┬──────────────────────────┘             │
│                        │                                          │
│                        ▼                                          │
│  ┌──────────────────────────────────────────────────┐            │
│  │        MySQL Database (ApplicationDbContext)     │            │
│  │  ┌──────────────────────────────────────────┐   │            │
│  │  │ Tables: Users, Departments, Vendors      │   │            │
│  │  │ FacilityRequests, RequestLogs            │   │            │
│  │  └──────────────────────────────────────────┘   │            │
│  └──────────────────────────────────────────────────┘            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

Role-Based Routing:
  Admin     → AdminDashboardEnhanced    (dispatch, vendors, users, logs)
  DeptHead  → DepartmentHeadDashboard   (approve/reject tickets)
  Requester → RequestorDashboardEnhanced (create, track tickets)
  Vendor    → VendorDashboard           (assigned tasks)
```

### Data Flow: Creating a Ticket

```
1. Requestor submits issue via TicketSubmissionModal
   ↓
2. Frontend calls ticketService.createTicket()
   ↓
3. API: POST /api/tickets (FacilityRequestsController)
   ↓
4. Database saves with Status="Pending"
   ↓
5. RequestLog entry created ("Ticket created")
   ↓
6. Email notification sent to Department Head
   ↓
7. DeptHead sees pending ticket on Dashboard
   ↓
8. DeptHead clicks Approve/Reject
   ↓
9. API: PUT /api/tickets/{id}/status updates Status
   ↓
10. Admin sees Approved tickets in Dispatch Center
    ↓
11. Admin selects Vendor + clicks Dispatch
    ↓
12. API: PUT /api/tickets/{id}/assign-vendor assigns to Vendor
    ↓
13. Vendor sees task in "Active Work Orders"
    ↓
14. Vendor submits resolution notes → Status="Completed"
    ↓
15. Requestor sees Status="Resolved" on their Dashboard
```

---

## Tech Stack

### Frontend

- **React 18** – UI library
- **Vite** – Build tool (dev server, prod bundling)
- **Tailwind CSS** – Utility-first styling
- **Lucide React** – Icon library
- **Framer Motion** – Animations & transitions
- **Axios** – HTTP client
- **React Router** – Client-side routing

### Backend

- **.NET 10** – Application framework
- **Entity Framework Core** – ORM
- **MySQL** – Relational database
- **JWT (JSON Web Tokens)** – Authentication
- **BCrypt** – Password hashing

### Environment & Tools

- **Node.js 18+** – Frontend runtime & package manager
- **.NET SDK 10** – Backend runtime & tooling
- **MySQL Server 8.0+** – Database
- **Git** – Version control

---

## Setup Instructions

### Prerequisites

1. **Node.js** (v18+): [Download](https://nodejs.org/)
2. **.NET SDK** (v10+): [Download](https://dotnet.microsoft.com/download)
3. **MySQL** (v8.0+): [Download](https://dev.mysql.com/downloads/mysql/)
4. **Git**: [Download](https://git-scm.com/)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd frms
```

### Step 2: Backend Setup

#### 2a. Create MySQL Database

```sql
-- Open MySQL CLI or MySQL Workbench and run:
CREATE DATABASE FRMS_DB;
USE FRMS_DB;
```

#### 2b. Configure Backend Connection String

Edit `FRMS_API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=127.0.0.1;Port=3306;Database=FRMS_DB;Uid=root;Pwd=YOUR_MYSQL_PASSWORD;AllowPublicKeyRetrieval=True;"
  },
  "Jwt": {
    "Key": "your-secret-key-at-least-32-characters-long",
    "Issuer": "ptut-frms",
    "Audience": "ptut-frms-app"
  }
}
```

#### 2c. Run Database Migrations

```bash
cd FRMS_API
dotnet ef database update
# This applies all migrations and creates tables
```

#### 2d. Seed Initial Data (Optional)

Create seed data by inserting into the database:

```sql
-- Seed Departments
INSERT INTO Departments (Name, HeadUserID) VALUES
('IT Department', NULL),
('Estate Management', NULL),
('Planning and Development', NULL),
('Academic Department', NULL),
('Quality (QAC) Department', NULL),
('Exam Department', NULL);

-- Seed Admin User
-- Email: admin@ptut.edu.pk, Password: Admin@123
INSERT INTO Users (FullName, Email, PasswordHash, Role, DepartmentID, VendorID) VALUES
('System Admin', 'admin@ptut.edu.pk', '$2a$11$...', 'Admin', NULL, NULL);
-- (Generate hash using BCrypt: BCrypt.HashPassword("Admin@123"))
```

### Step 3: Frontend Setup

```bash
cd frms-frontend

# Install dependencies
npm install

# Create .env.local file
cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:5257/api
VITE_USE_MOCK=false
EOF
```

---

## Environment Variables

### Frontend (`.env.local`)

| Variable        | Default                     | Description                             |
| --------------- | --------------------------- | --------------------------------------- |
| `VITE_API_URL`  | `http://localhost:5257/api` | Backend API base URL                    |
| `VITE_USE_MOCK` | `false`                     | Enable mock-data mode (set to `"true"`) |

### Backend (`appsettings.json`)

| Variable                              | Description                               |
| ------------------------------------- | ----------------------------------------- |
| `ConnectionStrings:DefaultConnection` | MySQL connection string                   |
| `Jwt:Key`                             | Secret key for JWT signing (min 32 chars) |
| `Jwt:Issuer`                          | JWT issuer name                           |
| `Jwt:Audience`                        | JWT audience name                         |

---

## Running Locally

### Start Backend (Terminal 1)

```bash
cd FRMS_API
dotnet run
# API runs on http://localhost:5257
# Swagger UI: http://localhost:5257/swagger
```

### Start Frontend (Terminal 2)

```bash
cd frms-frontend
npm run dev
# Frontend runs on http://localhost:5173
# Open http://localhost:5173 in browser
```

### Test Login Credentials

**Admin**:

- Email: `admin@ptut.edu.pk`
- Password: `Admin@123`

**Department Head**:

- Email: `head@ptut.edu.pk`
- Password: `Head@123`

**Requestor** (Register via signup):

- Navigate to `/login?allowSignup=1&mode=signup`
- Fill registration form

**Vendor**:

- Created by Admin in User Management tab

---

## API Endpoints

### Authentication

| Method | Endpoint                       | Description                  | Auth |
| ------ | ------------------------------ | ---------------------------- | ---- |
| `POST` | `/auth/login`                  | Login & get JWT token        | None |
| `POST` | `/auth/register`               | Register new Requestor       | None |
| `POST` | `/auth/request-password-reset` | Request password reset email | None |

### Tickets (FacilityRequests)

| Method | Endpoint                       | Description                             | Auth      |
| ------ | ------------------------------ | --------------------------------------- | --------- |
| `GET`  | `/tickets?status=Approved`     | Get approved tickets (Admin)            | Admin     |
| `GET`  | `/tickets/my`                  | Get my tickets (Requestor)              | Requester |
| `GET`  | `/tickets/department/{deptId}` | Get dept tickets (Head)                 | DeptHead  |
| `GET`  | `/tickets/my-assigned`         | Get assigned tickets (Vendor)           | Vendor    |
| `POST` | `/tickets`                     | Create ticket (JSON or multipart)       | Requester |
| `PUT`  | `/tickets/{id}/status`         | Update status (DeptHead approve/reject) | DeptHead  |
| `PUT`  | `/tickets/{id}/assign-vendor`  | Assign vendor (Admin dispatch)          | Admin     |
| `PUT`  | `/tickets/{id}/complete`       | Mark complete w/ notes (Vendor)         | Vendor    |

### Vendors

| Method | Endpoint                    | Description        | Auth  |
| ------ | --------------------------- | ------------------ | ----- |
| `GET`  | `/vendors`                  | List all vendors   | Admin |
| `POST` | `/vendors`                  | Create vendor      | Admin |
| `POST` | `/vendors/{vendorId}/users` | Create vendor user | Admin |

### Admin

| Method | Endpoint            | Description                  | Auth  |
| ------ | ------------------- | ---------------------------- | ----- |
| `GET`  | `/admin/users`      | List all users               | Admin |
| `POST` | `/admin/users`      | Create user (role-based)     | Admin |
| `GET`  | `/admin/audit-logs` | Get request logs (paginated) | Admin |
| `GET`  | `/admin/stats`      | Get KPI stats                | Admin |

---

## User Dashboards

### 1. Requestor Dashboard

**URL**: `/dashboard` (auto-routed if role="Requester")

**Features**:

- ✓ View all submitted tickets in a list
- ✓ Search tickets by ID, location, status
- ✓ Filter by status (All, Pending, In Progress, Resolved)
- ✓ Click ticket to view full details in modal
- ✓ Track status in real-time (Pending → Approved → In Progress → Resolved)
- ✓ "Create Ticket" button opens submission form (title, description, location, department, photo)
- ✓ KPI stats: Total Submitted, Active/Pending, Resolved Issues
- ✓ Notifications badge showing pending count

**Key Interactions**:

```
1. Click "Create Ticket" → Form modal opens
2. Fill form + optional photo upload
3. Submit → Ticket created with Status="Pending"
4. Ticket appears in list immediately (if no server delay)
5. Department Head receives email notification
6. Ticket updates in real-time as Head approves/Admin dispatches/Vendor completes
```

---

### 2. Department Head Dashboard

**URL**: `/dashboard` (auto-routed if role="DeptHead")

**Features**:

- ✓ View pending requests from their department
- ✓ Filter by status (Pending, Approved, Resolved, etc.)
- ✓ Approve button (green checkmark) → Status becomes "Approved"
- ✓ Reject button (red X) → Status becomes "Rejected"
- ✓ View requester info, issue details, attached photos
- ✓ KPI stats: Pending Approvals, Approved (Awaiting Fix), Resolved This Week, Urgent Requests
- ✓ Notifications badge showing pending count

**Key Interactions**:

```
1. Login with DeptHead credentials
2. Dashboard loads department tickets
3. Review "Pending Approvals" tab
4. Click Approve → Ticket moves to "Approved" state
5. Admin sees it in Dispatch Center
6. On rejection, ticket status becomes "Rejected" (permanent)
```

---

### 3. Admin Dashboard (Enhanced)

**URL**: `/dashboard` (auto-routed if role="Admin")

**Tabs**:

#### Tab 1: System Overview

- KPI Cards: Unassigned Tickets, Active Vendors, In Progress, System Uptime
- Quick status at a glance

#### Tab 2: Ticket Dispatch

- Table of all **approved** tickets (Status="Approved")
- Search by ticket ID, department, location
- Vendor dropdown selector per ticket
- "Dispatch" button → assigns ticket to selected vendor (Status → "In Progress")
- Feedback toast: "Ticket dispatched successfully"

#### Tab 3: Vendor Directory

- List of all registered vendors (company name, contact person, phone, email)
- "+ Add Vendor" button opens modal
- Modal: Company name (required), contact person, phone, email
- Submit → Vendor created; automatically appears in dropdown on Dispatch tab

#### Tab 4: User Management

- Table of all users (ID, Name, Email, Role, Department/Vendor)
- "+ Create Department Head" button opens form
- Form fields: Full Name, Email, Password, Department dropdown
- Submit → DeptHead user created; can immediately log in
- (Vendor creation is automatic when adding vendor)

#### Tab 5: Audit Logs

- Paginated RequestLog table showing all ticket state changes
- Columns: LogID, User, Old Status, New Status, Changed Date, Comments
- Sorted by most recent first
- Useful for compliance & debugging

#### Notifications Panel

- Live badge showing count of pending/unassigned tickets
- Refreshes every 15 seconds

**Key Interactions**:

```
1. Login with Admin credentials
2. Dashboard loads with Overview tab
3. Navigate to Dispatch tab
4. Select vendor for each approved ticket
5. Click Dispatch → Vendor receives work order
6. Navigate to User Management
7. Create DeptHead: Fill form, submit
8. View Audit Logs to confirm changes
```

---

### 4. Vendor Dashboard

**URL**: `/dashboard` (auto-routed if role="Vendor")

**Tabs**:

#### Tab 1: Active Work Orders

- List of assigned tickets (Status="In Progress")
- Ticket title, location, issue photo, department
- "Resolve Task" button → expands inline form
- Form: Detailed resolution notes (required, min 10 chars)
- Submit → Mark complete (Status → "Completed"), save notes
- Notification: "Task marked complete"

#### Tab 2: Completed Tasks

- Historical list of finished work orders (Status="Completed")
- View-only; shows resolution notes
- KPI stats: Pending Repairs, Completed Today, Avg Resolution Time

**Key Interactions**:

```
1. Login with Vendor credentials
2. Dashboard loads Active Work Orders
3. Review assigned ticket details
4. Click "Resolve Task"
5. Enter detailed resolution notes
6. Submit → Task moves to Completed
7. Requestor sees Status="Resolved" immediately
```

---

## Mock Data & Offline Testing

### Enable Mock Mode

Set environment variable in frontend `.env.local`:

```env
VITE_USE_MOCK=true
```

### What Happens

When `VITE_USE_MOCK=true`:

1. **ticketService.js** intercepts all API calls
2. Returns mock data instead of calling backend
3. Simulates 250–400ms latency (realistic network delay)
4. Maintains in-memory mock database (resets on page refresh)
5. Mock CRUD operations: create ticket → appears in list, approve → status updates, etc.

### Mock Data

**Sample Vendors**:

- Campus Repairs Co. (ID: 1)
- BrightFix Ltd. (ID: 2)

**Sample Tickets**:

- REQ-1001: Broken water tap in Block A (Status: Pending)
- REQ-1002: Aircon not cooling in Library (Status: Approved)
- REQ-1003: Flickering lights in Corridor (Status: Completed)

### Use Cases

**Scenario 1: Local Development (No Backend)**

```bash
# Terminal: Start frontend only
npm run dev

# In browser, test all dashboards with mock data
# No API needed
```

**Scenario 2: Integration Testing**

```bash
# Set VITE_USE_MOCK=true
# Test UI interactions & state management
# Verify role-based routing
# Check responsive design
```

**Scenario 3: Production (Real Backend)**

```bash
# Remove VITE_USE_MOCK or set to "false"
# Backend API must be running
# All data comes from database
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE Users (
  UserID INT PRIMARY KEY AUTO_INCREMENT,
  FullName VARCHAR(100) NOT NULL,
  Email VARCHAR(150) NOT NULL UNIQUE,
  PasswordHash VARCHAR(255) NOT NULL,
  Role VARCHAR(50) NOT NULL, -- 'Requester', 'DeptHead', 'Admin', 'Vendor'
  DepartmentID INT,
  VendorID INT,
  FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID),
  FOREIGN KEY (VendorID) REFERENCES Vendors(VendorID)
);
```

### Departments Table

```sql
CREATE TABLE Departments (
  DepartmentID INT PRIMARY KEY AUTO_INCREMENT,
  Name VARCHAR(100) NOT NULL UNIQUE,
  HeadUserID INT,
  FOREIGN KEY (HeadUserID) REFERENCES Users(UserID)
);
```

### Vendors Table

```sql
CREATE TABLE Vendors (
  VendorID INT PRIMARY KEY AUTO_INCREMENT,
  CompanyName VARCHAR(150) NOT NULL,
  ContactPerson VARCHAR(100),
  PhoneNumber VARCHAR(50),
  Email VARCHAR(150)
);
```

### FacilityRequests Table

```sql
CREATE TABLE FacilityRequests (
  RequestID INT PRIMARY KEY AUTO_INCREMENT,
  Title VARCHAR(150) NOT NULL,
  Description TEXT NOT NULL,
  Location VARCHAR(200) NOT NULL,
  IssueImageUrl VARCHAR(500),
  Status VARCHAR(50) DEFAULT 'Pending',
  CreatedAt DATETIME DEFAULT NOW(),
  CompletedAt DATETIME,
  ResolutionNotes VARCHAR(2000),
  DepartmentID INT NOT NULL,
  RequesterID INT NOT NULL,
  AssignedWorkerID INT,
  AssignedVendorID INT,
  FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID),
  FOREIGN KEY (RequesterID) REFERENCES Users(UserID),
  FOREIGN KEY (AssignedWorkerID) REFERENCES Users(UserID),
  FOREIGN KEY (AssignedVendorID) REFERENCES Vendors(VendorID)
);
```

### RequestLogs Table (Audit Trail)

```sql
CREATE TABLE RequestLogs (
  LogID INT PRIMARY KEY AUTO_INCREMENT,
  RequestID INT NOT NULL,
  ChangedByUserID INT NOT NULL,
  OldStatus VARCHAR(50),
  NewStatus VARCHAR(50),
  ChangedDate DATETIME DEFAULT NOW(),
  Comments VARCHAR(255),
  FOREIGN KEY (RequestID) REFERENCES FacilityRequests(RequestID),
  FOREIGN KEY (ChangedByUserID) REFERENCES Users(UserID)
);
```

---

## Troubleshooting

### Issue: "Cannot connect to API" (Frontend)

**Symptoms**: Frontend loads, but buttons don't work; console shows network errors.

**Solutions**:

1. Check backend is running: `http://localhost:5257/swagger` should load
2. Verify `VITE_API_URL` in `.env.local` matches backend port
3. Check CORS headers in backend (should allow `http://localhost:5173`)
4. Alternatively, enable mock mode: `VITE_USE_MOCK=true`

### Issue: Database Connection Fails

**Symptoms**: Backend crashes with "Cannot connect to MySQL."

**Solutions**:

1. Verify MySQL is running: `mysql -u root -p` (should prompt for password)
2. Check connection string in `appsettings.json` (correct host, port, password)
3. Ensure database `FRMS_DB` exists: `mysql -u root -p -e "SHOW DATABASES;"`
4. Run migrations: `dotnet ef database update`

### Issue: Login Fails / Invalid Credentials

**Symptoms**: "Invalid email or password" error on every login attempt.

**Solutions**:

1. Verify user exists in database: `SELECT * FROM Users WHERE Email='admin@ptut.edu.pk';`
2. Confirm password hash matches. Test BCrypt verification:
   ```csharp
   var hash = "$2a$11$..."; // from DB
   bool isValid = BCrypt.Net.BCrypt.Verify("password", hash);
   ```
3. Re-seed test user if needed

### Issue: Mock Data Not Working

**Symptoms**: With `VITE_USE_MOCK=true`, frontend still tries to call backend.

**Solutions**:

1. Check `.env.local` value: `VITE_USE_MOCK=true` (string "true", not boolean)
2. Restart Vite dev server: `npm run dev`
3. Check browser console for parsing errors in `ticketService.js`

### Issue: Migrations Failed

**Symptoms**: `dotnet ef database update` throws errors.

**Solutions**:

1. Drop & recreate database (for dev only):
   ```bash
   dotnet ef database drop --force
   dotnet ef database update
   ```
2. Ensure MySQL is running & credentials are correct
3. Check for missing `[migration].cs` files in `Migrations/` folder

### Issue: JWT Token Expired

**Symptoms**: After 2 hours, "401 Unauthorized" responses.

**Solution**: Re-login to get new token. Token TTL is hardcoded to 2 hours in AuthController.cs; adjust if needed:

```csharp
Expires = DateTime.UtcNow.AddHours(8) // Change 8 to desired hours
```

---

## Known Limitations

1. **Password Reset**: Frontend form exists; backend password-reset endpoint not yet implemented.
   - **Workaround**: Admin can manually reset password in User Management tab.

2. **Email Notifications**: System logs audit trail but doesn't send emails to users.
   - **Workaround**: Admin checks Audit Logs manually; users refresh dashboards periodically.

3. **File Uploads**: Photos are stored in `/Uploads/tickets/` on server filesystem; not cloud-backed.
   - **Workaround**: For production, integrate AWS S3 or Azure Blob Storage.

4. **Real-Time Updates**: Dashboard data refreshes every 15 seconds (polling); no WebSockets.
   - **Workaround**: Acceptable for small teams; scale with SignalR if needed.

5. **Mobile App**: Only web UI provided; no native iOS/Android apps.

6. **Offline Mode**: Mock data available; real offline-first sync not implemented.

7. **Localization**: System is English-only; no multi-language support.

---

## Future Work

### High Priority

- [ ] Implement backend password-reset endpoint with email verification
- [ ] Add real email notifications for ticket status changes
- [ ] Implement role-based access control (RBAC) tests & security audit
- [ ] Add pagination to all list views (tickets, users, logs)
- [ ] Optimize database queries (add indexes, eager loading)

### Medium Priority

- [ ] Migrate file uploads to cloud storage (AWS S3 / Azure Blob)
- [ ] Implement WebSocket real-time updates (SignalR) instead of polling
- [ ] Add advanced search & filtering (date range, priority, SLA)
- [ ] Create admin reporting dashboard (charts, export CSV)
- [ ] Add two-factor authentication (2FA)

### Low Priority

- [ ] Build mobile app (React Native or Flutter)
- [ ] Add multi-language support (i18n)
- [ ] Implement offline-first sync (Service Workers)
- [ ] Create public API documentation (OpenAPI/Swagger)
- [ ] Add performance monitoring & analytics

---

## Support & Contact

For issues, feature requests, or contributions:

1. Open an issue on the repository
2. Contact the development team: `dev@ptut.edu.pk`
3. Check internal wiki: [Link to internal docs]

---

## License

© 2025 Punjab Tianjin University of Technology. All rights reserved.

---

**Last Updated**: April 2026  
**Maintained By**: FRMS Development Team  
**Version**: 1.0.0
