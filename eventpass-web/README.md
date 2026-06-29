# EventPass — Web

EventPass is a ticketing site for events in Milano and Torino — browse, buy, and get
a QR ticket in under a minute. It's the web half of a two-app system: organisers run
the door with a companion mobile app, but both apps talk to the same Postgres
database and the same ticket-checking logic, so a ticket sold on the web scans fine
at the gate either way.

## Demo credentials

| Email | Password | Role | What you can do with it |
|---|---|---|---|
| `organiser@eventpass.demo` | `demo1234` | ORGANISER | `/organiser` dashboard, and it's the only role that can sign into the mobile app |
| `buyer@eventpass.demo` | `demo1234` | BUYER | Browse events, check out, view tickets under `/account/tickets` |

Want your own account? `/auth/signup` will make you a `BUYER`. One catch: real
signups have to pass the password rules described further down, and `demo1234`
wouldn't — it only exists because the seed script writes it straight into the
database, skipping that check entirely.

## Getting started

```bash
npm install
npm run db:generate   # generates the Prisma client
npm run db:migrate    # applies the schema to your Postgres database
npm run db:seed       # loads 6 demo events plus the two accounts above
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). You'll need these in
`.env.local`:

```
DATABASE_URL=postgresql://...        # Neon/Postgres connection string
AUTH_SECRET=...                      # Auth.js session signing secret
JWT_SECRET=...                       # signs each ticket's QR code
MOBILE_AUTH_SECRET=...               # signs the mobile app's bearer tokens
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## What this is built with

The short version: Next.js on top, Postgres underneath, and a handful of small
libraries doing one job each rather than one big framework doing everything.

