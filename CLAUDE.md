# CLAUDE.md - TeamUp (WebPadel) Codebase Guide

## Project Overview

TeamUp (branded as "WebPadel" / "We Team Up") is a web application for padel and sports players to find partners, organize events, and build community. Users create/join events (max 4 players typical for padel), manage friends, share post-event memories, and browse venue locations. The app is focused on the Lithuanian market (Vilnius-area venues).

**Live URL:** https://teamup.lt / https://weteamup.app

## Tech Stack

- **Frontend:** React 18.2 + TypeScript (strict mode), bootstrapped with Create React App via CRACO
- **Styling:** Tailwind CSS 3.4 + Material-UI 5 + custom CSS variables (shadcn/ui-style HSL theming)
- **Routing:** React Router DOM 6
- **Backend/Database:** Firebase (Firestore, Auth, Storage, Cloud Functions, Hosting)
- **Email:** SendGrid (via Express server) + MailerLite (via Cloud Functions) + Firestore Send Email extension
- **Maps:** MapLibre GL / React Map GL with MapTiler geocoding
- **i18n:** i18next (minimal setup, English only currently)
- **Build tool:** CRACO (wraps react-scripts)
- **Deployment:** Firebase Hosting + VPS (Nginx + PM2) via GitHub Actions

## Commands

```bash
npm start          # Start dev server (CRACO)
npm run build      # Production build (CI=false used in CI to ignore warnings)
npm test           # Run tests (Jest + React Testing Library)
npm run postinstall # Runs patch-package automatically after install
npm run update-events  # Run script: tsx src/scripts/updateEventsSportType.ts
npm run update-status  # Run script: tsx src/scripts/updateEventStatus.ts
```

**Node requirement:** >=18.0.0

## Project Structure

```
teamup/
├── src/
│   ├── api/              # API webhook handlers
│   ├── assets/           # Static assets (avatars, images)
│   ├── components/       # Reusable UI components (flat structure, ~40 files)
│   │   └── ui/           # Primitive UI components (button, card, input, etc. - shadcn-style)
│   ├── constants/        # Static data (locations.ts with venue coords, avatars.ts)
│   ├── contexts/         # React Context providers (Auth, Cookie, Theme, Toastify)
│   ├── hooks/            # Custom React hooks (useAuth, useEvents, useCookies, etc.)
│   ├── lib/              # Utility library (utils.ts with cn() helper)
│   ├── pages/            # Route-level page components (~12 pages)
│   ├── scripts/          # One-off admin/migration scripts
│   ├── services/         # Business logic services (email, notifications, verification, MailerLite)
│   ├── styles/           # Global CSS (globals.css)
│   ├── types/            # TypeScript type definitions and declarations
│   ├── utils/            # Utility functions (database, cookies, lazy loading, strings)
│   ├── App.tsx           # Root component with routing
│   ├── firebase.ts       # Firebase client initialization (exports auth, db, storage)
│   ├── firebaseAdmin.ts  # Firebase Admin SDK init (server-side)
│   ├── i18n.ts           # i18next configuration
│   └── index.tsx         # Entry point, wraps App in CookieProvider
├── functions/            # Firebase Cloud Functions (Node.js)
│   ├── index.js          # All cloud functions (email triggers, scheduled tasks)
│   └── package.json      # Separate dependency management
├── patches/              # patch-package patches for react and react-dom 18.2.0
├── public/               # Static public files
├── nginx/                # Nginx configuration for VPS deployment
├── server.js             # Express API server for SendGrid email sending
├── firebase.json         # Firebase project config (hosting, firestore, functions)
├── firestore.rules       # Firestore security rules
├── firestore.indexes.json # Firestore composite indexes
└── .github/workflows/    # CI/CD (deploy.yml for VPS, firebase-hosting-deploy.yml)
```

## Architecture & Key Patterns

### Authentication Flow
- Firebase Auth with email/password and Google sign-in (`src/hooks/useAuth.ts`)
- On registration: creates Firestore user doc, sends verification email via SendGrid, adds to MailerLite welcome series
- `AuthContext` wraps the app (via `useAuth` hook) providing `user`, `login`, `register`, `signInWithGoogle`, `signOut`
- `CookieProvider` wraps the entire app at the top level in `index.tsx`
- Protected routes redirect to `/login` when unauthenticated

### State Management
- React Context API (no Redux/Zustand) with 4 context providers:
  - `AuthContext` - user authentication state
  - `CookieContext` - cookie consent and preferences
  - `ThemeContext` - light/dark theme toggle
  - `ToastifyContext` - toast notifications
- Custom hooks for data fetching (`useEvents`, `useAuth`, `useCookies`, `useProfileCompletion`)

### Data Models (src/types/index.ts)
- **User:** id, email, displayName, photoURL, level, sports[], friends[], isAdmin
- **Event:** id, title, date, time, endTime, location, level, players[], maxPlayers, createdBy, price, status (active|completed), sportType, isPrivate, password, matchResults, customLocationCoordinates
- **Player:** id, name, photoURL, displayName, level, uid
- **Notification:** id, type (new_event|event_joined|event_cancelled), eventId, userId, read
- **Memory:** id, eventId, imageUrl, createdBy, likes[], sportType, date, location
- **MatchResult:** teamAScore, teamBScore, winner (Team A|Team B)

