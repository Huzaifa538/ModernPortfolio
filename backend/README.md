# ModernPortfolio — Backend API

Express + MongoDB (Mongoose) API powering the portfolio site and its admin panel. No paid services anywhere: dev uses an in-memory MongoDB via `mongodb-memory-server`, and file uploads are plain disk storage.

## Quick setup

```bash
npm install
cp .env.example .env   # then edit the values to taste
npm run seed           # create the admin user + demo content
npm run dev            # nodemon on http://localhost:5000
```

## Environment variables

| Key | What it does |
|---|---|
| `PORT` | Port the API listens on (default `5000`) |
| `USE_IN_MEMORY_DB` | `true` = in-memory MongoDB for dev (no install needed); `false` = use `MONGO_URI` |
| `MONGO_URI` | Real MongoDB connection string when `USE_IN_MEMORY_DB=false` |
| `JWT_SECRET` | Secret for signing admin JWTs (64-char hex is good) |
| `CLIENT_URL` | Frontend origin allowed by CORS |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Credentials created by `npm run seed` |

## Endpoints

**Public**
- `GET /api/health` — liveness check
- `GET /api/public/portfolio` — profile, projects, skills, experiences, testimonials in one call
- `GET /api/public/projects/:slug` — single project
- `POST /api/public/contact` — contact form (honeypot `website` field, rate-limited)

**Auth**
- `POST /api/auth/login` — `{ username, password }` → `{ token, username }` (rate-limited)
- `GET /api/auth/me` — current admin (Bearer token)

**Admin** (all require `Authorization: Bearer <token>`)
- `PUT /api/admin/profile` — upsert the single profile
- `GET|POST /api/admin/projects`, `GET|PUT|DELETE /api/admin/projects/:id`
- `GET|POST /api/admin/skills`, `PUT|DELETE /api/admin/skills/:id`
- `GET|POST /api/admin/experiences`, `PUT|DELETE /api/admin/experiences/:id`
- `GET|POST /api/admin/testimonials`, `PUT|DELETE /api/admin/testimonials/:id`
- `PUT /api/admin/reorder/:type` — `:type` in `projects|skills|experiences|testimonials`, body `{ ids: [...] }`
- `GET /api/admin/messages` — `?unread=true`, `?starred=true`, `?search=...`
- `PATCH /api/admin/messages/:id/read` — body `{ isRead }`
- `PATCH /api/admin/messages/:id/star` — body `{ isStarred }`
- `DELETE /api/admin/messages/:id`
- `GET /api/admin/stats` — counts + last 5 messages
- `POST /api/admin/upload` — multipart `file` field → `{ url: "/uploads/<filename>" }`

## Project layout

```
server.js            # app wiring, rate limits, DB connection
seed.js              # demo data script
middleware/          # auth, upload (multer), validate, errorHandler
models/              # User, Profile, Project, Skill, Experience, Testimonial, Message
routes/              # auth, public, admin
uploads/             # uploaded files (served at /uploads/*)
```
