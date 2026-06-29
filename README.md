# EventPass

EventPass is a full-stack event ticketing and check-in platform made up of two connected apps:

- eventpass-web: a Next.js web app for buyers and organisers to browse events, purchase tickets, and manage check-ins.
- eventpass-mobile: an Expo mobile app for organisers to create events, manage guest lists, and scan QR tickets at the door.

Both apps share the same backend logic and database, so tickets created on the web can be scanned from the mobile app and vice versa.

## What is in this repository?

- eventpass-web/ — the main web application and API.
- eventpass-mobile/ — the organiser-facing mobile app.

## Main features

- Browse events and view event details
- Buy tickets and receive QR-based tickets
- View tickets in a personal account area
- Organiser dashboard for event and guest management
- Mobile check-in flow for scanning tickets at entry

## Quick start

### 1. Web app

```bash
cd eventpass-web
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

On Windows PowerShell, if `npm` is blocked by the script execution policy, use `npm.cmd run dev`.

Open http://localhost:3000.

You will need environment variables in .env.local, including:

- DATABASE_URL
- AUTH_SECRET
- JWT_SECRET
- MOBILE_AUTH_SECRET
- NEXT_PUBLIC_APP_URL

### 2. Mobile app

```bash
cd eventpass-mobile
npm install
npm start
```

The mobile app talks to the web app's API, so the web app should be running first. In the mobile app, update the API base URL in src/backend/config.js to point to your local network IP address so the phone or emulator can reach it.

## Demo accounts

The web app includes demo accounts for testing:

- organiser@eventpass.demo / demo1234
- buyer@eventpass.demo / demo1234

## Project structure

- eventpass-web/src/app — Next.js pages and API routes
- eventpass-web/src/backend — Prisma, auth, services, and business logic
- eventpass-mobile/src/frontend — React Native screens and UI
- eventpass-mobile/src/backend — API calls and mobile session handling

## Notes

- The web app uses PostgreSQL and Prisma.
- The mobile app depends on the web app's API rather than running its own database.
- The project is still evolving, but the core ticketing and check-in flow is already implemented.
