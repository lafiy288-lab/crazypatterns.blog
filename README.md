# PatternNest — *Your creative ideas*

A marketplace website for digital craft patterns (crochet, knitting, sewing, crafts, felting, embroidery).
Visitors browse, search, filter, save favorites (in their browser) and open patterns — there are **no visitor
accounts, carts or checkout**. A single admin manages everything at `/admin`.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer Motion · Prisma (SQLite locally, Postgres in
production) · Zod · JWT in an httpOnly cookie (jose) + bcrypt · sharp for images.

---

## 1. Quick start

Requires **Node.js 20+** (tested with Node 24).

> On this Mac, Node is installed at `~/.local/node/current/bin` but is not on your `PATH`.
> Run this once per terminal (or add it to `~/.zshrc`):
> ```bash
> export PATH="$HOME/.local/node/current/bin:$PATH"
> ```

```bash
cd patternnest
npm install
cp .env.example .env        # then edit ADMIN_EMAIL / ADMIN_PASSWORD / AUTH_SECRET
npm run setup               # creates the SQLite database and seeds demo data
npm run dev                 # http://localhost:3000
```

Production mode locally:

```bash
npm run build
npm start
```

Useful scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` / `npm start` | Production build / server |
| `npm run setup` | `prisma db push` + seed (first run) |
| `npm run db:seed` | Re-seed demo catalogue (wipes products, categories, designers, reviews, articles, import history) |
| `npm run db:reset` | Drop the database, recreate and seed |
| `npm run typecheck` | TypeScript check |

The seed renders original placeholder artwork into `public/placeholders/` (no third-party images) and creates
6 categories, 15 designers, 60 products, 30 reviews (4 pending moderation) and 8 articles.

## 2. Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | `file:./dev.db` for SQLite, or a Postgres URL in production |
| `NEXT_PUBLIC_SITE_URL` | yes | Public URL, used for canonical links, Open Graph and `sitemap.xml` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | yes | The single admin account. Hashed with bcrypt into the DB on first seed/login |
| `AUTH_SECRET` | yes | 32+ random characters for signing the session JWT (`openssl rand -base64 48`) |
| `STORAGE_DRIVER` | no | `local` (default), `cloudinary` or `supabase` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | for Cloudinary | Image uploads |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET` | for Supabase Storage | Image uploads (bucket must be public) |
| `NEXT_PUBLIC_EUR_RATE` | no | Fixed USD→EUR rate for the currency selector (default `0.92`) |

## 3. Logging in to the admin

