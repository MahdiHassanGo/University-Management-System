# Review and setup checklist — Assignments 6 and 7

Reviewed against the supplied University Management System requirements, with priority on payments, exposed credentials, frontend/backend contract errors, and UI consistency.

## Corrected issues

| Area | Issue found | Updated behavior |
| --- | --- | --- |
| Payment success | Frontend payment routes could return simulated success; a success URL could display an unverified receipt | Removed standalone frontend gateway routes; backend SSLCommerz checkout and verified database receipts |
| Required gateway | Core flow used bKash rather than the mandatory Stripe/SSLCommerz integration | New hosted SSLCommerz sandbox flow; legacy bKash callbacks still verified |
| Payment authority | Callback/browser status was trusted too readily | Server-side gateway validation with exact amount, currency, transaction, bank/validation references, and risk checks |
| Repeated checkout | Repeated requests and callbacks could create conflicting attempts or billing | Invoice row locking, reserved pending attempt/reuse, atomic settlement and idempotent paid callbacks |
| Billing | Repeated bulk generation and sequential invoice numbering could conflict | Existing tuition invoices skipped/rejected; UUID-based references; amounts limited to two decimals |
| Credentials | Demo credentials were displayed; frontend had hardcoded gateway credentials and a seed script with a database URL | UI credentials removed; demo passwords and auth cookies stay server-only; source keys and embedded DB URL removed |
| Authorization | Frontend trusted locally readable JWT state; backend used the token role | Authoritative /auth/me role checks, HttpOnly session cookies, current DB role; scoped instructor section lists |
| API contracts | Course credits, exam payloads, attendance dates, notification read status, and pagination shapes differed | Frontend mapped to the actual Assignment 6 response and request fields |
| Academic records | Transcript UI invented grade/GPA values; zero values could turn into defaults | Actual published results/CGPA; failed courses do not increase earned credits |
| Marks and attendance | Edits could leak across selected assessments/rosters or overwrite unchanged existing values | Reset editing state on selection changes; preserve unedited stored marks/records; enforce mark bounds |
| Unsupported inputs | Session end time and assessment remarks were accepted in UI without backend persistence | Removed unsupported inputs; session start is stored through heldAt |
| Public workflows | Programs/semesters and contact form were static or incomplete | Public catalog API; contact submissions create admin notifications |
| UI | Small inconsistent controls, exposed demo panels, unrelated medical imagery | Teal/slate theme, campus vector, updated home/auth layouts, consistent shared controls, visible mobile tuition actions |
| Build | Wrong backend production entry path; incompatible uploaded dependency binaries | Correct dist/src/server.js scripts; clean installs using npm lockfiles |

## Requirements assessment

| Requirement | Assessment |
| --- | --- |
| Matching University Management domain | Preserved across both assignments |
| Next.js App Router, TS strict, Tailwind/component library | Present; Next.js 16 Proxy convention used |
| Three roles with distinct workflows | Present; backend authorization retained and strengthened |
| One-click role login | Implemented; configure dedicated demo credentials and seed/accounts before evaluation |
| Real API / state management | Core app consumes Assignment 6; React Query plus context providers; test fixtures are not shipped as app data |
| Forms and multi-step creation | TanStack Form + Zod wrappers for forms; section wizard retained; roster grid updates validate actual backend limits |
| Loading/errors | Route skeletons/error boundaries and global query failure toasts; selected data views have retry/error states |
| SSLCommerz test mode | Implemented and regression-tested; actual merchant checkout remains UNVERIFIED until credentials and callback hosting are configured |
| URL state | Existing searches/filters and added pagers/selections use query parameters; department search and creation-date sort available |
| At least 18 pages | More than 18 application pages compile; page count alone does not prove all live workflows |
| Professional responsive UI | Shared redesign; selected desktop/mobile screens inspected; full real-data workflow QA still required |
| 20 meaningful frontend commits | Not verifiable from the frontend ZIP; not manufactured. Use your actual repository history |
| Live frontend/backend URLs | Not deployed or verified in this review |
| 5–10 minute video | Not recorded; include the required walkthrough in your submission |

## Verification performed

- Frontend production build and TypeScript checking passed; Biome lint passed with no warnings/errors after final code formatting.
- Backend TypeScript checking and production build passed. Four test files passed: 34 tests total, including 26 payment regression cases.
- Browser QA exercised home, login, contact, tuition/finance, and a pending receipt at 1440px and 390px widths using a temporary local API fixture outside the delivered app. No JavaScript page errors or document overflow were observed. Hidden demo passwords were absent, checkout failure displayed an error, and pending payment did not display a confirmed receipt.
- Browser checks verified unauthenticated access, forged-cookie access, wrong-role redirects, and contact form validation, department edit/save, and department schema validation.
- The local UI fixtures, browser binaries, node_modules, real .env files, .git metadata, and build outputs are excluded from the projects. Screenshots in the frontend docs/previews show UI test data only.

## Still required before submission

1. Configure both .env examples for your database and app URLs. Apply existing migrations safely, and use dedicated development demo accounts. No remote database writes were performed in this review.
2. Configure your SSLCommerz sandbox merchant. Deploy backend callbacks to publicly reachable HTTPS URLs and set BACKEND_URL/FRONTEND_URL accordingly.
3. Run a real sandbox success, cancel, and failure checkout from a student's actual UNPAID invoice. Confirm database invoice/payment state, amount, gateway transaction ID, notifications, and frontend receipts.
4. Replay a valid callback/IPN and confirm only one settlement/notification. Open the success URL with random or another student's payment ID and confirm it cannot show a paid receipt. Repeated clicks should reuse a live attempt. Resolve unknown pending attempts with finance after checking the gateway.
5. Run real PostgreSQL concurrency checks for simultaneous checkout and invoice generation. Unit tests use isolated gateway/Prisma mocks and do not establish database locking behavior or merchant connectivity.
6. Test registration, section creation, prerequisites/capacity, attendance, examination entry, result publication, transcripts, department CRUD, and reports with your actual seeded database in all three roles. Confirm program and semester selectors and semester dates are appropriate for your evaluation.
7. Validate all pages on mobile/tablet/desktop after deployment, verify Google OAuth only if configured, and submit real repository/live URLs, meaningful commit history, evaluation credentials, and a 5–10 minute video.

No claim is made that deployment, all database workflows, external Google OAuth, or an actual SSLCommerz transaction passed. The backend schema was retained, and there is no fake successful-payment fallback.

Gateway reference: https://developer.sslcommerz.com/docs.html
Next.js 16 Proxy reference: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
