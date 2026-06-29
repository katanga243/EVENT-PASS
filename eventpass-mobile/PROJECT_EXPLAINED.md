# EventPass — How It All Works

> A detailed walkthrough of the system: what it does, the technology choices, the
> architecture, the data model, and the algorithms behind ticket issuing and
> check-in. Written 2026-06-22. For a terser machine-readable snapshot see
> `PROJECT_SUMMARY.md` in this repo.

---

## 1. What EventPass is

EventPass is a ticketing and door check-in system for live events (currently
modelled around events in Milano and Torino). It is **two separate
applications sharing one database**, not one monolithic app:

| App | Role | Audience |
|---|---|---|
| **`eventpass-web`** (sibling repo, Next.js) | Public ticket shop + organiser dashboard + the API that everything else talks to | Ticket buyers, event organisers |
| **`eventpass-mobile`** (this repo, Expo/React Native) | Organiser's door-side companion: create events, manage a guest list, scan tickets | Event organisers / door staff |

The key idea: **there is exactly one source of truth — the Postgres database
behind `eventpass-web`.** The mobile app has no database of its own. Every
screen in the mobile app is really just a UI for the same REST API and the
same Prisma models the website uses. A ticket bought on the website at 2pm
scans correctly at the door via the phone at 8pm because they are reading and
writing the *same row* in the *same table*.

This was a deliberate evolution: the original project spec (still preserved
at the bottom of `PROJECT_SUMMARY.md`) was a single offline app storing
events/guests in `AsyncStorage` on the phone, with no backend at all. That
design was abandoned once it became clear an organiser needs the same event
visible and accurate on both the public website and the door-scanning phone —
which is impossible if each device keeps its own private copy of the data.

---

## 2. High-level architecture

```
                         ┌─────────────────────────┐
   Ticket buyer  ───────▶│   eventpass-web          │
   (browser)             │   Next.js App Router      │
                         │   /  /events/[id]          │
                         │   /account/tickets          │
                         └─────────────┬───────────┘
                                       │ Prisma (driver adapter)
                                       ▼
                         ┌─────────────────────────┐
                         │   PostgreSQL (Neon)       │
                         │   User / Event / Order /   │
                         │   Ticket / CheckIn / Seat   │
                         └─────────────▲───────────┘
                                       │ Prisma
                         ┌─────────────┴───────────┐
                         │   eventpass-web          │
                         │   /api/mobile/*  (REST)    │
                         └─────────────▲───────────┘
                                       │ HTTPS + Bearer JWT
                         ┌─────────────┴───────────┐
   Organiser  ──────────▶│   eventpass-mobile        │
   (phone)               │   Expo / React Native      │
                         │   Login → Events → Guests →  │
                         │   Ticket view / Scanner       │
                         └─────────────────────────┘
```

Both client surfaces (browser and phone) ultimately call the **same backend
service functions** — there is no parallel "mobile" business logic that could
drift out of sync with the web logic. Concretely: when the mobile app's "Add
Guest" screen issues a complimentary ticket, it calls the exact same
`createOrder()` function that runs when a buyer checks out on the website. It
just calls it with quantity 1 and price 0.

---

## 3. Technology stack

### `eventpass-web` (the platform)

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 16, App Router, Turbopack | Server-rendered pages + co-located API routes in one app |
| UI | React 19, Tailwind CSS 4 | Component model + utility-first styling, no separate CSS build step |
| Language | TypeScript (strict mode) | Compile-time safety across web routes, API routes, and Prisma models |
| Database | PostgreSQL hosted on Neon | Managed Postgres, serverless-friendly, branching for dev |
| ORM | Prisma 7, via `@prisma/adapter-pg` | Prisma 7 dropped inline connection strings in `schema.prisma`; the driver-adapter pattern is the new way to point Prisma at a `pg` Pool |
| Web auth | Auth.js v5 (`next-auth`) | Session cookies for browser users (buyers/organisers) |
| Mobile auth | Hand-rolled JWT bearer tokens (`jsonwebtoken`, `src/backend/mobileAuth.ts`) | Browsers get cookies; a native app has no cookie jar story worth fighting, so mobile gets a signed bearer token instead |
| Password hashing | Argon2id (`@node-rs/argon2`), bcrypt verify-only fallback | Argon2id is the current best-practice KDF; bcrypt fallback lets pre-existing accounts log in without a forced reset |
| QR rendering | `qrcode` | Server-side QR PNG generation for tickets |
| PDF tickets | `@react-pdf/renderer` | Generates ticket PDFs on demand, in-process — no headless Chrome, nothing written to disk |

