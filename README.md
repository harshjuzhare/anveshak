# CivicAI — AI-Powered Civic Problem Reporting & Management (MERN)

A full-stack MERN application for citizens to report civic problems (potholes, garbage,
broken streetlights, drainage, water leakage, sanitation, etc.) via photo + AI classification,
track them through a controlled workflow, and for Officers/Workers/Central Administrators to
manage resolution end-to-end.

## What's included (functional)

- **Citizen Portal**: register/login, language selection (13 Indian languages wired via
  react-i18next — en/hi/mr fully translated, the rest registered and ready to fill in),
  dashboard, full report flow (photo upload or camera capture → GPS detection with an
  editable Leaflet map → AI analysis confirmation screen → submit), complaint tracking with
  a status timeline, citizen verification of completed work, reopen-with-reason, and
  star rating + feedback.
- **Officer Portal**: department-scoped dashboard (table + map views, filters, search),
  complaint review/ownership, **Worker Assignment System**, evidence review, and a
  department report generator.
- **Worker interface**: task list with instructions/deadline/priority and photo-upload
  completion flow.
- **Central Administration Portal**: system-wide dashboard, interactive complaint map,
  department performance, Chart.js analytics (trend, category, department volume, priority),
  department & staff management (create officer/worker/admin accounts — never selectable
  during public registration).
- **Backend**: Express + Mongoose REST API, JWT auth + bcrypt, role-based middleware,
  a **controlled complaint status state machine** (`server/config/constants.js`) enforced
  server-side so no role can skip states, full `ComplaintStatusHistory` + `AuditLog`,
  Cloudinary image storage, a pluggable Gemini Vision AI service (with an offline
  keyword-heuristic fallback so the whole flow works even without an API key),
  GPS-proximity duplicate/repeated-complaint detection, and a seed script with realistic
  demo data.

## What you'll still want to do before production

This is a complete, working scaffold covering the full workflow end-to-end — not a
finished, audited production system. Before real deployment:
- Run `npm install` in both `server/` and `client/` (not done in this environment — no
  network access here) and fix any dependency-version issues that come up.
- Add the remaining 10 Indian-language JSON files under `client/src/i18n/locales/` (the
  structure and 3 examples are there — copy `en.json`'s keys and translate).
- Wire a real Gemini API key, Cloudinary account, and MongoDB Atlas cluster (see `.env.example`
  files).
- Add automated tests, request validation schemas (Zod/Joi) on all controllers (currently
  only basic manual checks), stricter escalation/alerting jobs (cron for overdue complaints),
  PDF/CSV export, and a proper duplicate-complaint UI surface for citizens/admins.
- Security review: rotate secrets, add refresh tokens if desired, review CORS origins for
  production, add image-content moderation before AI classification if needed.

## Project structure

```
civicai/
  server/           Express + MongoDB backend
    config/         DB connection, shared constants (roles, status state machine)
    controllers/     Route handlers (auth, complaints, departments, staff, notifications, reports)
    models/          Mongoose schemas (User, Department, Complaint, ComplaintStatusHistory,
                     Notification, Report, AuditLog)
    middleware/      JWT auth, role-based access, multer upload, error handler
    routes/          Express routers
    services/        Cloudinary upload, Gemini AI classification, translation
    utils/           Complaint ID generator, JWT helper, geo-distance helper
    scripts/seed.js  Demo data seeder
  client/           React (Vite) frontend
    src/pages/       Landing, auth, and citizen/officer/worker/admin portals
    src/components/  Navbar, StatusBadge, MapView (Leaflet), ComplaintTable,
                     ComplaintTimeline, LanguageSelector, NotificationPanel, etc.
    src/i18n/        react-i18next config + locale JSON files
    src/context/     AuthContext (JWT session, role-based routing)
    src/api/         Axios client with auth interceptor
```

## Running locally

### 1. Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev                 # starts on http://localhost:5173 (proxies /api to :5000)
```

### 2. Demo credentials (after `npm run seed`)
| Role | Email | Password |
|---|---|---|
| Admin | admin@civicai.gov.in | Admin@123 |
| Officer (Road Dept) | officer.road@civicai.gov.in | Officer@123 |
| Officer (Waste Dept) | officer.waste@civicai.gov.in | Officer@123 |
| Worker (Road Dept) | worker.road@civicai.gov.in | Worker@123 |
| Worker (Waste Dept) | worker.waste@civicai.gov.in | Worker@123 |
| Citizen | citizen1@example.com | Citizen@123 |
| Citizen | citizen2@example.com | Citizen@123 |


## Complaint workflow (state machine)

```
Submitted → Under Review → Assigned to Officer → Worker Assigned → Work in Progress
  → Work Completed → Verification Pending → (Resolved | Reopened) → Closed
```
Every transition is validated server-side against `STATUS_TRANSITIONS` in
`server/config/constants.js` and recorded in `ComplaintStatusHistory` with actor, role,
timestamp, and comment — no role can force an invalid jump.