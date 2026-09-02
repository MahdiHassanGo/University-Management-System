# University Management System — Backend Implementation Plan

## 1. Project decision summary

**Project:** University Management System  
**Assignment:** Programming Hero Level 2, Batch 7, Assignment 6  
**Project type:** Backend-only REST API  
**Primary deadline:** September 7, 2026, 11:59 PM  
**Development target:** Finish by September 6 and keep September 7 for final verification, video, and submission.

This plan follows the coding structure and development style of `L2B7-Project-PH-Healthcare-Backend`:

- Express 5 with strict TypeScript and ESM.
- PostgreSQL with Prisma and a multi-file Prisma schema.
- Feature modules inside `src/app/module`.
- Each module follows `interface → validation → service → controller → route`.
- Controllers remain thin; business logic stays in services.
- Zod validates every applicable body, path parameter, and query parameter.
- `AppError`, `catchAsync`, `sendResponse`, `globalErrorHandler`, and `notFound` handle cross-cutting behavior.
- JWT access/refresh tokens, cookie and Bearer-token support, Google ID-token verification, and role middleware.
- Redis for short-lived auth data and selected read caches.
- PostgreSQL constraints, indexes, ownership filters, and Prisma transactions.
- Feature-sized work, verification, then one descriptive commit and immediate push.

### Fixed implementation choices

| Area | Decision |
| --- | --- |
| Roles | `SUPER_ADMIN`, `INSTRUCTOR`, `STUDENT` |
| Payment | bKash Tokenized Checkout using real gateway APIs and verified callback execution |
| API prefix | `/api/v1` |
| API documentation | Complete Postman collection and published Postman documentation |
| Deployment | Render API + managed PostgreSQL + managed Redis |
| Authentication | Email/password and Google ID-token login; Google self-provisioning is student-only |
| Pagination | `page`, `limit`, `sortBy`, `sortOrder`, `searchTerm`, and module-specific filters |
| Soft deletion | Use account/catalog statuses or `isDeleted` where academic history must be preserved |
| Demo identities | Dedicated evaluator accounts for all three roles; never personal credentials |

> Do not build a frontend. Every requirement must be demonstrated through Postman or Thunder Client.

## 2. Scope and role ownership

### Super Admin

- Manage student and instructor accounts.
- Create and manage departments, programs, courses, prerequisites, semesters, and sections.
- Open and close registration periods.
- Create semester fee invoices and view payment status.
- View enrollment, attendance, result, and finance reports.
- Block/unblock accounts and manage academic statuses.

### Instructor

- View only assigned sections and enrolled students.
- Create attendance sessions and mark attendance for owned sections.
- Create/update exams for owned sections.
- Enter marks, calculate final results, and publish results for owned sections.
- View section attendance and performance summaries.

### Student

- Register/login with email/password or Google.
- View own profile, available courses, sections, and academic semesters.
- Register for and drop eligible course sections.
- View own attendance, exam results, GPA/CGPA, and transcript.
- View own invoices and complete real bKash payments.
- View and mark own notifications as read.

### Permission rule

Role checking alone is not enough. Each protected service must verify all applicable conditions:

1. JWT is valid.
2. User exists and account status is active.
3. User has an allowed role.
4. Instructor owns the requested section or exam.
5. Student owns the requested enrollment, result, invoice, payment, or transcript.
6. Requested resource is not deleted, closed, or otherwise inaccessible.

## 3. Recommended repository structure

