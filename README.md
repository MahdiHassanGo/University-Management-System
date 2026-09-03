# University Management System — Backend REST API

A production-ready University Management System Backend REST API built with Express 5, TypeScript, PostgreSQL, and Prisma ORM.

## Project Overview

This backend system powers academic administration, student course registration, attendance tracking, exam & marks management, GPA/CGPA transcript generation, fee invoicing, real bKash Tokenized Checkout payments, and Super Admin analytics.

---

## 🛠️ Technology Stack

- **Framework**: Express 5 (ESM + Strict TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (Access & Refresh tokens), Cookie & Bearer headers, Google OAuth ID Token verification
- **Validation**: Zod (Strict schema validation for Body, Params, and Query)
- **Payment Gateway**: Real bKash Tokenized Checkout Integration
- **Caching**: Redis with in-memory fallback
- **Code Quality**: Biome format & linting

---

## 🔑 Role & Access Matrix

| Module / Feature | Public | Student | Instructor | Super Admin |
| --- | :---: | :---: | :---: | :---: |
| Health Check | ✅ | ✅ | ✅ | ✅ |
| Credential & Google Auth | ✅ | ✅ | ✅ | ✅ |
| Account Status Management | ❌ | ❌ | ❌ | ✅ |
| Departments & Programs | ❌ | Read | Read | Full Access |
| Courses & Prerequisites | ❌ | Read | Read | Full Access |
| Semesters & Sections | ❌ | Read | Read | Full Access |
| Course Registration / Drop | ❌ | Own | ❌ | Drop / Manage |
| Attendance Marking | ❌ | View Own | Assigned Sections | Full Access |
| Exams & Marks Entry | ❌ | ❌ | Assigned Sections | Full Access |
| Result Publication | ❌ | View Published | Assigned Sections | Full Access |
| GPA / CGPA & Transcripts | ❌ | Own | ❌ | Full Access |
| Fee Invoices & bKash Payment | ❌ | Own / Pay | ❌ | Create / Manage |
| System Analytics Reports | ❌ | ❌ | ❌ | Full Access |

---

## ⚙️ Core Business Rules

1. **Course Prerequisites & Cycle Prevention**:
   - Courses cannot be their own prerequisite.
   - Cycle detection via BFS graph traversal prevents circular prerequisite chains (e.g. A -> B -> C -> A).
   - Students must have a published passing grade point to satisfy prerequisites.

2. **Transaction-Safe Course Registration**:
   - Executes inside a serializable Prisma transaction.
   - Enforces capacity checks, open registration windows, program curriculum eligibility, max credit limits, and student schedule overlap checks.

3. **Exams & Grading Scale**:
   - Total exam weight percentages for a section cannot exceed 100%.
   - Grading scale: `A+` (4.00, >=80), `A` (3.75, 75-79), `A-` (3.50, 70-74), `B+` (3.25, 65-69), `B` (3.00, 60-64), `B-` (2.75, 55-59), `C+` (2.50, 50-54), `C` (2.25, 45-49), `D` (2.00, 40-44), `F` (0.00, <40).

4. **Real bKash Tokenized Payment Integration**:
   - Supports invoice initiation, bKash grant token, create payment, callback execution, and server-side verification.
   - Idempotent callback processing prevents double payment updates.

---

## 🚀 Setup & Installation

### 1. Environment Variables

Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/university_db?schema=public
REDIS_URL=redis://localhost:6379
BCRYPT_SALT_ROUNDS=12
JWT_ACCESS_SECRET=super_secret_access_token_key_12345
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_SECRET=super_secret_refresh_token_key_12345
JWT_REFRESH_EXPIRES_IN=30d
GOOGLE_CLIENT_ID=google_client_id_placeholder
BKASH_APP_KEY=bkash_app_key_placeholder
BKASH_APP_SECRET=bkash_app_secret_placeholder
BKASH_USERNAME=bkash_username_placeholder
BKASH_PASSWORD=bkash_password_placeholder
BKASH_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_CALLBACK_URL=http://localhost:5000/api/v1/payments/bkash/callback
```

### 2. Commands

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev --schema=prisma/schema

# Seed demo database accounts & catalog
npm run seed

# Run in development mode
npm run dev

# Format and lint code
npm run format:fix
npm run lint:check

# Build TypeScript output
npm run build

# Start production server
npm start
```

---

## 📄 Postman Collection & Documentation

Exported Postman files are located in the [`docs/`](./docs/) directory:
- `docs/University-Management-System.postman_collection.json`
- `docs/local.postman_environment.json`
