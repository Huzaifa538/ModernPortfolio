# Modern Portfolio — MERN

A production-quality personal portfolio with a public site and a full admin CMS —
everything managed from the browser, no code changes needed.

- **Public site** — dark-first premium design, aurora background, glassmorphism,
  scroll-spy navbar, typing hero, skills with animated bars, project gallery with
  modals, testimonial carousel, contact form with validation + honeypot.
- **Admin panel** — login at `/admin/login`, dashboard to manage profile, projects,
  skills, experience, testimonials, inbox messages, and settings (change password).

100% free stack. No paid services anywhere.

## Tech

| Backend | Frontend |
|---|---|
| Node.js (CommonJS), Express | Vite, React 19, TypeScript |
| Mongoose + mongodb-memory-server (dev) | Tailwind CSS v4, react-router-dom 7 |
| JWT auth, bcryptjs | framer-motion, lucide-react |
| helmet, rate-limit, express-validator, morgan | react-hot-toast, react-helmet-async, clsx, axios |

Fonts: Space Grotesk (headings), Inter (body), JetBrains Mono (labels).

## Quick start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env     # then edit .env: set a strong JWT_SECRET + admin creds
npm run seed             # creates admin user + sample portfolio data
npm run dev              # http://localhost:5000
```

Default `.env` ships with `USE_IN_MEMORY_DB=true` — no MongoDB install needed,
data lives in memory while the server runs. For persistent data, set
`USE_IN_MEMORY_DB=false` and point `MONGO_URI` at a real MongoDB.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

| Page | URL |
|---|---|
| Public portfolio | http://localhost:5173 |
| Admin login | http://localhost:5173/admin/login |

Admin credentials come from `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `backend/.env`.

## Environment variables

**backend/.env**

| Key | What it does |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | Real MongoDB connection string (used when in-memory is off) |
| `USE_IN_MEMORY_DB` | `true` = zero-setup dev database, `false` = use MONGO_URI |
| `JWT_SECRET` | Secret for signing admin tokens — set a long random string |
| `CLIENT_URL` | Frontend origin allowed by CORS (default http://localhost:5173) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Seeded admin login |

**frontend/.env**

| Key | What it does |
|---|---|
| `VITE_API_URL` | Backend base URL (default http://localhost:5000) |

## API overview

```
GET  /api/health
POST /api/auth/login            {username, password} -> {token, username}
GET  /api/auth/me               (Bearer)

GET  /api/public/portfolio      profile + projects + skills + experience + testimonials
GET  /api/public/projects/:slug
POST /api/public/contact        {name, email, subject?, message, website? honeypot}

PUT  /api/admin/profile         (Bearer) upsert
GET/POST                 /api/admin/projects|skills|experiences|testimonials
PUT/DELETE               /api/admin/<type>/:id
PUT  /api/admin/reorder/:type   {ids: [...]}
GET  /api/admin/messages        ?unread=true&starred=true&search=
PATCH/DELETE             /api/admin/messages/:id[/read|/star]
GET  /api/admin/stats
POST /api/admin/upload          multipart field "file" -> {url}
POST /api/admin/change-password {currentPassword, newPassword}
```

Rate limits: 100 req / 15 min globally · 5 logins / 15 min · 5 contact messages / hour per IP.

## Project layout

```
ModernPortfolio/
├── backend/
│   ├── server.js          express app, rate limits, static /uploads
│   ├── seed.js            admin user + sample data
│   ├── middleware/        auth, upload (multer), validate, errorHandler
│   ├── models/            User, Profile, Project, Skill, Experience, Testimonial, Message
│   └── routes/            auth, public, admin
└── frontend/
    └── src/
        ├── lib/           api.ts (axios), types.ts
        ├── hooks/         useTheme, useScrollSpy, usePortfolio
        ├── components/
        │   ├── layout/    Navbar, Footer, ScrollProgress, CursorGlow, ThemeToggle, BackToTop
        │   ├── sections/  Hero, About, Skills, Experience, Projects, Testimonials, Contact
        │   ├── ui/        Button, Card, Badge, SectionHeading, Skeleton, Modal, Input, Textarea, Toggle
        │   └── admin/     Sidebar, StatCard, DataTable, ImageUploader, ConfirmDialog
        └── pages/         PublicPortfolio, AdminLogin, AdminDashboard (+ admin sub-pages), NotFound
```

## Screenshots

> Add yours here after the first run:
> - `docs/screenshot-home.png` — public hero
> - `docs/screenshot-projects.png` — projects + modal
> - `docs/screenshot-admin.png` — dashboard overview

## Notes

- Uploaded files live in `backend/uploads/` (git-ignored) and are served at `/uploads/<file>`.
- The contact form includes a hidden `website` honeypot field — bots fill it, humans don't.
- Admin routes are lazy-loaded; public images use `loading="lazy"`.
