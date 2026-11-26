# OAS Bay — Oyera Auto Service Bay Ltd

A records management web application for a car service bay: customers, cars, technicians, parts
inventory, service visits/invoicing, and reports.

**Stack:** Node.js + Express (JSON REST API) + MongoDB (Mongoose) on the backend, and plain
**HTML + CSS + JavaScript** pages on the frontend (multiple `.html` files, no templating engine —
each page calls the API with `fetch()`). Session-based authentication with admin and staff roles.
The navbar is a responsive sidebar that collapses into a hamburger menu on phones/tablets.

## 1. Requirements

- Node.js 18+ installed
- A MongoDB Atlas cluster (you already have one) or local MongoDB

## 2. Run everything locally (recommended way to use/mark this project)

```bash
cd oas-bay
npm install
cp .env.example .env
```

Edit `.env`:
- Replace `<db_password>` in `MONGODB_URI` with your real MongoDB Atlas password.
- Set a random `SESSION_SECRET`.
- Leave `FRONTEND_ORIGIN` blank — it's only needed for the split-deployment case below.

Seed the first admin account (staff can self-register from `register.html`, but admins are
created via script):

```bash
npm run seed:admin
```

Optionally prefill the parts catalog with prices from the business brief:

```bash
npm run seed:parts
```

Start the app:

```bash
npm start
```

Open **http://localhost:3000** — the server serves `public/index.html` at `/`, which checks if
you're logged in and sends you to `dashboard.html` or `login.html` automatically.

## 3. Deploying the frontend to Netlify

Netlify only hosts static files — it **cannot run** this project's Node/Express/MongoDB backend.
So a Netlify deploy only ever covers the `public/` folder (the HTML/CSS/JS). You still need to
host the backend (`server.js` + `/api/...`) somewhere that runs Node, e.g. Render, Railway,
Fly.io, or a VPS.

Steps:

1. **Deploy the backend first**, to any Node host. Set its environment variables there
   (`MONGODB_URI`, `SESSION_SECRET`, `NODE_ENV=production`, and `FRONTEND_ORIGIN` — see step 3).
   Note the URL it gives you, e.g. `https://oas-bay-api.onrender.com`.
2. **Point the frontend at it.** Edit `public/js/config.js`:
   ```js
   const OAS_API_BASE = "https://oas-bay-api.onrender.com";
   ```
3. **Allow that frontend's origin on the backend.** Once you know your Netlify URL (Netlify
   assigns one on first deploy, e.g. `https://oas-bay.netlify.app`), set `FRONTEND_ORIGIN` to it
   in the backend's environment variables and redeploy the backend. This is required — without
   it, the browser will block the cross-origin login/session cookie.
4. **Deploy `public/` to Netlify.** `netlify.toml` at the project root already sets:
   ```toml
   [build]
     publish = "public"
   ```
   So you can either drag-and-drop the `oas-bay` folder into Netlify, or connect the repo and let
   it read `netlify.toml` automatically — no build command needed, since these are plain static
   files.

If you don't need a public deployment and are just running/marking this locally, skip this whole
section — `npm start` alone is enough.

## 4. Project structure

```
oas-bay/
├── server.js               # Express app: serves /public (HTML/CSS/JS) + mounts /api routes
├── netlify.toml             # Netlify config (publishes the "public" folder only)
├── config/db.js             # MongoDB connection
├── models/                  # Mongoose schemas (User, Customer, Car, Technician, Part, ServiceVisit)
├── middleware/auth.js       # requireLogin / requireAdmin guards for the API
├── routes/api/              # JSON REST endpoints (auth, dashboard, customers, cars, parts,
│                             #   technicians, visits, reports)
├── public/                  # The actual frontend — plain HTML pages + shared CSS/JS
│   ├── index.html           # Entry point: redirects to dashboard.html or login.html
│   ├── login.html, register.html
│   ├── dashboard.html
│   ├── customers.html, customer.html, customer-new.html
│   ├── cars.html, car.html, car-new.html
│   ├── parts.html, part-new.html
│   ├── technicians.html, technician-new.html
│   ├── visits.html, visit-new.html, visit.html   (invoice)
│   ├── reports.html
│   ├── css/style.css        # Includes the responsive navbar/hamburger styles
│   └── js/
│       ├── config.js        # OAS_API_BASE — edit this only for a split Netlify+backend deploy
│       └── common.js        # auth check, sidebar/hamburger nav, fetch helper — shared by every page
└── scripts/                 # One-off admin/parts seeding scripts
```

All internal links, stylesheets, and scripts use **relative paths** (no leading `/`), so the site
works whether it's opened directly from disk, served from the Express app, or deployed to any
subpath on Netlify or elsewhere.

### How the frontend talks to the backend

Every protected `.html` page starts with:

```js
const user = await requireAuth();   // or requireAuth(true) for admin-only pages
```

This calls `GET /api/auth/me` (prefixed with `OAS_API_BASE` from `config.js`). If nobody's logged
in, it redirects to `login.html`. If logged in, it renders the sidebar/hamburger nav and loads
page data via more `fetch()` calls (e.g. `GET /api/customers`). Forms submit with `fetch()` +
`POST` instead of a normal HTML form submit, so the page never fully reloads.

### Responsive navbar

On screens ≤860px, the sidebar becomes an off-canvas menu: a hamburger button (☰) appears fixed
top-left, tapping it slides the sidebar in over a dimmed overlay, and tapping a link or the
overlay closes it again. This is implemented in `public/js/common.js` (`setupResponsiveNav`) and
`public/css/style.css` (the `@media` rules near the bottom).

## 5. Roles

| Action                              | Staff | Admin |
|--------------------------------------|:-----:|:-----:|
| Register customers, cars             | ✅    | ✅    |
| Create service visits / invoices     | ✅    | ✅    |
| View parts inventory                 | ✅    | ✅    |
| Add parts / edit pricing / restock   | ❌    | ✅    |
| Add / manage technicians             | ❌    | ✅    |
| View reports                         | ❌    | ✅    |

## 6. Business rules encoded in the system

- Labour charge: **20,000 UGX**, auto-applied whenever a bay service (oil/brake/greasing) is
  performed on a visit.
- Wheel alignment: **30,000 UGX** flat.
- Wheel balance: **20,000 UGX** flat.
- A visit can include multiple services, multiple technicians, and multiple parts.
- Selecting parts on a visit automatically deducts them from stock; the system blocks the visit
  if stock is insufficient.
- Every visit produces a printable invoice (`visit.html?id=...`, with a Print button).
- The dashboard flags parts at or below their reorder level.
