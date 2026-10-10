# UniCore — Assignment 6 backend

Express, TypeScript, Prisma/PostgreSQL REST API for a University Management System with SUPER_ADMIN, INSTRUCTOR, and STUDENT roles.

## Setup

Use Node.js 20.9 or newer. Both projects were verified with npm and the included npm lockfiles.

```bash
npm ci
cp .env.example .env
# Configure PostgreSQL, separate strong JWT secrets, and public app URLs.
npx prisma generate --schema=prisma/schema
npx prisma migrate deploy --schema=prisma/schema
# Optional, only in a dedicated development/evaluation database:
npm run seed
npm run dev
```

If your existing database already has the schema without migration records, inspect its migration history before applying the initial migration. Do not reset or overwrite a populated database. No migration or seed was run against the uploaded project's database during this review. The schema was preserved.

```bash
npm run typecheck
npm test
npm run build
npm start
```

The TypeScript build outputs `dist/src/server.js`; production scripts now start that file correctly. `api/index.ts` exports the Express app for the existing Vercel serverless configuration. Apply database migrations separately when deploying a serverless app. Bun may run these scripts; regenerate its lockfile if choosing Bun.

## Environment

Copy `.env.example`, not the uploaded real `.env`. `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` are required. Configure `CORS_ORIGIN` for the frontend origin. Redis is optional; its existing helper is an advisory cache and is not the source of payment or session authority. Google login requires `GOOGLE_CLIENT_ID` and a verified Google email.

The old source contained an embedded database connection string in an optional seed script. It was removed, and real environment files are excluded from the deliverable. Rotate any credentials that were previously shared or committed in that source.

## Payments

New payments use SSLCommerz SANDBOX. Set these server-only variables:

```env
SSLCOMMERZ_STORE_ID=your_sandbox_store_id
SSLCOMMERZ_STORE_PASS=your_sandbox_store_password
BACKEND_URL=https://your-backend.example
FRONTEND_URL=https://your-frontend.example
```

`BACKEND_URL` and `FRONTEND_URL` are origins/base URLs without `/api/v1`. The checkout sandbox is fixed in `src/app/lib/sslcommerz.ts`; this is not a live-money integration.

| Endpoint | Purpose | Access |
| --- | --- | --- |
| POST /api/v1/payments/initiate | Body `{ "invoiceId": "..." }`; reserves/reuses checkout | Student, own invoice |
| GET /api/v1/payments/me | Safe payment history | Student |
| GET /api/v1/payments/:paymentId | Receipt, reconciles pending SSL session | Owner or Super Admin |
| POST /api/v1/payments/sslcommerz/callback/success | Provider browser callback | Gateway-verified |
| POST /api/v1/payments/sslcommerz/callback/fail | Provider failure callback | Gateway-verified |
| POST /api/v1/payments/sslcommerz/callback/cancel | Provider cancellation callback | Gateway-verified |
| POST /api/v1/payments/sslcommerz/ipn | Independent provider notification | Gateway-verified |

Callbacks accept URL-encoded bodies. They validate the provider's result and match transaction ID, BDT amount, currency, validation reference, bank reference, and risk status. Browser status/query parameters are never sufficient proof. Invoice/payment/notification settlement is atomic and idempotent; invoice row locking serializes concurrent initiations. Failed gateway requests return an error rather than fake success. Provider session/card details are excluded from client receipts.

Existing bKash attempts retain their callback and are verified using the gateway's query/execute APIs; new initiation no longer uses bKash. Do not change existing payment rows or mark invoices paid to simulate checkout. A pending attempt with an unknown provider status remains pending; finance should investigate the gateway transaction before attempting a manual reconciliation.

Sandbox credentials and reachable HTTPS callback URLs are required for an actual end-to-end checkout. See `REVIEW_AND_SETUP.md` for the acceptance checklist and test limits.

## Development demo data

`npm run seed` creates dedicated evaluation accounts (`admin@university.edu`, `instructor@university.edu`, `student@university.edu`) with development passwords documented in the frontend README. It also creates a BDT 100 UNPAID tuition invoice for the demo student. It does not fabricate paid payment records. Existing account passwords remain unchanged.

`scripts/seed-realistic-db.ts` is an optional larger development seed moved out of the frontend and changed to use `DATABASE_URL`. It is not part of application startup. Review it before using a disposable database; it is unnecessary for the normal app build.

## Other fixes

Invoice precision validation, duplicate semester tuition prevention, unique invoice numbering, current database role authorization, instructor section scoping, schedule time validation, corrected earned credits, public program/semester catalog endpoints, and persistent contact inquiries. Payment regression tests are in `tests/unit/payment.test.ts`.

Original implementation notes are retained as background; the README and `REVIEW_AND_SETUP.md` describe the updated behavior.
