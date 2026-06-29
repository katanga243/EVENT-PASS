# EventPass — Project Summary (for pasting into a new Claude session)

> Snapshot date: 2026-06-17. This is a two-app system: a mobile app (`EVENT PASS`,
> this repo) and a web app (`eventpass-web`, sibling repo). They share one Postgres
> database — there is no per-app local data store except the mobile login session.

## What EventPass is

A ticketing + door check-in system for events in Milano and Torino.
- **Web app** (`eventpass-web`): public site where buyers browse events, check out, and get a QR ticket (PDF/print/share).
- **Mobile app** (`EVENT PASS`, Expo/React Native): organiser-only tool to create events, manage a guest list, issue complimentary tickets, and scan QR codes at the door.

Both apps talk to the same Postgres database through the same business logic in
`eventpass-web`'s backend — a ticket sold on the website scans fine at the gate
via the phone, and an event/guest created on the phone shows up identically on
the website's organiser dashboard. The mobile app has **no local database**; the
only thing persisted on-device is the login session token.

## Who's behind it

Built by Katanga Jean Dedieu, a student at the DevHope web & mobile dev bootcamp,
as a final project (due June 2026). Started as a simple offline AsyncStorage app
and grew into the two-app, shared-Postgres-backend architecture described below.

---

## Repo 1 — `eventpass-web` (the platform / source of truth)

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) ·
Tailwind CSS 4 · PostgreSQL on Neon · Prisma 7 (via `@prisma/adapter-pg`, since
Prisma 7 no longer allows a connection string directly in `schema.prisma`) ·
Auth.js v5 (`next-auth`) for web sessions · a separate hand-rolled JWT bearer-token
system for the mobile app (`jsonwebtoken`, `src/backend/mobileAuth.ts`) · Argon2id
password hashing (`@node-rs/argon2`) with bcrypt-fallback verification for legacy
accounts · `qrcode` to render ticket QR images · `@react-pdf/renderer` to generate
ticket PDFs on demand (no headless browser, nothing stored on disk).

**Deliberately not included:** no real payment processor (checkout writes a `PAID`
order directly), no remote image hosting (images live in `public/`).

### Data model (`prisma/schema.prisma`)
- `User` (Role: `BUYER` / `ORGANISER` / `GATE_ADMIN`) owns `Event`s and places `Order`s.
- `Event` (city: `MILANO` / `TORINO`) has many `TicketType`s (name, price, gate, quantity, soldCount).
- `Order` (`PENDING`/`PAID`/`FAILED`) produces `Ticket`s.
- `Ticket` carries a signed, unique `qrToken` (JWT) + assigned gate + status (`VALID`/`CHECKED_IN`).
- `CheckIn` — one per ticket scan, records gate + which user scanned it.
- `Seat` — per-ticket-type seat inventory (`AVAILABLE`/`SOLD`).
- `GateAdmin` — invite-by-email model for per-gate scanner accounts; **schema exists but the invite flow isn't built yet.**

**Key design decision:** a mobile-created event is not a special case — it's a real
`Event` row with one auto-generated free `TicketType`. "Add guest" on mobile calls
the *exact same* `createOrder()` function the web checkout uses (qty 1, price 0),
so it's subject to the same capacity checks and shows up identically everywhere.

**Concurrency safety:** both buying a ticket and scanning one mutate shared
inventory, so both run inside a Prisma transaction with an atomic guard on the
write (`updateMany` + a `WHERE` clause on remaining stock, not read-then-write).
Prevents overselling and double-check-in races.

### Backend services (`src/backend/services/`)
| File | Responsibility |
|---|---|
| `events.ts` | event queries for homepage / event detail page |
| `orders.ts` | `createOrder()` — shared by web checkout *and* mobile "add guest" |
| `tickets.ts` | a buyer's "My Tickets" queries |
| `organiser.ts` | sales + check-in numbers for the organiser dashboard |
| `mobileEvents.ts` | event/guest CRUD for the mobile app, built on `orders.ts` |
| `checkin.ts` | `checkInByQrToken()` — verifies the JWT, records the `CheckIn` |

Plus `db.ts` (Prisma client singleton via driver adapter), `mobileAuth.ts`
(sign/verify mobile bearer token), `password.ts` (hash/verify, Argon2id + bcrypt
fallback).

### Password policy (`src/lib/passwordRules.ts`)
8+ chars, upper, lower, number, special char, can't contain the user's name or
email. Checked live on the signup form (green/red checklist,
`PasswordStrength.tsx`) *and* re-checked server-side before writing to the DB.

### Routes / pages (`src/app/`)
- Public: `/` (homepage, event list), `/events/[id]` (event detail + venue/gate map SVG)
- Auth: `/auth/signin`, `/auth/signup`
- Buyer (protected): `/account/tickets`, `/account/tickets/[ticketId]` (QR/PDF/print/share), `/account/profile`, `/account/profile/settings`
- Checkout: `/api/checkout`, `/checkout/success`
- Organiser (protected): `/organiser` (my events), `/organiser/new`, `/organiser/[eventId]` (sales, check-in rate, recent check-ins table), `/organiser/finance`
- Mobile REST API (`/api/mobile/...`): `login`, `events` (list/create), `events/[eventId]` (delete), `events/[eventId]/guests` (list/add), `checkin`
- `src/proxy.ts` — route gate for `/account` and `/organiser` (replaces `middleware.ts`, renamed in Next 16)