### Firestore Collections
- `users` - User profiles (read: public, write: own doc only)
- `events` - Sports events (read: public, create/update: authenticated, delete: creator only)
- `friends` - Friend lists with `requests` subcollection
- `notifications` - Per-user notifications
- `savedEvents` - Bookmarked events (doc ID format: `userId_eventId`)
- `memories` - Post-event photo memories (read: public, likes: any authenticated user)
- `mail` - Triggers Firestore Send Email extension
- `verificationTokens` / `emailVerifications` - Email verification tokens

### Routing (src/App.tsx)
```
/                    → Home (authenticated) or LandingPage (guest)
/login               → Login page
/register            → Registration page
/verify-email        → Email verification
/event/:id           → Event details (protected)
/my-events           → User's own events (protected)
/notifications       → Notifications view (protected)
/community           → Community page (protected)
/saved-events        → Saved/bookmarked events (protected)
/locations           → Venue locations list (protected)
/location/:locationId → Single venue details (protected)
```

### Email System (3 parallel approaches)
1. **SendGrid via Express server** (`server.js` + `src/services/sendGridService.ts`) - verification, welcome, event notifications via local API at `/api/send-email`
2. **MailerLite via Cloud Functions** (`functions/index.js`) - automated email flows triggered by Firestore events (welcome, player joined/left, reminders, memory sharing)
3. **Firestore Send Email extension** (`src/services/emailService.ts`) - writes to `mail` collection to trigger Firebase extension

### Firebase Cloud Functions (functions/index.js)
- `sendWelcomeEmail` - triggers on Auth user creation
- `onEventCreation` - triggers on new event document
- `onEventUpdate` - triggers on event update (player join/leave detection)
- `sendEventReminders` - scheduled every 60 minutes
- `sendMemorySharingInvites` - scheduled every 6 hours

### Styling Conventions
- **Primary accent color:** `#C1FF2F` (lime green)
- **Background:** `#111111` / `#1E1E1E` (dark theme default)
- Tailwind CSS for layout and utility classes
- MUI components for complex UI elements (dialogs, inputs)
- CSS variables via HSL for theming (shadcn/ui pattern in `src/index.css`)
- `cn()` utility from `src/lib/utils.ts` for conditional class merging (clsx + tailwind-merge)
- Mobile-first responsive design with 768px breakpoint
- Bottom navigation on mobile, top navbar on desktop

### Component Conventions
- Functional components with TypeScript (`React.FC`)
- Named exports preferred (some default exports exist)
- Components are flat in `src/components/` (no deep nesting)
- Primitive UI components in `src/components/ui/` follow shadcn/ui patterns
- Pages in `src/pages/` correspond to routes

## Environment Variables

All prefixed with `REACT_APP_` for CRA compatibility:

```
REACT_APP_FIREBASE_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID
REACT_APP_SENDGRID_API_KEY
REACT_APP_SENDER_EMAIL
REACT_APP_MAILERLITE_API_KEY
REACT_APP_API_URL              # Express server URL (default: http://localhost:3001)
```

## Deployment

### Firebase Hosting (`.github/workflows/firebase-hosting-deploy.yml`)
- Triggers on push to `main`/`master`
- Builds with `CI=false npm run build`, deploys to Firebase Hosting

### VPS Deployment (`.github/workflows/deploy.yml`)
- Triggers on push/PR to `main`/`master`
- Deploys build artifacts to `/var/www/weteamup/` via SCP
- Configures Nginx, starts Express API server via PM2
- Sends Slack notifications on success/failure

### Firebase Functions
- Deployed separately: `cd functions && npm run deploy`
- Predeploy runs lint

## Testing

- **Framework:** Jest + React Testing Library
- **Config:** ESLint extends `react-app` and `react-app/jest`
- **Test files:** Co-located with source (`*.test.tsx`)
- **Run:** `npm test`
- Existing tests: `App.test.tsx`, `CreateEventDialog.test.tsx`, `Home.test.tsx`

## Important Notes

- The project uses `patch-package` with patches for React and ReactDOM 18.2.0 (in `patches/`)
- CRACO overrides webpack config for Node.js polyfill fallbacks (crypto, stream, path, etc.)
- Hot module replacement is disabled in dev (`craco.config.js`: `devServer.hot: false`)
- Firebase config has hardcoded fallback values in `src/firebase.ts` (used when env vars are absent)
- The `server.js` Express server runs on port 3001 and handles SendGrid email sending
- Locations are hardcoded in `src/constants/locations.ts` (Vilnius padel venues)
- Avatar system uses pre-defined avatar images (Avatar1-4) rather than user uploads
- The project name in `package.json` is "webpadel" but branding is "TeamUp" / "We Team Up"
