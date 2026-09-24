# Export Management System

A full-stack web platform for managing the export trade lifecycle, from a buyer's first order request through quoting, trade documentation, invoicing, shipment tracking, and after-sale claims.

It has three role-based portals: **Client (Buyer)**, **Export Manager**, and **Admin**. They share a single Spring Boot REST API and a React single-page frontend.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
  - [Authentication & Security](#authentication--security)
  - [Client Portal](#client-portal)
  - [Export Manager Portal](#export-manager-portal)
  - [Admin Portal](#admin-portal)
  - [Bulk Processing (Spring Batch)](#bulk-processing-spring-batch)
  - [Global Search](#global-search)
  - [Notifications, Email & Scheduling](#notifications-email--scheduling)
  - [Reporting](#reporting)
- [Order Lifecycle](#order-lifecycle)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Overview](#api-overview)
- [Testing](#testing)
- [Future Scope](#future-scope)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Java 17, Spring Boot 3.4 (Web, Data JPA, Security, Validation, Batch, Mail) |
| **Auth** | JWT (jjwt 0.11.5) access tokens + rotating refresh tokens, BCrypt password hashing |
| **Database** | PostgreSQL (with the `pg_trgm` extension for fuzzy search); H2 for tests |
| **Documents** | Apache POI 5.2 (Excel read/write), OpenPDF 2.2 (PDF generation) |
| **Frontend** | React 19, React Router 7, Vite 8, lucide-react icons |
| **Transport** | HTTPS on both backend (port `8443`, PKCS12 keystore) and frontend dev server |

---

## Architecture

```
┌──────────────────────────┐        HTTPS / JSON + JWT        ┌──────────────────────────────┐
│  React SPA (Vite)        │ ───────────────────────────────▶ │  Spring Boot REST API        │
│  • Client portal         │                                  │  • Controllers (role-gated)  │
│  • Export Manager portal │ ◀─────────────────────────────── │  • Services / Spring Batch   │
│  • Admin portal          │     PDFs, Excel, file streams    │  • Scheduler, Async e-mail   │
└──────────────────────────┘                                  └──────────────┬───────────────┘
                                                                             │
                                               ┌─────────────────────────────┼──────────────────────┐
                                               ▼                             ▼                      ▼
                                     PostgreSQL (JPA, views,        Local file storage        SMTP (Gmail)
                                     trigram GIN indexes)           uploads/trade-documents   notifications
                                                                    uploads/import-staging
```

- **Layered backend:** `controller → service (interface + impl) → repository → entity`, with DTOs at the API boundary and a `GlobalExceptionHandler` that turns errors into consistent JSON responses.
- **Stateless security:** each request carries a short-lived JWT. Role checks use `@PreAuthorize` at the class level, and fine-grained permissions (for example `VIEW_SHIPMENTS`) are checked at the method level.
- **File storage is separate from the database:** uploaded files are written to a configurable directory on disk, and only their paths and metadata go in the database. Path-traversal attempts are rejected.
- **Event-driven side effects:** creating an order publishes an `OrderCreatedEvent`, which a listener handles by sending email. Emails are sent `@Async` so API requests never wait on them.

---

## Features

### Authentication & Security

- Registration and login for three roles: `CLIENT`, `EXPORT_MANAGER`, and `ADMIN`.
- **JWT access tokens** that expire after 15 minutes, plus **refresh token rotation**. The `/refresh` endpoint issues a new pair, and `/logout` revokes the refresh token.
- **Role-based access control:** every API area is restricted to its role.
- **Permission-based access control:** roles carry a set of permissions (`MANAGE_ORDERS`, `MANAGE_SHIPMENTS`, `MANAGE_DOCUMENTS`, `MANAGE_INVOICES`, `ISSUE_DOWNLOAD_TOKENS`, `VIEW_REPORTS`, `VIEW_SHIPMENTS`), which are enforced on both backend and frontend routes.
- Deactivated accounts are blocked at login, and admins cannot deactivate their own account.
- The whole stack runs over HTTPS, with CORS restricted to the frontend origins.
- Ownership checks on client data: requests for another buyer's orders, invoices, or documents return the same "not found" response as missing resources, so resource IDs cannot be probed.

### Client Portal

- **Dashboard** with a summary of the client's orders, shipments, invoices, and notifications.
- **Order requests:** the client submits a product, quantity, and destination. The Export Manager then sends a quote, which the client can **accept or reject**.
- **Shipment tracking** (requires the `VIEW_SHIPMENTS` permission): carrier, tracking number, ports, status, and ETA.
- **Invoices:** view the client's invoices and **download them as PDFs**.
- **Secure document access:** the client enters a **download token** to unlock their order's trade documents, then downloads them individually. Tokens are validated for status and expiry, and a token past its expiry date is marked `EXPIRED` the next time it is used.
- **Claims:** the client files a claim against an order with a message, the documents it concerns, and an optional **proof attachment**, then tracks it until it is resolved.
- **In-app notifications** with read/unread state.

### Export Manager Portal

- **Order pipeline:** review incoming requests, **send a quote** (price and timeline) or **decline** with a reason, and move accepted orders through the stages (`CREATED → APPROVED → DOCUMENTS → PAID → SHIPMENT → COMPLETED`). An order cannot be processed until the client has accepted its quote.
- **Trade document management:** upload single files or batches for each order, tagged by type: Commercial Invoice, Packing List, Bill of Lading, Certificate of Origin, Letter of Credit, or Other.
- **Token Center:** issue download tokens with a chosen expiry, list them, and revoke them. Issuing a token automatically:
  - notifies the buyer in the app,
  - creates or issues the invoice for the order, and
  - **emails the buyer the invoice PDF along with the token**.
- **Shipments:** create shipment records and view them by order.
- **Invoices:** view all invoices or filter them by order.
- **Deadline notifications:** receive alerts when an admin sets a document upload deadline, and a reminder when less than 24 hours remain.
- **Reports:** download an Excel export report and a PDF export summary.

### Admin Portal

- **Dashboard** with system-wide totals.
- **User management:** search and filter users by role, and activate or deactivate accounts.
- **Audit logs:** a paginated log of important actions (logins, token issuance, claim decisions, reminders sent by the system, and so on).
- **Claims review:**
  - view claim details and download the proof attachment,
  - **resolve** a claim with a response, optionally marking the order's documents as **government-verified**,
  - set a **document upload deadline** and the list of required documents. This is only allowed for accepted, in-progress orders that are government-verified, and it notifies all Export Managers,
  - or **reject** the claim with a reason. In both cases the client is notified.
- **System reports:** filterable report data, a summary, and a **PDF export**.

### Bulk Processing (Spring Batch)

Two fault-tolerant, chunk-oriented batch jobs that can handle manifests with tens of thousands of rows:

| Job | Input | What it does |
|---|---|---|
| **Bulk Document Import** | `manifest.xlsx` (`orderCode`, `documentType`, `fileName`) + `documents.zip` | Matches each manifest row to a file in the ZIP and attaches it to the order. Commits every 200 rows. |
| **Bulk Token Generation** | `manifest.xlsx` (`orderCode`, `buyerEmail`, `expiryDays`) | Issues download tokens in bulk (default expiry is 7 days). Commits every 20 rows. |

- Manifest columns are **matched by header name**, so column order does not matter, and blank rows are skipped.
- **A row that fails is skipped rather than failing the whole job.** Each failure is saved with its spreadsheet row number and the reason, so the user can see exactly which rows to fix.
- REST endpoints to **launch** a job, **poll its status**, **list row errors page by page**, and **retry** a failed execution.
- Uploaded files are held in a per-job staging directory while the job runs.

### Global Search

- One search bar that searches across orders, shipments, and invoices. The admin portal can also search users.
- Results are **limited to what the caller's role can see**: clients only find their own records.
- Backed by PostgreSQL **`pg_trgm` GIN indexes**, so fast partial and fuzzy matching (`ILIKE '%term%'`) works on order codes, buyer names and emails, products, destinations, tracking numbers, carriers, and invoice numbers.
- Each result type returns a small number of hits and very short queries are rejected, which keeps the dropdown fast and useful. The frontend also debounces input.

### Notifications, Email & Scheduling

- Typed in-app notifications (`QUOTE`, `ACCEPTANCE`, `REJECTION`, `DOCUMENT`, `CLAIM`, `DEADLINE`). The frontend uses the type to choose an icon.
- Emails are sent over SMTP: new order alerts, invoices with the PDF attached, deadline notices, and messages from the public Contact page.
- **`DeadlineReminderScheduler`** runs every 30 minutes (configurable) and reminds Export Managers about document deadlines less than 24 hours away. It sends only one reminder per deadline.

### Reporting

- The database views `export_report_view` and `admin_report_view` join orders, invoices, shipments, and users in one place for reporting queries.
- An **Excel report** (Apache POI) for Export Managers.
- **PDF reports** (OpenPDF): invoice PDFs, the export summary, and the admin system report.

### Public Pages

- Login, Register, About, and a **Contact Us** form whose submissions are emailed to a configured inbox.

---

## Order Lifecycle

```
Client                          Export Manager                         Admin
──────                          ──────────────                         ─────
Request order ──▶ PENDING
                                Quote ──▶ QUOTED   (or Decline ──▶ REJECTED)
Accept ──▶ ACCEPTED
(or Reject ──▶ REJECTED)
                                Advance stage:
                                CREATED → APPROVED → DOCUMENTS
                                Upload trade documents
                                Issue download token ──▶ invoice + email to buyer
                                → PAID → SHIPMENT (create shipment) → COMPLETED
Unlock documents with token
Track shipment, view invoices
File claim (+ proof) ─────────────────────────────────────────────────▶ Review claim
                                                                        Resolve / Reject
                                                                        Gov. verification
                                                                        Set doc deadline
                                ◀── Deadline notice + 24h reminder
```

---

## Project Structure

```
new-export/
├── exportsystem/                         # Spring Boot backend
│   ├── pom.xml
│   └── src/main/java/com/example/exportsystem/
│       ├── batch/          # Spring Batch jobs: Excel readers, processors, writers, skip listeners
│       ├── config/         # Async, batch launcher, file storage properties
│       ├── controller/     # REST controllers (auth, client, manager, admin, search, bulk jobs)
│       ├── dto/            # Request/response models grouped by domain
│       ├── entity/         # JPA entities + enums (Order, Claim, DownloadToken, Invoice, ...)
│       ├── event/ listener/# OrderCreatedEvent -> email listener
│       ├── exception/      # GlobalExceptionHandler
│       ├── notification/   # EmailService (async SMTP)
│       ├── pdf/ report/    # OpenPDF services, Excel view
│       ├── repository/     # Spring Data JPA repositories
│       ├── scheduler/      # DeadlineReminderScheduler
│       ├── security/       # JWT filter/service, SecurityConfig, UserDetailsService
│       └── service/        # Service interfaces + impl/
│   └── src/main/resources/
│       ├── application.properties
│       └── schema-postgresql.sql         # pg_trgm indexes + reporting views
├── frontend/                             # React + Vite SPA
│   └── src/
│       ├── api/            # API clients per portal (auth, client, manager, admin, contact)
│       ├── components/     # Layout, Sidebar, TopNavbar, FileUploader, Pagination, TokenCard ...
│       ├── context/        # AuthContext (tokens, current user)
│       ├── pages/          # admin/, exportManager/, client/, and public pages
│       ├── routes/         # ProtectedRoute (portal + permission guard)
│       └── utils/
└── uploads/                              # Runtime file storage (git-ignored)
```

---

## Getting Started

### Prerequisites

- **Java 17+**
- **Node.js 20+** and npm
- **PostgreSQL 14+**, with permission to run `CREATE EXTENSION pg_trgm`
- An SMTP account for email, such as a Gmail App Password

### 1. Database

```sql
CREATE DATABASE export_management;
```

Hibernate creates or updates the tables when the backend starts (`ddl-auto=update`). After that, `schema-postgresql.sql` adds the trigram indexes and reporting views, and Spring Batch creates its own metadata tables.

### 2. Backend

```bash
cd exportsystem
cp src/main/resources/application.properties.example src/main/resources/application.properties
# fill in DB, SMTP and keystore values (see Configuration), and place your own
# PKCS12 keystore at src/main/resources/application.p12, e.g.:
# keytool -genkeypair -alias application -keyalg RSA -keysize 2048 -storetype PKCS12 \
#         -keystore src/main/resources/application.p12 -validity 365
./mvnw spring-boot:run          # Windows: mvnw.cmd spring-boot:run
```

The API starts at **https://localhost:8443/api**. The certificate is self-signed, so open `https://localhost:8443` once in your browser and accept the warning.

### 3. Frontend

```bash
cd frontend
cp .env.example .env            # VITE_API_BASE_URL=https://localhost:8443/api
npm install
npm run dev
```

The app starts at **http://localhost:5173**. During development, `/api` requests are proxied to the backend.

### 4. First use

Register an account and choose its role (Client, Export Manager, or Admin). New Client accounts get the `VIEW_SHIPMENTS` permission by default.

---

## Configuration

Key settings in `exportsystem/src/main/resources/application.properties`:

| Property | Purpose | Default |
|---|---|---|
| `spring.datasource.url / username / password` | PostgreSQL connection | `jdbc:postgresql://localhost:5432/export_management` |
| `server.port`, `server.ssl.*` | HTTPS port and keystore | `8443`, `classpath:application.p12` |
| `spring.mail.*`, `app.mail.from` | SMTP sender | Gmail SMTP on port 587 |
| `app.mail.contact-to` | Inbox that receives Contact Us submissions | — |
| `app.storage.upload-dir` | Where trade documents are stored | `uploads/trade-documents` |
| `app.storage.import-staging-dir` | Staging directory for bulk imports | `uploads/import-staging` |
| `app.scheduling.deadline-reminder.fixed-rate-ms` | How often the deadline reminder runs | `1800000` (30 min) |
| `spring.batch.job.enabled` | Run batch jobs automatically on startup | `false` (jobs are started through the API) |

> **Security note:** do not commit real credentials. For any shared or deployed environment, set the database password, SMTP password, and keystore password through environment variables (for example `SPRING_DATASOURCE_PASSWORD` and `SPRING_MAIL_PASSWORD`).

---

## API Overview

All endpoints are under `/api`. Every endpoint except the public ones requires an `Authorization: Bearer <accessToken>` header.

| Area | Base path | Highlights |
|---|---|---|
| Auth (public) | `/api/auth` | `register`, `login`, `refresh`, `logout`, `me` |
| Contact (public) | `/api/contact` | Submit the contact form |
| Client | `/api/client` | `dashboard`, `orders` (+ `accept` / `reject`), `shipments`, `invoices` (+ `pdf`), `documents/unlock`, `documents/{id}/download`, `notifications` |
| Client claims | `/api/client/claims` | File a claim (multipart), list claims, view details, download proof |
| Manager orders | `/api/export-manager/orders` | List, `quote`, `decline`, `PATCH stage` |
| Manager documents | `/api/export-manager/documents` | `upload`, `batch-upload`, list, download |
| Manager tokens | `/api/export-manager/tokens` | Issue, list, revoke |
| Manager shipments / invoices | `/api/export-manager/shipments`, `/invoices` | Create and list |
| Bulk jobs | `/api/export-manager/documents/bulk-import`, `/tokens/bulk-generate` | Launch, get status, list errors, retry |
| Manager reports | `/api/export-manager/reports` | `excel`, `export-summary/pdf` |
| Admin | `/api/admin` | `users`, `users/{id}/status`, `dashboard-summary`, `audit-logs` |
| Admin claims | `/api/admin/claims` | List, view details, get proof, `resolve`, `reject` |
| Admin reports | `/api/admin/reports` | Report data, `summary`, `pdf` |
| Search | `/api/{client,export-manager,admin}/search` | Global search limited to the caller's role |

List endpoints are paginated and return a shared `PageResponse` structure.

---

## Testing

```bash
cd exportsystem
./mvnw test
```

Tests run against an in-memory **H2** database, and the PostgreSQL-only SQL script is skipped. The current tests cover application startup, the bulk document import service, and the claim service (resolving, rejecting, and the rules for setting deadlines).

---

## Future Scope

- **Cloud file storage:** move trade documents from local disk to S3, Azure Blob, or MinIO, and serve downloads through pre-signed URLs.
- **Online payments:** connect a payment gateway (such as Stripe or SSLCommerz) so invoices can be paid online and the order moves to `PAID` automatically.
- **Live carrier tracking:** pull shipment status and ETA from carrier and logistics APIs instead of entering them by hand.
- **Real-time notifications:** push notifications over WebSocket or Server-Sent Events instead of polling.
- **Admin-managed roles:** a UI for editing role permissions, a separate approval step for Export Manager and Admin sign-ups, and **2FA / email verification**.
- **Analytics dashboard:** charts of export volume, revenue by destination, and turnaround time per stage.
- **Document integrity:** file checksums, virus scanning of uploads, and digital signatures or QR verification for issued invoices and certificates.
- **DevOps:** Docker Compose (API + DB + frontend), CI/CD pipelines, database migrations with Flyway or Liquibase, and secrets kept out of the repository.
- **Wider test coverage:** controller and security tests, frontend component tests, and end-to-end tests (Playwright).
- **Multi-currency and localization:** exchange-rate support on quotes and invoices, and a multi-language UI.
- **Public API docs:** OpenAPI / Swagger UI for the REST API.