**Deliberately excluded:** a real payment processor (checkout writes an order
straight to `PAID` — there's no Stripe/PayPal integration), and remote image
hosting (event images are static files under `public/`). Both are reasonable
simplifications for a bootcamp project where the checkout *flow* matters more
than real money movement.

### `eventpass-mobile` (the companion app)

| Layer | Technology | Why |
|---|---|---|
| Framework | Expo SDK 54, React Native 0.81, React 19 | Cross-platform (iOS/Android) from one JS codebase, fast iteration via Expo Go |
| Navigation | React Navigation (native-stack) | Standard RN navigation, native transition feel |
| Camera/QR scan | `expo-camera` (`CameraView`) | First-party Expo camera module with built-in barcode detection — no separate native barcode library needed |
| QR rendering | `react-native-qrcode-svg` | Renders a guest's signed ticket token as a QR image on-device |
| Persistence | `@react-native-async-storage/async-storage` | **Only** used to remember the logged-in session (`{ token, user }`) — not used for events/guests anymore |
| Fonts | `@expo-google-fonts` (Manrope, Space Grotesk) | Matches the web app's type system for visual consistency |

---

## 4. Data model

Everything lives in one Prisma schema (`eventpass-web/prisma/schema.prisma`):

```
User ──┬── owns ──▶ Event ──┬── has many ──▶ TicketType ──┬── has many ──▶ Seat
       │                    │                              │
       └── places ──▶ Order ┘                               └── (per-type inventory)
                       │
                       └── produces ──▶ Ticket ──┬── carries ──▶ qrToken (signed JWT)
                                                  └── has many ──▶ CheckIn
```

- **`User`** — role is one of `BUYER`, `ORGANISER`, `GATE_ADMIN`. Buyers place
  orders; organisers own events; gate admins (schema-only, not wired up yet)
  would be per-gate scanner accounts.
- **`Event`** — has a `city` (`MILANO`/`TORINO`) and one or more `TicketType`s.
- **`TicketType`** — name, price, which gate it admits through, total
  `quantity`, and a running `soldCount`. This is the actual inventory unit —
  not the `Event` itself.
- **`Order`** — `PENDING` / `PAID` / `FAILED`. A paid order produces `Ticket`
  rows.
- **`Ticket`** — the unit that actually gets scanned. Carries a **signed,
  unique `qrToken`** (a JWT, not a random string — see §6), an assigned gate,
  and a status of `VALID` or `CHECKED_IN`.
- **`CheckIn`** — one row per successful scan: which gate, which user (door
  staff) scanned it, when.
- **`Seat`** — per-`TicketType` seat inventory (`AVAILABLE`/`SOLD`), for
  events that track individual seats rather than just a quantity count.
- **`GateAdmin`** — an invite-by-email model for per-gate scanner accounts.
  The table exists in the schema but the invite flow (UI + logic) isn't built
  yet — currently only `ORGANISER` accounts can log into the mobile scanner.

**Key modelling decision:** a mobile-created event is not a special "local"
event type — it's a completely normal `Event` row, with one
auto-generated `TicketType` named `General`, priced at 0, with
`quantity = capacity`. "Add guest" on mobile is "buy one ticket of that
free ticket type," which is why it can reuse `createOrder()` unmodified and
inherits the same capacity enforcement as a real paid sale.

---

## 5. Concurrency: avoiding overselling and double check-in

Two different operations mutate shared, finite inventory and can legitimately
race against each other:

1. **Buying/issuing a ticket** decrements remaining `TicketType` capacity.
2. **Scanning a ticket** flips it from `VALID` to `CHECKED_IN`.

Both run inside a **Prisma transaction**, and — critically — the actual
write is an **atomic conditional update**, not a "read the count, then write
a new count" pattern:

```
UPDATE "TicketType" SET soldCount = soldCount + 1
WHERE id = $1 AND soldCount < quantity
```

If two requests race to buy the last seat, only one `UPDATE` matches the
`WHERE` clause and reports a row changed; the other gets zero rows affected
and the code can tell the caller "sold out." The same pattern guards
check-in: the `UPDATE` on `Ticket.status` is conditioned on the current
status still being `VALID`, so two simultaneous scans of the same QR code
can't both succeed — exactly one wins the race, the other is told "already
checked in." This is the standard fix for the classic
read-then-write race condition (TOCTOU) in inventory systems, implemented
without needing a row lock or a separate semaphore.

---

## 6. The check-in algorithm, end to end

This is the core "product" of the whole system, so it's worth tracing in
full, from ticket creation to a door scan:

**Issuing a ticket (web checkout or mobile "Add Guest"):**
1. `createOrder()` runs in a transaction.
2. It atomically decrements the relevant `TicketType`'s remaining capacity
   (the guard described in §5). If that fails, the whole order fails —
   nothing is left half-created.
3. It creates the `Ticket` row, then **signs a JWT** (`qrToken`) whose
   payload identifies the ticket (and implicitly the event, since the
   ticket belongs to a `TicketType` belonging to an `Event`). This token —
   not a plain ticket ID — is what gets encoded into the QR image. Signing
   it means a forged or hand-typed code can never pass verification, because
   the holder would need the server's private signing key to produce a valid
   signature.
4. The QR image (`qrcode` on web, `react-native-qrcode-svg` on mobile) is
   just a visual encoding of that JWT string — the cryptography lives in the
   token, not the QR format itself.

**Scanning at the door (`ScannerScreen.js` → `/api/mobile/checkin`):**
1. The phone's camera (`expo-camera`'s `CameraView`, restricted to
   `barcodeTypes: ['qr']`) decodes the QR image back into the raw `qrToken`
   string.
