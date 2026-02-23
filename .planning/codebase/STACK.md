# Technology Stack

**Analysis Date:** 2026-02-23

## Languages

**Primary:**
- TypeScript 5.8.3 - Entire application (strict mode enabled in `tsconfig.json`)
- JSX/TSX - React component templates

**Secondary:**
- JavaScript - Legacy Firebase support and utility scripts
- SQL - Supabase migrations in `supabase/migrations/`

## Runtime

**Environment:**
- Node.js >=18.0.0 (required in `package.json`)
- Browser (ES2015+ target in `tsconfig.json`)

**Package Manager:**
- npm - Primary package manager
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- React 18.2.0 - UI framework (pinned via resolutions in `package.json`)
- React DOM 18.2.0 - React rendering (pinned)
- React Router DOM 6.22.0 - Client-side routing in `src/App.tsx`

**Build/Development:**
- CRACO 7.1.0 - Webpack wrapper over react-scripts, config in `craco.config.js`
- react-scripts 5.0.1 - Create React App build tooling
- TypeScript 5.8.3 - Type checking

**Styling:**
- Tailwind CSS 3.4.1 - Utility-first CSS framework
- Tailwind Merge 2.2.1 - Smart class merging helper
- Tailwindcss Animate 1.0.7 - Animation utilities
- PostCSS 8.4.35 - CSS preprocessing (required by Tailwind)
- Autoprefixer 10.4.17 - Vendor prefix generation

**UI Component Libraries:**
- Material-UI (MUI) 5.15.10 - Complex UI components (inputs, dialogs, icons)
- MUI Icons Material 5.17.1 - Material Design icon set
- Headless UI 2.2.1 - Unstyled, accessible components
- Heroicons 2.2.0 - Icon set from Tailwind Labs
- Lucide React 0.330.0 - Lightweight icon library
- Radix UI React Slot 1.0.2 - Composition primitive

**Testing:**
- Jest (via react-scripts) - Test runner and assertion library
- React Testing Library 14.2.1 - Component testing utilities
- @testing-library/jest-dom 6.4.2 - Jest matchers for DOM
- @testing-library/user-event 14.5.2 - User interaction simulation

**Linting:**
- ESLint (via react-scripts, config in `package.json`) - Code linting
  - Extends: `react-app`, `react-app/jest`
- No explicit Prettier config (defaults applied)

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.97.0 - PostgreSQL database, auth, storage client
- firebase 10.14.1 - Legacy auth/storage (being migrated out)
- firebase-admin 13.2.0 - Firebase Cloud Functions support
- @sendgrid/mail 7.7.0 - Email delivery (unused, Vercel API route used instead)
- axios 1.8.4 - HTTP client library (minimal use)
- node-fetch 3.3.2 - Server-side fetch polyfill

**Styling & UI:**
- Emotion/React 11.11.3 - CSS-in-JS for MUI
- Emotion/Styled 11.11.0 - Styled component utility for MUI
- Class Variance Authority 0.7.0 - Component variant pattern library
- CLSX 2.1.0 - Conditional class name utility

**Maps & Location:**
- MapLibre GL 5.3.1 - Open-source WebGL map renderer
- react-map-gl 8.0.4 - React wrapper for MapLibre GL (via `src/types/react-map-gl.d.ts`)
- Mapbox GL 3.11.0 - Legacy map library (coexists with MapLibre)

**Utilities:**
- date-fns 4.1.0 - Date manipulation and formatting
- js-cookie 3.0.5 - Cookie management (used by CookieContext)
- react-hot-toast 2.5.2 - Toast notifications
- react-spring-bottom-sheet 3.4.1 - Bottom sheet component
- qrcode.react 4.2.0 - QR code generation
- react-icons 5.5.0 - Icon library collection
- i18next 25.0.0 - Internationalization framework
- react-i18next 15.4.1 - React i18next bindings

**Email Marketing:**
- @mailerlite/mailerlite-nodejs 1.4.0 - MailerLite subscriber management

**Server/API:**
- Express 4.18.2 - Node.js HTTP server (legacy, being replaced by Vercel)
- CORS 2.8.5 - Cross-origin request handling
- dotenv 16.5.0 - Environment variable loading
- tsx 4.19.3 - TypeScript execution for scripts

**Browser Polyfills (CRACO fallbacks):**
- crypto-browserify 3.12.1 - Crypto module for browser
- stream-browserify 3.0.0 - Stream module for browser
- path-browserify 1.0.1 - Path module for browser
- buffer 6.0.3 - Node.js Buffer for browser
- null-loader 4.0.1 - Webpack loader for fs fallback

**Patching:**
- patch-package 8.0.0 - Apply patches to node_modules (runs on postinstall)
  - Patches in `patches/` directory for React 18.2.0 fixes

## Configuration

**Environment:**

Frontend configuration via `.env` file:
```
REACT_APP_SUPABASE_URL=https://[project-id].supabase.co
REACT_APP_SUPABASE_ANON_KEY=[anon-key]
REACT_APP_API_URL=         # Defaults to /api for Vercel
REACT_APP_MAILERLITE_API_KEY=[optional]
```

Server-side configuration (Vercel/Node.js):
```
SENDGRID_API_KEY=[key]
SENDER_EMAIL=info@weteamup.app
```

**Build:**
- `tsconfig.json` - TypeScript configuration
  - Target: ES6
  - Module: ESNext
  - JSX: react-jsx (modern JSX transform)
  - Strict mode enabled
- `craco.config.js` - CRACO webpack overrides
  - Node.js polyfill fallbacks for crypto, stream, path
  - HMR disabled in dev (`devServer.hot: false`)
- `.eslintrc` - ESLint config (extends react-app)
- Tailwind via PostCSS in standard create-react-app setup

## Platform Requirements

**Development:**
- Node.js >=18.0.0
- npm or yarn
- Browser with ES2015+ support
- Git

**Production:**
- Vercel (primary deployment target)
  - Static build via `@vercel/static-build`
  - Serverless API routes via `@vercel/node`
  - Config in `vercel.json`
- PostgreSQL database via Supabase
- SendGrid account for email (if using transactional emails)

**Optional:**
- MapTiler API key for geocoding (hardcoded in `src/components/LocationSearch.tsx`)
- MailerLite account for email marketing automation
- Google OAuth credentials (for Supabase Auth)

---

*Stack analysis: 2026-02-23*