```text
university-management-system-backend/
├── docs/
│   ├── University-Management-System.postman_collection.json
│   ├── local.postman_environment.json
│   └── er-diagram.png
├── prisma/
│   ├── migrations/
│   └── schema/
│       ├── schema.prisma
│       ├── enums.prisma
│       ├── user.prisma
│       ├── academic-profile.prisma
│       ├── academic-catalog.prisma
│       ├── semester-section.prisma
│       ├── enrollment.prisma
│       ├── attendance.prisma
│       ├── exam-result.prisma
│       ├── fee-payment.prisma
│       └── notification.prisma
├── src/
│   ├── app/
│   │   ├── config/
│   │   │   └── index.ts
│   │   ├── interfaces/
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   ├── bkash.ts
│   │   │   ├── googleAuth.ts
│   │   │   ├── prisma.ts
│   │   │   └── redis.ts
│   │   ├── middleware/
│   │   │   ├── checkAuth.ts
│   │   │   ├── globalErrorHandler.ts
│   │   │   ├── notFound.ts
│   │   │   ├── rateLimiter.ts
│   │   │   └── validateRequest.ts
│   │   ├── module/
│   │   │   ├── auth/
│   │   │   ├── user/
│   │   │   ├── student/
│   │   │   ├── instructor/
│   │   │   ├── department/
│   │   │   ├── program/
│   │   │   ├── course/
│   │   │   ├── semester/
│   │   │   ├── section/
│   │   │   ├── enrollment/
│   │   │   ├── attendance/
│   │   │   ├── exam/
│   │   │   ├── result/
│   │   │   ├── transcript/
│   │   │   ├── fee/
│   │   │   ├── payment/
│   │   │   ├── notification/
│   │   │   └── report/
│   │   ├── templates/
│   │   └── utils/
│   │       ├── AppError.ts
│   │       ├── catchAsync.ts
│   │       ├── calculateGrade.ts
│   │       ├── jwt.ts
│   │       ├── pagination.ts
│   │       ├── seed.ts
│   │       └── sendResponse.ts
│   ├── app.ts
│   └── server.ts
├── tests/
│   ├── integration/
│   └── unit/
├── .env.example
├── .gitignore
├── biome.json
├── package.json
├── prisma.config.ts
├── README.md
└── tsconfig.json
```

### Standard module template

Every normal module should use the same file pattern:

```text
course/
├── course.interface.ts
├── course.validation.ts
├── course.service.ts
├── course.controller.ts
└── course.route.ts
```

Module implementation order:

1. Confirm data fields, role, success behavior, and failure cases.
2. Add/update Prisma schema and database constraints when required.
3. Define request/service interfaces.
4. Create Zod schemas for body, params, and query.
5. Implement service business logic and safe Prisma selections.
6. Implement a thin controller using `catchAsync` and `sendResponse`.
7. Add protected routes with validation before the controller.
8. Add the requests to Postman.
9. Test allowed and rejected cases.
10. Format, lint, build, commit, and push.

## 4. Assignment-compliant response and error design

Keep the existing `sendResponse` pattern, but make the serialized body match the assignment exactly.

### Successful response

```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {}
}
```

For paginated endpoints, keep pagination inside `data`:

```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "data": {
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    },
    "items": []
  }
}
```