1. Open <http://localhost:3000/admin>.
2. Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`.

There is no registration page. Login is rate-limited (5 attempts / 15 min / IP); sessions last 8 hours.
The admin account is created **once** — changing `ADMIN_PASSWORD` later has no effect on an existing account.
To reset it, delete the row and log in again (the account is recreated from `.env`):

```bash
npx prisma db execute --stdin <<< 'DELETE FROM "Admin";'
```

## 4. Bulk import

See [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md#importing-a-csv) for the step-by-step guide. In short:
**Admin → Bulk import**, drop a CSV/XLSX/JSON file (≤ 20 MB), confirm the column mapping, review validation,
pick options, run. Rows are processed in batches of 100 in the background with a live progress bar; every
import can be rolled back from the history table.

- Template: `public/templates/patternnest-import-template.csv` (also downloadable in the wizard)
- Sample with 20 rows: `public/templates/sample-import.csv`

## 5. Project structure

```
prisma/              schema.prisma, seed.ts, placeholder artwork generator
public/placeholders  generated demo images        public/templates  import CSVs
storage/uploads      uploaded images (local driver; served at /media/*)
storage/imports      parsed import files (temporary)
src/app/(site)       public pages (home, category, product, search, free patterns, articles, contact, favorites…)
src/app/admin        login + admin panel (sidebar layout in (panel)/)
src/app/api          public API + /api/admin/* (all authenticated)
src/components       site/, home/, product/, listing/, ui/, admin/
src/lib              db, auth/session, validation (Zod), products queries, settings, storage adapters, images, import/
src/middleware.ts    admin protection + CSRF origin check
```

## 6. Public API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/products` | `q, category, sub, designer, min, max, rating, free=free\|paid, video=1, lang, difficulty, sale=1, flag=bestseller\|new\|sponsored\|featured, sort=popular\|newest\|price-asc\|price-desc\|rating, page, perPage (≤60)` or `ids=a,b,c` |
| GET | `/api/products/[slug]` | Product with approved reviews |
| GET | `/api/categories` | Categories with subcategories and product counts |
| GET | `/api/articles` | Paginated published articles |
| POST | `/api/subscribe` | `{ email }` — 5/min/IP |
| POST | `/api/contact` | `{ name, email, subject, body, productId? }` — 5/10 min/IP |
| POST | `/api/reviews` | `{ productId, name, rating, text }` — stored as *pending*, 3/10 min/IP |

Everything under `/api/admin/*` requires the admin session cookie.

## 7. Security & performance notes

- **Auth:** bcrypt (cost 12) password hash, HS256 JWT in an `httpOnly`, `SameSite=Strict`, `Secure` (in production) cookie.
  `/admin/*` and `/api/admin/*` are guarded by middleware **and** by `requireAdmin()` in every handler.
- **CSRF:** every non-GET `/api/*` request must carry an `Origin` header matching the host; plus SameSite=Strict cookies.
- **Validation:** all inputs go through Zod; rich text is sanitised with an allow-list (`sanitize-html`); review/contact
  text is stripped of HTML; forms include a honeypot field.
- **Uploads:** images only (JPG/PNG/WebP/GIF/AVIF, 8 MB each), re-encoded to WebP by sharp. Import files ≤ 20 MB;
  remote image downloads block private/loopback/link-local addresses (SSRF protection).
- **Headers:** HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`; admin is `noindex`.
- **Caching:** home, categories, articles and the top 50 product pages are statically generated with ISR (5 min) and
  revalidated instantly when the admin saves anything. Listings are paginated server-side (24 per page) — the full
  catalogue is never loaded at once.
- **Lighthouse** (production build, mobile emulation, measured locally): Home 91 / 97 / 100 / 100,
  Product 95 / 100 / 100 / 100, Category 94 / 100 / 100 / 100, Articles 96 / 100 / 100 / 100
  (Performance / Accessibility / Best practices / SEO).

## 8. Deploying (Vercel + Supabase/Neon + Cloudinary)

1. **Database.** Create a Postgres database on [Supabase](https://supabase.com) or [Neon](https://neon.tech).
   In `prisma/schema.prisma` change `provider = "sqlite"` to `provider = "postgresql"`. Locally, point
   `DATABASE_URL` at it and run:
   ```bash
   npx prisma db push
   npm run db:seed    # optional demo data
   ```
   (For a migration history use `npx prisma migrate dev --name init` instead of `db push`.)
2. **Images.** Serverless hosts have a read-only filesystem, so set `STORAGE_DRIVER=cloudinary` (and the three
   `CLOUDINARY_*` vars) or `STORAGE_DRIVER=supabase` (and the `SUPABASE_*` vars, with a public bucket).
3. **Vercel.** Import the repository, set the root directory to `patternnest`, add all env vars from the table
   above (`NEXT_PUBLIC_SITE_URL` = your domain, a fresh `AUTH_SECRET`), and deploy. The default build command works:
   `npm install` runs `prisma generate` (postinstall), then `next build`.
4. **Bulk imports on serverless.** The importer runs in the background of the Node process. On Vercel a function
   stops after its time limit, so for big catalogues either run imports from a long-running Node host
   (Railway/Render/Fly.io/a VPS with `npm start`), or import locally against the production database.
5. **Rate limiting** is in-memory per instance. For multi-instance deployments swap `src/lib/rate-limit.ts` for a
   shared store (e.g. Upstash Redis).
6. **Search.** Uses case-insensitive `LIKE` matching on every term (title, description, subcategory, designer,
   category, SKU). On Postgres you can upgrade to a `tsvector` full-text index for very large catalogues.

## 9. Decisions & defaults (things the brief left open)

- **SQLite** for local development; schema stores arrays (images, languages) as JSON strings so it runs unchanged on Postgres.
- **Uploaded images** live in `storage/uploads` and are served by the `/media/[...path]` route rather than from
  `public/uploads`, because Next.js does not serve files added to `public/` after a production build.
- **"Get Pattern"**: opens the external `getPatternUrl` if set, otherwise a request form that lands in Admin → Messages.
- **Currency selector**: display-only conversion with a fixed rate (`NEXT_PUBLIC_EUR_RATE`); language is English only.
- **Forum**: the homepage "Forum" box links to a "coming soon" page.
- **Payment icons**: neutral text badges (no third-party logos), since there is no checkout.
- **Dark mode**: toggle in the header; remembers the choice, defaults to the system setting.
- **Emails**: no SMTP is configured; newsletter sign-ups and messages are stored in the database (export subscribers as CSV).
