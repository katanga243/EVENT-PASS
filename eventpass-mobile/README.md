# EventPass — Mobile

An Expo (React Native) companion app for event organisers: create events, manage a
guest list, and scan QR tickets at the door — all backed by the same Postgres
database as the **EventPass web app** (`eventpass-web`), not local storage.

## Demo credentials

| Email | Password | Role |
|---|---|---|
| `organiser@eventpass.demo` | `demo1234` | ORGANISER |

Mobile login is restricted to `ORGANISER` accounts — there is no buyer-facing screen
in this app. (`GATE_ADMIN` mobile login is a planned extension, not built yet.)

## Getting started

1. **Start the backend first** — this app has no local database; it talks to
   `eventpass-web`'s API over HTTP.
   ```bash
   cd ../eventpass-web
   npm run dev
   ```
2. **Point the app at your machine's LAN IP** (a phone can't reach `localhost`).
   Edit `src/backend/config.js`:
   ```js
   export const API_BASE_URL = "http://<your-LAN-IPv4>:3000";
   ```
   Find your IPv4 with `ipconfig` (Windows) → "Wireless LAN adapter Wi-Fi" → IPv4
   Address. Your phone and computer must be on the same Wi-Fi network.
3. **Install and run**:
   ```bash
   npm install
   npm start
   ```
   Scan the QR code with Expo Go, or press `a` / `i` for an emulator.
4. Sign in with the organiser account above.

## Infrastructure

- **Runtime**: Expo SDK 54, React Native 0.81, React 19. No native build step needed
  for development — runs in Expo Go.
- **No local database**: the only thing persisted on-device is the login session
  (`{ token, user }` in `AsyncStorage`, via `src/backend/session.js`). Every other
  read/write goes through the network to `eventpass-web`.
- **Auth**: a bearer-token JWT obtained from `eventpass-web`'s `POST /api/mobile/login`
  (separate from that app's web cookie sessions), sent as `Authorization: Bearer
  <token>` on every request via `src/backend/api.js`. A 401 response clears the
  stored token and routes the user back to the login screen.
- **Camera**: `expo-camera`'s `CameraView` for QR scanning; `react-native-qrcode-svg`
  to render a guest's ticket QR.

## Architecture

```
src/
├── backend/                  # networking + session (the "backend" layer on-device)
│   ├── config.js              API_BASE_URL — edit this to your LAN IP
│   ├── session.js             AsyncStorage wrapper for the cached login session
│   └── api.js                 fetch wrapper: login, getEvents, createEvent,
│                               deleteEvent, getGuests, addGuest, checkIn, logout
│
└── frontend/                  # UI (the "frontend" layer)
    ├── theme.js                shared color tokens
    └── screens/
        ├── LoginScreen.js       organiser sign-in
        ├── HomeScreen.js        event list + create/delete, log out
        ├── CreateEventScreen.js
        ├── EventDetailScreen.js guest list + live check-in counter
        ├── AddGuestScreen.js    issues a complimentary ticket + QR
        ├── TicketViewScreen.js  shows the QR (the ticket's signed qrToken), share
        └── ScannerScreen.js     camera scan → POST /api/mobile/checkin
```

`App.js` checks for a saved session on launch and routes to `Login` or `Home`
accordingly.

### How "events" and "guests" map onto the web's data model

This app's simple model (event name/date/location/capacity, and a guest list) maps
onto `eventpass-web`'s real schema rather than having its own:

- **Create event** → creates a real `Event` row + one auto-generated `TicketType`
  (`name: "General"`, `priceCents: 0`, `quantity: capacity`).
- **Add guest** → issues a complimentary ticket: calls the exact same `createOrder()`
  the website's checkout uses (quantity 1, price 0), so it's subject to the same
  capacity checks.
- **Scan QR** → the QR encodes a signed JWT (`Ticket.qrToken`), the same kind the
  website's checkout issues. Scanning calls `POST /api/mobile/checkin`, which
  verifies the signature, rejects an already-used ticket, and records a `CheckIn`.

Because of this, events and check-ins created from the phone show up identically on
the website's `/organiser` dashboard, and vice versa — both apps are two clients of
one shared backend.

## Related project

- [`eventpass-web`](../eventpass-web) — the Next.js website + API this app depends on. See its README for the full data model and API routes.