### Error response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "path": "body.code",
      "message": "Course code is required"
    }
  ]
}
```

### Error handler responsibilities

- `AppError`: business rule, authorization, ownership, and not-found errors.
- Zod: return every relevant validation issue in `errors`, not only the first issue.
- Prisma `P2002`: duplicate/unique constraint conflict.
- Prisma `P2003`: invalid relationship/foreign key.
- Prisma `P2025`: requested resource not found.
- Prisma transaction conflicts such as `P2034`: limited retry where appropriate.
- Production: never return stack traces, raw Prisma errors, access tokens, gateway credentials, or internal payloads.
- Unknown error: HTTP 500 with a generic message and an empty/safe error array.

### Validation middleware upgrade

The existing healthcare middleware parses only `req.body`. For this assignment, accept a schema shaped like this:

```ts
z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
```

The middleware should replace `req.body`, `req.params`, and `req.query` with their parsed values. UUIDs, pagination values, filter enums, dates, marks, capacities, credit values, and callback parameters must all be validated.

## 5. Database design

### Core identity and academic catalog

| Model | Important fields and constraints |
| --- | --- |
| `User` | UUID, unique lowercase email, nullable password, nullable unique Google ID, role, status, provider, emailVerified, needPasswordChange, timestamps |
| `Student` | Unique `studentId`, unique `userId`, `programId`, `admissionSemesterId`, academicStatus, timestamps |
| `Instructor` | Unique `employeeId`, unique `userId`, `departmentId`, designation, academicStatus, timestamps |
| `Department` | Unique code, unique name, isActive, timestamps |
| `Program` | Unique code, department relation, degree type, total credits, max semester credits, isActive |
| `Course` | Unique course code, title, credit, department relation, course level, isActive |
| `ProgramCourse` | Unique program-course pair, recommended semester, required/elective type |
| `CoursePrerequisite` | Unique course-prerequisite pair, minimum required grade point; reject self-reference and graph cycles |

### Semester, delivery, and enrollment

| Model | Important fields and constraints |
| --- | --- |
| `AcademicSemester` | Unique year-term pair, registration start/end, class start/end, result date, status |
| `Section` | Course, semester, instructor, section number, capacity, enrolled count, status; unique course-semester-section tuple |
| `SectionSchedule` | Section, weekday, start time, end time, room; index instructor/day and section/day |
| `Enrollment` | Student, section, status, enrolledAt, droppedAt; unique student-section pair |

### Attendance, assessment, and academic history

| Model | Important fields and constraints |
| --- | --- |
| `AttendanceSession` | Section, heldAt, topic; unique section-heldAt pair |
| `AttendanceRecord` | Session, student, status, note; unique session-student pair |
| `Exam` | Section, exam type, title, total marks, weight percentage, heldAt, status |
| `ExamResult` | Exam, student, marks; unique exam-student pair |
| `CourseResult` | Unique enrollment relation, total marks, letter grade, grade point, publication status, publishedAt |

### Finance and communication

| Model | Important fields and constraints |
| --- | --- |
| `FeeInvoice` | Student, semester, invoice number, amount, due date, status; unique invoice number |
| `Payment` | Invoice, amount, gateway, merchant invoice number, bKash payment ID, transaction ID, status, gateway response, timestamps |
| `Notification` | Recipient user, type, title, message, readAt, related entity ID, timestamps |
| `AuditLog` | Actor, action, entity type/ID, safe metadata, timestamp; exclude credentials and token values |

### Required enums

- `Role`: `SUPER_ADMIN`, `INSTRUCTOR`, `STUDENT`
- `UserStatus`: `ACTIVE`, `BLOCKED`, `DELETED`
- `AcademicStatus`: `ACTIVE`, `SUSPENDED`, `GRADUATED`, `INACTIVE`
- `SemesterTerm`: `SPRING`, `SUMMER`, `FALL`
- `SemesterStatus`: `DRAFT`, `REGISTRATION_OPEN`, `ONGOING`, `COMPLETED`
- `SectionStatus`: `DRAFT`, `OPEN`, `CLOSED`, `COMPLETED`
- `EnrollmentStatus`: `ENROLLED`, `DROPPED`, `COMPLETED`, `FAILED`
- `AttendanceStatus`: `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`
- `ExamStatus`: `DRAFT`, `PUBLISHED`, `COMPLETED`
- `ResultStatus`: `DRAFT`, `PUBLISHED`
- `InvoiceStatus`: `UNPAID`, `PAID`, `OVERDUE`, `CANCELLED`
- `PaymentStatus`: `PENDING`, `PAID`, `FAILED`, `CANCELLED`, `REFUNDED`

### Indexing checklist

- Add indexes to frequently filtered foreign keys; PostgreSQL does not automatically index every foreign key.
- Index user role/status, semester status/dates, section semester/course/instructor/status, enrollment student/status, exam section/status, invoice student/status/dueDate, payment status/transaction ID, and notifications recipient/readAt.
- Use compound unique constraints for duplicate prevention, not service checks alone.
- Preserve academic history by restricting destructive cascades. Prefer status changes or soft deletion for courses, sections, users, and semesters already referenced by academic records.

## 6. Critical business rules

### Course prerequisite management

- A course cannot be its own prerequisite.
- The same prerequisite cannot be added twice.
- Adding a prerequisite must not create a circular dependency. Run a graph traversal before saving.
- Enrollment passes prerequisite validation only when the student has a published passing result at or above the configured minimum grade point.

### Transaction-safe course registration

Registration is the main technical challenge and must execute as one transaction:

1. Verify active student and active academic profile.
2. Verify semester status is `REGISTRATION_OPEN` and current time is inside the registration window.
3. Lock/read the selected section inside the transaction.
4. Verify section is open and has capacity.
5. Verify the course belongs to the student's program curriculum.
6. Reject an existing active enrollment in the same course/semester.
7. Validate every prerequisite against published academic history.
8. Calculate current registered credits and enforce the program maximum.
9. Reject overlapping section schedules.
10. Reject registration when a blocking overdue invoice exists, if this rule is enabled in the product specification.
11. Create the enrollment and increment enrolled count atomically.
12. Create an in-app notification.

Use a serializable Prisma transaction, a row-lock strategy for the section capacity, a unique database constraint, and a limited retry for transaction write conflicts. Dropping a section must also run transactionally and decrement enrolled count without allowing it to become negative.

### Attendance

- Only the assigned instructor or Super Admin can create a session or mark records.
- Only actively enrolled students in that section can receive attendance records.
- Bulk marking must reject duplicates and unknown students.
- Student endpoints must return only the authenticated student's records.
- Attendance percentage is `attended sessions / total held sessions × 100`; document how `LATE` and `EXCUSED` affect the numerator.

### Exams and results

- Only the assigned instructor or Super Admin can manage an exam.
- Exam weight must be greater than zero, and total section exam weight cannot exceed 100%.
- Marks must be between zero and the exam's total marks.
- Marks may be entered only for valid enrolled students.
- Final course results are calculated from exam weights in the service; clients cannot submit grade points directly.
- Put the grading thresholds in one `gradeScale` constant so the formula is consistent and explainable.
- Publishing results is an explicit action. Students cannot see draft results.
- After publication, changes require a controlled Super Admin action or a documented correction flow.

### GPA and transcript

- Semester GPA = `sum(course credit × grade point) / sum(attempted graded credits)`.
- CGPA uses all published course results according to the documented repeat-course policy.
- Failed courses and repeated courses must be handled consistently and described in the README.
- Calculate GPA from database records; do not trust a GPA submitted by any client.
- Transcript response includes semester groups, course code/title/credit/grade/grade point, semester GPA, total credits, and cumulative CGPA.

### Fees and bKash payment

1. Super Admin creates an invoice for a student and semester.
2. Student requests payment initiation for an owned unpaid invoice.
3. Backend creates a local `PENDING` payment attempt and calls the real bKash create-payment API.
4. bKash redirects to the backend callback.
5. Backend executes/queries the payment using the gateway API; never trust the callback query by itself.
6. Verify merchant invoice number, amount, currency, and successful gateway status.
7. In one transaction, mark the payment `PAID`, mark the invoice `PAID`, and create a notification.
8. Repeated callbacks must be idempotent and must not create a second successful payment.
9. Failed/cancelled callbacks update only the payment attempt; they do not mark the invoice paid.

Check usable bKash merchant/sandbox credentials on Day 1. The gateway must be an actual integration, not an endpoint that simply changes a database status.

## 7. API plan

All routes use `/api/v1` and every applicable request uses Zod validation.

### System and authentication

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Health/readiness response |
| POST | `/auth/register` | Public | Student credential registration |
| POST | `/auth/login` | Public | Credential login |
| POST | `/auth/google` | Public | Verify Google ID token and login/provision student |
| POST | `/auth/refresh-token` | Refresh token | Rotate/issue tokens |
| POST | `/auth/logout` | Authenticated | Clear cookies/revoke refresh session |
| GET | `/auth/me` | All roles | Current safe user/profile |
| POST | `/auth/change-password` | All roles | Current-password change flow |

### User, student, and instructor management

| Method | Endpoint | Access |
| --- | --- | --- |
| GET/PATCH | `/students/me` | Student |
| GET/PATCH | `/instructors/me` | Instructor |
| POST | `/students` | Super Admin |
| GET | `/students` | Super Admin |
| GET/PATCH | `/students/:studentId` | Super Admin |
| POST | `/instructors` | Super Admin |
| GET | `/instructors` | Super Admin |
| GET/PATCH | `/instructors/:instructorId` | Super Admin |
| PATCH | `/users/:userId/status` | Super Admin |

### Academic catalog

| Module | Endpoints | Access |
| --- | --- | --- |
| Department | `POST/GET /departments`, `GET/PATCH/DELETE /departments/:id` | Read: authenticated; write: Super Admin |
| Program | `POST/GET /programs`, `GET/PATCH/DELETE /programs/:id` | Read: authenticated; write: Super Admin |
| Course | `POST/GET /courses`, `GET/PATCH/DELETE /courses/:id` | Read: authenticated; write: Super Admin |
| Curriculum | `POST/DELETE /programs/:programId/courses/:courseId` | Super Admin |
| Prerequisite | `POST/GET /courses/:courseId/prerequisites`, `DELETE /courses/:courseId/prerequisites/:prerequisiteId` | Read: authenticated; write: Super Admin |
| Semester | `POST/GET /semesters`, `GET/PATCH /semesters/:id`, `PATCH /semesters/:id/status` | Read: authenticated; write: Super Admin |

### Sections and enrollment

| Method | Endpoint | Access |
| --- | --- | --- |
| POST/GET | `/sections` | Create: Super Admin; list: all roles |
| GET/PATCH/DELETE | `/sections/:sectionId` | Read: allowed roles; write: Super Admin |
| GET | `/sections/:sectionId/students` | Assigned instructor/Super Admin |
| GET | `/sections/available` | Student |
| POST | `/enrollments` | Student |
| PATCH | `/enrollments/:enrollmentId/drop` | Owning student/Super Admin |
| GET | `/enrollments/me` | Student |
| GET | `/enrollments` | Super Admin with filters |

### Attendance

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/sections/:sectionId/attendance-sessions` | Assigned instructor/Super Admin |
| POST | `/attendance-sessions/:sessionId/records/bulk` | Assigned instructor/Super Admin |
| PATCH | `/attendance-records/:recordId` | Assigned instructor/Super Admin |
| GET | `/sections/:sectionId/attendance` | Assigned instructor/Super Admin |
| GET | `/attendance/me` | Student |

