# Coding Conventions

**Analysis Date:** 2025-02-23

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `EventCard.tsx`, `CreateEventDialog.tsx`)
- Hooks: camelCase prefixed with `use` (e.g., `useAuth.ts`, `useSupabaseAuth.ts`)
- Services: camelCase ending with `Service` (e.g., `emailService.ts`, `sendGridService.ts`)
- Constants: UPPER_SNAKE_CASE with object names in PascalCase (e.g., `locations.ts` with `PADEL_LOCATIONS` constant)
- Types/Interfaces: PascalCase in `types/` directory (e.g., `User`, `Event`, `Player` in `src/types/index.ts`)

**Functions:**
- camelCase for all functions and methods
- Event handlers prefixed with `handle` (e.g., `handleCreateClick`, `handleFilterChange`)
- Async functions explicitly declared with `async` keyword
- Custom hook functions start with `use` (e.g., `useAuth()`, `useSupabaseEvents()`)

**Variables:**
- Local state: camelCase (e.g., `isLoading`, `selectedEventId`, `showCreateDialog`)
- Boolean state: prefixed with `is`, `show`, `has` (e.g., `isJoined`, `showFilters`, `hasError`)
- Arrays ending in plural or plural-like form (e.g., `events`, `players`, `userFriends`)
- Unused variables avoided; if necessary, prefix with underscore (e.g., `_event`)

**Types:**
- Interface names: PascalCase describing what they represent (e.g., `ButtonProps`, `EventCardProps`, `FilterOptions`)
- Type aliases: PascalCase (e.g., `FC` for `React.FC`, used in type annotations)
- Exported types in `src/types/index.ts` and `src/types/supabase.ts`

## Code Style

**Formatting:**
- No explicit formatter configured (relies on react-scripts defaults)
- Indentation: 2 spaces (implicit from React ecosystem)
- Line length: No strict limit enforced
- Semicolons: Required at end of statements

**Linting:**
- ESLint configured via react-scripts extending `react-app` and `react-app/jest`
- No `.eslintrc` file in root; configuration in `package.json`:
  ```json
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  }
  ```
- Enforces React best practices and modern JavaScript

**TypeScript:**
- Strict mode enabled in `tsconfig.json`: `"strict": true`
- JSX: `react-jsx` (React 18 new JSX transform)
- Target: `es6`
- Module resolution: `node`

## Import Organization

**Order:**
1. React and React Router imports (e.g., `import React, { useState }`, `import { useNavigate }`)
2. External third-party packages (e.g., `@mui/material`, `firebase`, `@supabase/supabase-js`)
3. Internal project imports (types, hooks, components, services, constants)
4. Asset imports (images, CSS)

**Examples from codebase:**
```typescript
// Correct ordering in EventCard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Event, Player, MatchResult } from '../types';
import { useAuth } from '../hooks/useAuth';
import { EditEventDialog } from './EditEventDialog';
import { doc, updateDoc, getDoc, arrayUnion, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Avatar1 from '../assets/avatars/Avatar1.png';
import { Bookmark, BookmarkBorder } from '@mui/icons-material';
```

**Path Aliases:**
- No path aliases configured (use relative paths with `../`)
- Monolithic `src/` structure with flat `components/` directory

## Error Handling

**Patterns:**
- Try-catch blocks wrapping async operations (e.g., in `useAuth.ts`, `sendGridService.ts`)
- Error logging to console via `console.error()` with descriptive messages
- Return value pattern: `{ success: boolean, error?: any }` or error thrown
- Silent failures common in UI events; errors logged but may not display to user
- No centralized error boundary implementation (basic `ErrorBoundary.tsx` exists but not widely used)

**Examples:**
```typescript
// From emailService.ts
export const sendEmail = async (emailData: EmailData) => {
  try {
    await addDoc(collection(db, 'mail'), emailDoc);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};
```

**Async handling:**
- Promises used with `.then()` and `.catch()` in some files (Firebase era code)
- Modern code uses `async/await` with try-catch
- Error states stored in local component state (e.g., `[error, setError]`)

## Logging

**Framework:** `console` object (no logging library)