2. `handleBarCodeScanned` guards against the camera firing multiple times
   for the same frame using a `processingRef` boolean — until the in-flight
   request resolves and the result banner finishes its display window, every
   further scan event is ignored. This is a debounce, not a security
   control; it just stops one physical scan from being submitted three times
   in 200ms.
3. The token + the current `eventId` are POSTed to `/api/mobile/checkin`.
4. Server-side, `checkInByQrToken()`:
   - Verifies the JWT signature. Tampered or expired tokens are rejected as
     `invalid` before anything else happens.
   - Confirms the ticket's event matches the gate's event (`wrong_event` if
     not — stops a ticket for one event being scanned in at a different
     event's door).
   - Runs the atomic `UPDATE ... WHERE status = 'VALID'` from §5. If it
     affects zero rows, the ticket was already checked in → `duplicate`.
   - On success, writes a `CheckIn` row (gate + scanning user + timestamp)
     and returns `success`.
5. The phone maps the response's `status` field to one of five UI
   outcomes — `success`, `duplicate`, `invalid`, `wrong_event`, `error` —
   each with its own colour and label, shown as a full-width animated panel
   for 2.5 seconds (`RESULT_DISPLAY_MS`), then automatically dismissed via an
   `Animated.timing` fade.
6. On `success`, the screen re-fetches the guest list to update the
   `checkedIn / total` counter shown in the top bar — a simple poll-on-event
   refresh rather than a live subscription (see §8, open items).

So the "algorithm" here is really a small state machine driven by one
idempotent, race-safe database transaction, wrapped in client-side UX that
turns five possible backend outcomes into five distinct, debounced visual
results.

---

## 7. Authentication

Two completely separate auth systems exist side by side, because the two
clients have fundamentally different session models:

- **Web (browser):** Auth.js v5 session cookies — standard for a Next.js
  app, handles buyer and organiser logins.
- **Mobile (phone):** No cookies. `/api/mobile/login` checks the password
  (Argon2id, falling back to bcrypt verification for legacy-hashed accounts)
  and returns a **signed JWT bearer token**. The app stores `{ token, user }`
  in `AsyncStorage` (the *only* thing the mobile app persists locally) and
  attaches `Authorization: Bearer <token>` to every subsequent API call
  (`src/backend/api.js`'s `request()` helper).
- Mobile login is currently restricted to `ORGANISER` accounts. A `401` from
  any API call clears the stored session and throws an error tagged
  `err.code === 'SESSION_EXPIRED'`, which every screen checks for and reacts
  to by resetting navigation back to the `Login` screen — so an expired or
  revoked token can't leave the app stuck showing stale data.
- Password policy (`src/lib/passwordRules.ts`) is enforced both client-side
  (live green/red checklist on the signup form) and again server-side before
  the row is written, so the rule can never be bypassed by skipping the
  client check: minimum 8 characters, upper + lower + number + special
  character, and the password can't contain the user's own name or email.

---

## 8. Mobile app structure

```
eventpass-mobile/
└── src/
    ├── backend/                     networking + session layer (no DB)
    │   ├── config.js                 API_BASE_URL — dev machine's LAN IP
    │   ├── session.js                AsyncStorage wrapper for { token, user }
    │   └── api.js                    fetch wrapper: login, getEvents, createEvent,
    │                                  deleteEvent, getGuests, addGuest, checkIn, logout
    │                                  — Bearer auth, 8s timeout via AbortController,
    │                                  401 → clear session + SESSION_EXPIRED
    └── frontend/
        ├── theme.js                  shared colour tokens
        └── screens/
            ├── LoginScreen.js
            ├── HomeScreen.js          event list, create/delete, logout
            ├── CreateEventScreen.js
            ├── EventDetailScreen.js   guest list + live check-in counter
            ├── AddGuestScreen.js      issues a complimentary ticket + QR
            ├── TicketViewScreen.js    full-screen QR of the signed qrToken, share
            └── ScannerScreen.js       camera scan → POST /api/mobile/checkin
```

`App.js` loads the custom fonts, checks `getSession()` on launch, and routes
straight to `Home` if a session exists or `Login` if not — there's no splash
"loading" state beyond that single async check.

**Setup constraints worth knowing:** the phone can't reach `localhost`, so
`config.js` hardcodes the dev machine's LAN IPv4 address; both devices must
be on the same Wi-Fi network; and `eventpass-web`'s dev server must already
be running, since the mobile app has nothing to fall back on if it isn't.

---

## 9. Web app structure (routes)

- **Public:** `/` (event list), `/events/[id]` (event detail + venue/gate map
  SVG)
- **Auth:** `/auth/signin`, `/auth/signup`
- **Buyer (protected):** `/account/tickets`, `/account/tickets/[ticketId]`
  (QR / PDF / print / share), `/account/profile`, `/account/profile/settings`
- **Checkout:** `/api/checkout`, `/checkout/success`
- **Organiser (protected):** `/organiser` (their events), `/organiser/new`,
  `/organiser/[eventId]` (sales, check-in rate, recent check-ins table),
  `/organiser/finance`
- **Mobile REST API:** `/api/mobile/login`, `/api/mobile/events`
  (list/create), `/api/mobile/events/[eventId]` (delete),
  `/api/mobile/events/[eventId]/guests` (list/add), `/api/mobile/checkin`
- `src/proxy.ts` gates `/account` and `/organiser` (this replaces the
  conventional `middleware.ts`, which Next 16 renamed)

---

## 10. Current build status

| Milestone | Status |
|---|---|
| Scaffold, public website, auth, checkout (simulated payment), ticket QR/PDF/print/share, organiser dashboard | ✅ Done |
| Door check-in (API `checkInByQrToken`, used daily via mobile) | ✅ Done |
| In-browser `/scan` camera page on the website itself | 🔶 Planned (`@zxing/browser`), not built — scanning is mobile-only today |
| Gate-admin invite flow | ⬜ Schema exists, no UI/logic |
| Live dashboard updates (SSE/polling) | ⬜ Manual refresh only |
| Production deploy (Vercel + Neon) | ⬜ Not yet deployed |

---

## 11. Project history in one paragraph

The project started, by spec, as a single offline Expo app: local
`AsyncStorage` model of `Event { id, name, date, location, capacity }` and
`Guest { id, eventId, name, ticketCode, checkedIn, checkInTime }`, no
backend, full 5-week solo timeline. While building it, the design evolved
into the two-app, shared-Postgres architecture described in this document —
the mobile UX shape (event list → guest list → ticket view → scanner) stayed
the same, but every screen now reads and writes through `eventpass-web`'s
real API instead of local storage, so the same ticket is valid and the same
event is visible from both the website and the phone.

Built by Katanga Jean Dedieu, student at the DevHope web & mobile development
bootcamp, as a final project.