### Exams, results, GPA, and transcript

| Method | Endpoint | Access |
| --- | --- | --- |
| POST/GET | `/sections/:sectionId/exams` | Assigned instructor/Super Admin |
| PATCH/DELETE | `/exams/:examId` | Assigned instructor/Super Admin |
| POST | `/exams/:examId/results/bulk` | Assigned instructor/Super Admin |
| GET | `/exams/:examId/results` | Assigned instructor/Super Admin |
| POST | `/sections/:sectionId/results/calculate` | Assigned instructor/Super Admin |
| PATCH | `/sections/:sectionId/results/publish` | Assigned instructor/Super Admin |
| GET | `/results/me` | Student; published only |
| GET | `/transcripts/me` | Student |
| GET | `/transcripts/students/:studentId` | Super Admin |

### Fees, payments, notifications, and reports

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/fees/invoices` | Super Admin |
| POST | `/fees/invoices/bulk` | Super Admin |
| GET | `/fees/invoices` | Super Admin |
| GET | `/fees/invoices/me` | Student |
| POST | `/payments/initiate` | Student |
| GET/POST | `/payments/bkash/callback` | Public callback, verified server-side |
| GET | `/payments/me` | Student |
| GET | `/payments/:paymentId` | Owner/Super Admin |
| GET | `/notifications/me` | All roles |
| PATCH | `/notifications/:notificationId/read` | Notification owner |
| GET | `/reports/enrollments` | Super Admin |
| GET | `/reports/attendance` | Super Admin |
| GET | `/reports/results` | Super Admin |
| GET | `/reports/finance` | Super Admin |

## 8. Redis strategy

Cache only data that is safe and beneficial:

- Catalog lists: departments, programs, courses, and active semesters.
- Available-section list with a short TTL.
- Selected aggregate report results with a short TTL.
- Google/bKash access data or short-lived auth state only when the gateway flow requires it.

Do not cache passwords, refresh tokens in plaintext, private transcripts, payment success decisions, or ownership-sensitive responses without user-specific keys.

Every catalog write must invalidate the related list/detail keys. Enrollment must invalidate section availability and reports. Result publication must invalidate transcript/report keys. Payment success must invalidate the student's invoice list and finance reports.

## 9. Five-day implementation schedule

### Day 1 — September 2: foundation, schema, and risk checks

**Outcome:** Running project, database connected, required response/error contract, complete initial data model, migrations, and demo seed plan.

Tasks:

1. Create repository and strict TypeScript/Express/Prisma setup.
2. Configure Biome, scripts, `.gitignore`, and validated environment configuration.
3. Add shared response, async, error, not-found, and request-validation layers.
4. Create the complete multi-file Prisma schema, relations, constraints, and indexes.
5. Run initial migration and build deterministic seed data.
6. Confirm GCP client configuration and obtain a test ID token strategy.
7. Confirm usable bKash credentials and callback URLs before feature development continues.
8. Draft the Postman collection folders and environment variables.

**End-of-day verification:** `npm run format:check`, `npm run lint:check`, `npm run build`, migration from an empty database, seed twice without duplicates, health endpoint, one successful response, one Zod error, one 404.

### Day 2 — September 3: authentication and academic catalog

**Outcome:** Three roles authenticate correctly; Super Admin can build the university catalog.

Tasks:

1. Credential registration/login, password hashing, JWT access/refresh flow, and logout.
2. Google ID-token verification and student account linking/provisioning.
3. Account status and strict role middleware.
4. Student and instructor admin management.
5. Department, program, course, curriculum, and prerequisite modules.
6. Academic semester module and guarded status transitions.
7. Pagination, search, filtering, safe selections, and catalog cache invalidation.

**End-of-day verification:** login for all roles, invalid password, blocked account, expired/missing token, Student receives 403 on admin endpoint, Google token audience validation, duplicate codes, invalid prerequisite, circular prerequisite rejection.

### Day 3 — September 4: sections, registration, and attendance

**Outcome:** A student can safely register for an eligible section; an instructor can manage attendance only for owned sections.

Tasks:

1. Section and section-schedule CRUD.
2. Instructor/room/student schedule-conflict checks.
3. Transaction-safe registration and capacity enforcement.
4. Prerequisite, credit-limit, duplicate-course, window, status, and ownership checks.
5. Transaction-safe drop flow.
6. Attendance session, bulk marking, correction, and student summary endpoints.
7. Concurrency and negative tests for registration.

**End-of-day verification:** successful enrollment, full section, closed registration, missing prerequisite, credit overflow, time conflict, duplicate enrollment, simultaneous last-seat attempts, unauthorized attendance, non-enrolled attendance record, and successful drop.

### Day 4 — September 5: results, transcript, fees, and real payment

**Outcome:** Instructor completes the academic assessment flow; student views published academic history and pays a real invoice through bKash.

Tasks:

1. Exam CRUD and total-weight validation.
2. Bulk marks entry and range validation.
3. Final-result calculation and explicit publication.
4. GPA/CGPA and transcript calculation.
5. Fee invoice and invoice-list modules.
6. bKash payment creation, callback execution/query, amount verification, idempotent transactional update, and failure/cancel paths.
7. Notification creation for important academic and payment events.

**End-of-day verification:** exam weight >100 rejection, marks > total rejection, draft result hidden, published result visible, manually recomputed GPA matches API, invoice ownership rejection, verified successful payment, failed payment, cancel path, duplicate callback, and amount mismatch.

### Day 5 — September 6: reports, quality, documentation, and deployment

**Outcome:** Production API, complete Postman documentation, stable commit history, and video-ready evaluator flow.

Tasks:

1. Enrollment, attendance, result, and finance reports.
2. Redis caching and complete mutation invalidation.
3. Security: Helmet, CORS, rate limiting, cookie settings, payload limit, and secret review.
4. Unit/integration regression suite and full Postman runner pass.
5. Complete README, ER diagram, Postman collection, and public API documentation.
6. Deploy migrations and API; set production environment values.
7. Run production smoke tests for all three roles and bKash callback.
8. Prepare exact 5–10 minute video sequence.

### September 7 — submission buffer

- Do not add new features unless they fix a mandatory requirement.
- Run the full collection against the live URL.
- Check every submission link in an incognito browser.
- Record/upload the walkthrough.
- Submit before the deadline; retain time for link/permission corrections.

## 10. Commit and push plan

The plan creates **45 meaningful commits**, comfortably above the required 20. Each number below is one completed, verified commit. Push immediately after every commit.

### Day 1 commits

1. `chore: initialize strict TypeScript Express backend`
2. `chore: configure Biome scripts and environment validation`
3. `feat(core): add consistent API response and async utilities`
4. `feat(core): add structured error validation and not-found handling`
5. `feat(database): configure PostgreSQL Prisma client and schema layout`
6. `feat(database): model users students and instructors`
7. `feat(database): model academic catalog and semester entities`
8. `feat(database): model enrollment attendance and result entities`
9. `feat(database): model fee payment notification and audit entities`
10. `chore(database): add initial migration indexes and demo seeds`

### Day 2 commits

11. `feat(auth): implement student credential registration and login`
12. `feat(auth): add JWT access refresh and logout flow`
13. `feat(auth): integrate verified Google student login`
14. `feat(auth): enforce account status and role authorization`
15. `feat(users): add student and instructor administration APIs`
16. `feat(departments): add department management APIs`
17. `feat(programs): add program management APIs`
18. `feat(courses): add course and curriculum management APIs`
19. `feat(courses): add prerequisite rules and cycle validation`
20. `feat(semesters): add semester lifecycle and registration windows`

### Day 3 commits

21. `feat(sections): add section and class schedule management`
22. `feat(sections): enforce instructor room and student time conflicts`
23. `feat(enrollments): add transaction-safe course registration`
24. `feat(enrollments): enforce prerequisites credits and duplicate rules`
25. `feat(enrollments): add transactional course drop workflow`
26. `feat(attendance): add attendance session management`
27. `feat(attendance): add bulk marking and ownership controls`
28. `feat(attendance): add student attendance summaries`
29. `test(enrollments): cover concurrency validation and authorization`

### Day 4 commits

30. `feat(exams): add exam management and weight validation`
31. `feat(results): add validated bulk marks entry`
32. `feat(results): calculate and publish final course results`
33. `feat(transcript): add GPA CGPA and transcript calculation`
34. `feat(fees): add semester fee invoice management`
35. `feat(payments): initialize real bKash invoice payments`
36. `feat(payments): verify callbacks and update invoices transactionally`
37. `feat(notifications): add academic and payment notifications`
38. `test(payments): cover callback idempotency and failure cases`

### Day 5 commits

39. `feat(reports): add academic and finance reporting APIs`
40. `perf(cache): add Redis caching and mutation invalidation`
41. `test(api): add response validation and RBAC integration coverage`
42. `docs(api): add complete Postman collection and examples`
43. `docs(readme): document setup architecture roles and business rules`
44. `chore(deploy): add production startup migration and health checks`
45. `fix(production): resolve live API smoke test findings`

### Required Git routine after every feature

```bash
git status --short
npm run format:fix
npm run lint:check
npm run build