**Patterns:**
- `console.error()` for errors
- `console.log()` for debugging (minimal use in production code)
- Context provided in error messages (e.g., `console.error('Error storing user data:', error)`)
- Errors logged but not always displayed to end-user

**Location:**
- Errors logged throughout service layer and hooks
- Examples: `useAuth.ts`, `useSupabaseAuth.ts`, `emailService.ts`, `sendGridService.ts`

## Comments

**When to Comment:**
- JSDoc-style comments on exported functions and types (inconsistently applied)
- Inline comments for non-obvious logic (e.g., date extraction, city extraction logic)
- Section comments separating major code blocks in large files (rare)

**JSDoc/TSDoc:**
- Minimal usage; not a project standard
- TypeScript interfaces serve as documentation via type hints
- Function parameters documented implicitly through type signatures

**Example (uncommon in codebase):**
```typescript
// From EventCard.tsx - helper function with comment
// Add a helper function to extract city from address
const extractCity = (location: string): string => {
  // Try to extract city from location string
  // Common patterns: "Venue Name, City", "Address, City, Country", etc.
  if (!location) return '';
  const parts = location.split(',');
  if (parts.length >= 2) {
    return parts[1].trim();
  }
  return location.length > 20 ? location.substring(0, 20) + '...' : location;
};
```

## Function Design

**Size:**
- Small utility functions: 5-20 lines
- Component functions: 50-500+ lines (some exceed 1000 lines)
- Largest files: `CreateEventDialog.tsx` (1497 lines), `EventDetails.tsx` (1119 lines), `EventCard.tsx` (982 lines)
- No enforcement of function size limits; refactoring opportunities exist

**Parameters:**
- Destructured props in component signatures (e.g., `{ event, onEventUpdated }`)
- Single parameter objects for services (e.g., `emailData` object in `sendEmail()`)
- Optional parameters marked with `?` in interfaces
- Spread operators used for passing remaining props

**Return Values:**
- Components return JSX (implicit return in some functional components)
- Hooks return state and functions as objects or arrays
- Service functions return Promises or `{ success, error }` objects
- Null/undefined returns used for error cases or empty states

**Example (useSupabaseAuth.ts):**
```typescript
return {
  user,
  session,
  loading,
  userFriends,
  login,
  register,
  signInWithGoogle,
  signOut,
};
```

## Module Design

**Exports:**
- Named exports preferred for components and utilities
- Default export used for some page components (e.g., `export default App`)
- Mixed pattern in codebase; some components use both named and default exports

**Examples:**
```typescript
// Named export (preferred in modern code)
export const EventCard: React.FC<EventCardProps> = ({ event, onEventUpdated }) => { ... };

// Default export (used in some pages)
export default Login;

// Default from SupabaseAuthContext.tsx
export const useAuth = (): AuthContextType => { ... };
```

**Barrel Files:**
- Minimal use of barrel files (`index.ts`)
- Components imported directly from their respective files
- Types re-exported from `src/types/index.ts` and `src/types/supabase.ts`

## Styling

**Approach:**
- Tailwind CSS for primary styling (utility classes)
- Material-UI 5 for complex components (dialogs, inputs, icons)
- Custom CSS variables via HSL theming in `src/index.css` (shadcn/ui pattern)
- Primary accent color: `#C1FF2F` (lime green)
- Background color: `#111111` / `#1E1E1E` (dark theme)

**Class Merging:**
- `cn()` utility from `src/lib/utils.ts` using `clsx` and `tailwind-merge`
- Conditional classes applied with cn() for predictable Tailwind behavior

**Example:**
```typescript
// From Button.tsx
const widthClass = fullWidth ? 'w-full' : '';
const disabledClass = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : '';

return (
  <button
    className={`
      ${baseClasses}
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${widthClass}
      ${disabledClass}
      ${className}
    `}
  >
```

## Component Props Pattern

**Interface naming:** `{ComponentName}Props`
- Extends HTML attributes where applicable (e.g., `ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>`)
- Optional props marked with `?`
- Children prop explicitly typed (e.g., `children?: React.ReactNode`)

**Example:**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
  className?: string;
}
```

---

*Convention analysis: 2025-02-23*