### Design tokens
| Token | Value |
|---|---|
| Background | `#ffffff` |
| Soft surface | `#f4f6fb` |
| Ink | `#0a0a0f` |
| Primary blue | `#1452f0` |
| Blue tint | `#e8efff` |
| Black sections | `#0a0a10` |
| Border | `#e6e9f1` |
| Fonts | Manrope (body), Space Grotesk (display/numbers) |

### Build status (see `PLAN.md`)
- ✅ M0 Scaffold, M1 Public website, M2 Auth, M3 Checkout (Stripe-test-style, no real Stripe), M4 Ticket (QR/PDF/print/share), M5 Organiser dashboard
- 🔶 M6 Scanner — the check-in API (`checkInByQrToken`, `/api/mobile/checkin`) is done and used daily by the mobile app; an in-browser `/scan` camera page (planned via `@zxing/browser`) is **not built**
- ⬜ M7 — gate-admin invite flow (schema exists, no UI/logic)
- ⬜ M8 — polish, live updates (SSE/polling), deploy to Vercel + Neon

### Demo accounts (seeded)
| Email | Password | Role |
|---|---|---|
| `organiser@eventpass.demo` | `demo1234` | ORGANISER (web dashboard + only role allowed to log into mobile) |
| `buyer@eventpass.demo` | `demo1234` | BUYER (browse/buy/view tickets) |

---

## Repo 2 — `EVENT PASS` (the Expo mobile companion app)

**Stack:** Expo SDK 54 · React Native 0.81 · React 19 · React Navigation
(native-stack) · `expo-camera` (`CameraView`) for QR scanning ·
`react-native-qrcode-svg` to render a guest's ticket QR · `@react-native-async-storage/async-storage`
for the login session only · Manrope + Space Grotesk via `@expo-google-fonts`.

**No local database.** Every read/write (events, guests, check-ins) goes over
HTTP to `eventpass-web`'s API. Mobile login is restricted to `ORGANISER` accounts
(`GATE_ADMIN` mobile login is a planned, unbuilt extension).

### Architecture
```
src/
├── backend/                  networking + session layer
│   ├── config.js              API_BASE_URL — must be set to dev machine's LAN IP
│   ├── session.js             AsyncStorage wrapper for { token, user }
│   └── api.js                 fetch wrapper: login, getEvents, createEvent,
│                               deleteEvent, getGuests, addGuest, checkIn, logout
│                               — attaches Bearer token, 8s timeout via AbortController,
│                               clears session + flags SESSION_EXPIRED on 401
└── frontend/
    ├── theme.js                shared color tokens (C, F)
    └── screens/
        ├── LoginScreen.js
        ├── HomeScreen.js          event list, create/delete, logout
        ├── CreateEventScreen.js
        ├── EventDetailScreen.js   guest list + live check-in counter
        ├── AddGuestScreen.js      issues a complimentary ticket + QR
        ├── TicketViewScreen.js    full-screen QR (the ticket's signed qrToken), share
        └── ScannerScreen.js       camera scan → POST /api/mobile/checkin
```
`App.js` loads fonts, checks for a saved session via `getSession()`, and routes
to `Login` or `Home` accordingly. Navigation: native-stack with custom header
styling using the shared theme.

### How mobile maps onto the web's real schema
- **Create event** → real `Event` row + one auto `TicketType` (`General`, price 0, quantity = capacity)
- **Add guest** → calls the same `createOrder()` as web checkout (qty 1, price 0) → same capacity checks
- **Scan QR** → decodes the signed `qrToken` JWT, posts to `/api/mobile/checkin`, which verifies signature, rejects already-used tickets, records `CheckIn`

### Setup requirements
1. `eventpass-web` must be running (`npm run dev`) — mobile has no local DB.
2. `src/backend/config.js`'s `API_BASE_URL` must point at the dev machine's LAN IPv4 (phone can't reach `localhost`).
3. Both devices on the same Wi-Fi.

### Earlier project history
The original spec (now superseded) was a fully offline single-app design: local
AsyncStorage data model (`Event { id, name, date, location, capacity }`, `Guest
{ id, eventId, name, ticketCode, checkedIn, checkInTime }`), no backend, 5-week
solo timeline. The build evolved into the current two-app, Postgres-backed
architecture described above — the mobile app kept the same UX shape (event
list → guest list → ticket view → scanner) but now reads/writes through
`eventpass-web`'s real API instead of local storage.

---

## Open items / known gaps
- No in-browser `/scan` page on the web app (mobile-only scanning today)
- Gate-admin invite flow (`GateAdmin` model) unused
- No live updates (SSE/polling) on dashboards — manual refresh
- No production deploy yet (Vercel + Neon planned)
- No real payment processor — checkout is simulated as instantly `PAID`