# Run the feature's test or Postman requests before staging.
git add <only-the-related-files>
git diff --cached
git commit -m "feat(scope): clear completed outcome"
git push origin HEAD
```

Rules:

- Do not use `git add .` without reviewing `git status` first.
- Do not commit broken or half-finished code merely to increase the count.
- Do not commit `.env`, personal credentials, gateway secrets, `node_modules`, generated build output, `.DS_Store`, or `__MACOSX` files.
- Do not combine unrelated modules in one vague commit such as `update code`, `final`, `done`, or `bug fix`.
- If verification exposes a defect before commit, fix it inside the feature commit. If a defect is discovered after push, use a separate descriptive `fix(scope): ...` commit.
- Never rewrite or squash the submitted history after the evaluator can access it.

## 11. Test and Postman checklist

### Shared API behavior

- Every success response has `success`, `message`, and `data`.
- Every failure response has `success`, `message`, and `errors`.
- Invalid UUID/path parameter returns 400, not 500.
- Unknown endpoint returns structured 404.
- Pagination prevents unreasonable/negative limits.
- Passwords, refresh secrets, gateway credentials, and full gateway payloads are never returned.

### Authentication and authorization

- Credential registration and login success/failure.
- Google token: valid, expired, wrong audience, unverified email, and duplicate-email linking.
- Missing/invalid/expired access token returns 401.
- Correct token with wrong role returns 403.
- Blocked/deleted account token is rejected.
- Instructor cannot access another instructor's section.
- Student cannot access another student's transcript, invoice, or payment.

### Core academic flow

- Admin creates department → program → course → prerequisite → semester → section.
- Student registration succeeds only when every rule passes.
- Concurrent last-seat request creates exactly one enrollment.
- Drop returns capacity safely.
- Attendance accepts only active enrolled students.
- Exam weights and marks are valid.
- Draft result is private; published result is visible.
- GPA/CGPA matches a manual sample.

### Payment

- Initiation uses owned unpaid invoice and exact amount.
- Gateway execution/query confirms payment server-side.
- Success updates payment and invoice in one transaction.
- Cancel/failure does not mark invoice paid.
- Repeated callback is idempotent.
- Transaction IDs are unique.
- Student cannot initiate or inspect another student's payment.

### Postman collection organization

```text
00 Health
01 Auth
02 Users
03 Departments
04 Programs
05 Courses and Prerequisites
06 Semesters
07 Sections
08 Enrollments
09 Attendance
10 Exams and Results
11 Transcript
12 Fees and Payments
13 Notifications
14 Reports
15 Negative and RBAC Examples
```

Use collection variables for `baseUrl`, role tokens, IDs created by earlier requests, and bKash callback data. Add example success/error responses and short descriptions for every important endpoint.

## 12. Deployment plan

1. Create production PostgreSQL and Redis services.
2. Deploy the Express API to Render.
3. Set environment variables in the provider dashboard, not the repository.
4. Build command: install dependencies, generate Prisma client, and compile TypeScript.
5. Release/start process must run `prisma migrate deploy` safely before the application starts.
6. Seed only dedicated evaluator accounts and deterministic catalog samples; the seed must be idempotent.
7. Configure production cookie values (`httpOnly`, `secure`, appropriate `sameSite`) and allowed origins.
8. Set the exact public bKash callback URL in gateway configuration.
9. Verify `/health`, database, Redis, auth, registration, enrollment, results, and payment against the live API.
10. Run the exported Postman collection using the live `baseUrl`.

## 13. README and submission contents

The README must include:

- Problem statement and implemented scope.
- Technology stack and architecture flow: `Route → Validation/Auth → Controller → Service → Prisma`.
- Three-role permission table.
- ER diagram and important database constraints.
- Core business rules for prerequisites, registration, GPA, and payment.
- Local setup and environment variable names without secret values.
- Migration, seed, lint, build, test, and start commands.
- Live API URL and published Postman documentation URL.
- Dedicated demo-role information or a clear note that evaluator credentials are provided in submission.
- Known limitations, if any.

Exact submission format:

```text
Project Name    : University Management System
Backend Repo    : https://github.com/<username>/<repository>
Live API        : https://<deployment-domain>
API Docs        : https://documenter.getpostman.com/view/<id>
Demo Video      : https://drive.google.com/file/d/<id>/view
Admin Email     : <dedicated-demo-admin-email>
Admin Password  : <dedicated-demo-admin-password>
```

## 14. Video walkthrough plan (5–10 minutes)

| Time | Demonstration |
| --- | --- |
| 0:00–0:45 | Project problem, three roles, architecture, and live URL |
| 0:45–1:45 | Credential login and Google student login |
| 1:45–2:30 | Role protection: show a Student receiving 403 on an admin route |
| 2:30–3:45 | Super Admin catalog CRUD and section setup |
| 3:45–5:00 | Student course registration and one rejected registration rule |
| 5:00–6:00 | Instructor attendance, exam marks, and result publication |
| 6:00–6:45 | Student GPA/transcript response |
| 6:45–7:45 | bKash payment initialization, callback verification, and database status |
| 7:45–8:30 | Validation error, 401, 403, and 404 response formats |
| 8:30–9:15 | Technical challenge: serializable enrollment transaction and capacity safety |
| 9:15–10:00 | Postman documentation, deployment, and closing summary |

## 15. Definition of done

The project is ready to submit only when all of the following are true:

- Three distinct roles are implemented and demonstrated.
- Email/password and Google login work on the deployed API.
- All applicable inputs are validated with Zod.
- All responses follow the mandatory success/error structures.
- PostgreSQL/Prisma relations, constraints, indexes, migrations, and transactions are present.
- Course prerequisite, registration capacity, credit limit, time-conflict, and academic-history rules work.
- Attendance, exams, published results, GPA/CGPA, and transcript work.
- A real bKash payment is created and verified server-side.
- Postman documentation covers all important endpoints and negative examples.
- At least 20 meaningful commits exist; this plan targets 45, each pushed immediately.
- The live API and demo credentials work from a clean/incognito environment.
- The 5–10 minute video covers all required rubric items.
- No secrets or personal passwords are committed.

## 16. Scope control if time becomes tight

Do not remove mandatory requirements. Preserve this order:

1. Response/error/validation contract.
2. Database correctness and migrations.
3. Three-role authentication and authorization.
4. Academic catalog and transaction-safe enrollment.
5. Attendance, exams, results, and transcript.
6. Real payment and verified callbacks.
7. Postman documentation, deployment, and video.
8. Redis caching and richer reports.
9. Optional email templates, advanced audit views, and extra analytics.

If a non-mandatory enhancement threatens deployment or documentation, record it as a future improvement instead of leaving a mandatory flow incomplete.