**Framework & UI**
- [Next.js 16](https://nextjs.org) (App Router, Turbopack) — pages, API routes, and the `proxy.ts` request gate all live in one app
- [React 19](https://react.dev) for components, with server components doing most of the data fetching so the client bundle stays small
- [Tailwind CSS 4](https://tailwindcss.com) for styling
- [TypeScript](https://www.typescriptlang.org) everywhere, strict mode on

**Database & data access**
- [PostgreSQL](https://www.postgresql.org), hosted on [Neon](https://neon.tech) — serverless, so it spins down when nobody's hitting it
- [Prisma 7](https://www.prisma.io) as the ORM, talking to Postgres through the `@prisma/adapter-pg` driver adapter (Prisma 7 won't let you put a connection string straight in `schema.prisma` anymore, so `src/backend/db.ts` wires up a `pg.Pool` by hand at runtime)

**Auth & passwords**
- [Auth.js v5](https://authjs.dev) (`next-auth`) for the web session — credentials login, JWT cookies, no OAuth providers needed for this app
- A second, completely separate bearer-token system for the mobile app, signed with its own secret (`jsonwebtoken`) and checked on every mobile API call by `getMobileUser()`
- Passwords are hashed with **Argon2id** via `@node-rs/argon2`. Accounts that predate the switch were hashed with `bcryptjs`, so `verifyPassword()` checks the hash prefix and calls whichever library actually produced it — nobody has to reset their password because we changed algorithms
- A password has to be 8+ characters with an uppercase letter, a lowercase letter, a number, a special character, and it can't contain the person's name or email. The signup page checks this live as you type (green/red checklist) and the server checks it again before touching the database, since client-side checks are a UX nicety, not security

**Tickets & PDFs**
- [`qrcode`](https://www.npmjs.com/package/qrcode) renders the QR code itself; the underlying token is a JWT containing the event, gate, and a unique ID, so scanning it doesn't require a database round-trip to know if it's well-formed
- [`@react-pdf/renderer`](https://react-pdf.org) generates the downloadable PDF ticket on demand — no headless browser, no stored PDFs sitting on a disk somewhere

**What's deliberately not here**
- No payment processor. Checkout creates a `PAID` order directly — there's no real money changing hands in this build, so wiring up Stripe would just be extra surface area for nothing
- No remote image hosting. Event photos and the homepage hero live in `public/`, so there's no third-party image domain to whitelist and no external request slowing down the first paint

## How it's organised

```
src/
├── backend/                  data access + business logic
│   ├── db.ts                  Prisma client singleton (driver adapter)
│   ├── mobileAuth.ts          sign/verify the mobile bearer token
│   ├── password.ts            hashPassword() / verifyPassword() — Argon2id, with bcrypt fallback
│   └── services/
│       ├── events.ts          event queries for the homepage and event page
│       ├── orders.ts          createOrder() — used by both web checkout and mobile "add guest"
│       ├── tickets.ts         a buyer's "My Tickets" queries
│       ├── organiser.ts       sales + check-in numbers for the organiser dashboard
│       ├── mobileEvents.ts    event/guest CRUD for the mobile app, built on orders.ts
│       └── checkin.ts         checkInByQrToken() — verifies the JWT, records the check-in
│
├── lib/
│   └── passwordRules.ts       the password policy itself, shared by the signup UI and the server action
│
├── frontend/                  UI components
│   ├── Nav.tsx, Footer.tsx
│   ├── EventCard.tsx, EventDetailClient.tsx, VenueMap.tsx
│   └── PasswordStrength.tsx   the live green/red checklist under the signup password field
│
├── app/                       Next.js routes
│   ├── api/
│   │   ├── auth/[...nextauth]/   Auth.js handlers
│   │   ├── checkout/             creates the order + tickets
│   │   ├── tickets/[id]/pdf/     PDF ticket download
│   │   └── mobile/               the REST API the Expo app talks to
│   │       ├── login/            issues the bearer token
│   │       ├── events/           list/create/delete (+ a /guests sub-route)
│   │       └── checkin/          the scan endpoint
│   ├── account/tickets/...       a buyer's tickets, with QR/PDF/print/share
│   ├── organiser/...             sales dashboard, recent check-ins
│   ├── events/[id]/              the public event page
│   ├── auth/                     sign in / sign up
│   └── loading.tsx (+ a few nested ones)   so a slow page load shows a spinner instead of looking stuck
│
├── auth.ts / auth.config.ts   Auth.js setup (has to live at the src root for the proxy to find it)
└── proxy.ts                   gatekeeps /account and /organiser — this used to be middleware.ts before Next 16 renamed the convention
```

**The data model** (`prisma/schema.prisma`), in plain terms: a `User` owns `Event`s
and places `Order`s. An `Event` has `TicketType`s, each with its own price, gate,
and quantity. An `Order` produces `Ticket`s, each carrying a signed `qrToken` and a
gate assignment. When a ticket gets scanned, that produces exactly one `CheckIn`
recording the gate and who scanned it. There's also a `GateAdmin` model sitting
there unused for now — it's reserved for a per-gate invite flow that hasn't been
built yet.

Worth knowing: a mobile-created event isn't a special case in the schema. It's a
real `Event` row with one auto-generated, free `TicketType`, and "adding a guest"
on the mobile app calls the exact same `createOrder()` function the web checkout
uses — just with a quantity of 1 and a price of 0. That's why an organiser's
offline door-list and a web ticket purchase show up identically everywhere,
without any special-casing.

Buying a ticket and scanning one both touch shared inventory under concurrent
load, so both are wrapped in a Prisma transaction with an atomic guard on the
write (`updateMany` with a `WHERE` clause checking remaining stock, rather than a
separate read-then-write). Two people can't buy the last ticket at the same
moment, and two door scanners can't both check the same QR code in at once.

## Where things stand

The full build log lives in [`PLAN.md`](./PLAN.md). Short version: milestones
M0 through M5 are done. M6's check-in API works (the mobile app uses it daily),
but there's no in-browser `/scan` camera page yet — that's still mobile-only.
M7 (gate-admin invites) and M8 (actually deploying this) haven't been started.
