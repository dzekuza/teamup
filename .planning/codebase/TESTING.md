# Testing Patterns

**Analysis Date:** 2025-02-23

## Test Framework

**Runner:**
- Jest (via react-scripts)
- Config: Implicit via `package.json` ESLint extends `react-app/jest`
- Version: Based on react-scripts 5.0.1 dependencies

**Assertion Library:**
- Jest built-in matchers (expect API)
- React Testing Library for DOM assertions

**Test Libraries:**
- `@testing-library/react`: 14.2.1 (component testing)
- `@testing-library/jest-dom`: 6.4.2 (DOM matchers)
- `@testing-library/user-event`: 14.5.2 (user interaction simulation)
- `@types/jest`: 29.5.12 (TypeScript support)

**Run Commands:**
```bash
npm test                    # Run all tests (watch mode by default)
npm test -- --coverage     # Run tests with coverage report
npm test -- --no-coverage  # Run tests without coverage
npm test -- --bail         # Stop on first test failure
```

## Test File Organization

**Location:**
- Co-located with source files in same directory
- Pattern: `{ComponentName}.test.tsx` or `{ComponentName}.test.ts`

**Naming:**
- Files ending in `.test.tsx` for React component tests
- Convention matches react-scripts defaults

**Structure:**
```
src/
├── App.test.tsx          # Root component tests
├── components/
│   ├── CreateEventDialog.tsx
│   └── CreateEventDialog.test.tsx
├── pages/
│   ├── Home.tsx
│   └── Home.test.tsx
└── setupTests.ts         # Global test setup
```

**Existing Tests:** 3 test files found
- `src/App.test.tsx`
- `src/components/CreateEventDialog.test.tsx`
- `src/pages/Home.test.tsx`

## Test Structure

**Suite Organization:**
```typescript
// Pattern from codebase tests
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Component } from './Component';

describe('Component', () => {
  it('renders without crashing', () => {
    render(<Component />);
    expect(screen.getByText(/pattern/i)).toBeInTheDocument();
  });

  it('displays message when condition met', () => {
    render(<Component data={mockData} />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

**Patterns:**
- `describe()` blocks for test suites (one per component/module)
- `it()` for individual test cases
- `beforeEach()` for setup (mock clearing)
- `render()` from React Testing Library for component mounting
- Screen queries: `getByText()`, `getByPlaceholderText()`, `getByRole()`, `queryByText()`

**Example from Home.test.tsx:**
```typescript
describe('Home', () => {
  it('renders without crashing', () => {
    render(<Home />);
    expect(screen.getByText('Padel Events')).toBeInTheDocument();
  });

  it('shows login message when user is not authenticated', () => {
    render(<Home />);
    expect(screen.getByText('Please log in to create events and join games.')).toBeInTheDocument();
  });
});
```

## Mocking

**Framework:** Jest's built-in mocking system

**Patterns:**

**1. Hook Mocking:**
```typescript
// From App.test.tsx
jest.mock('./hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signOut: jest.fn(),
  })
}));
```

**2. Route Mocking:**
```typescript
// From CreateEventDialog.test.tsx
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));
```

**3. Firebase/Firestore Mocking:**
```typescript
// From CreateEventDialog.test.tsx
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve({ id: 'test-event-id' }))
}));
```

**4. Component Mocking:**
```typescript
// From Home.test.tsx
jest.mock('../components/EventCard', () => ({
  EventCard: ({ event }: { event: Event }) => <div data-testid="event-card">{event.title}</div>
}));

jest.mock('../components/CreateEventDialog', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? <div data-testid="create-dialog">Create Event Dialog</div> : null
}));
```

**What to Mock:**
- External dependencies (Firebase, Supabase, API calls)
- Custom hooks (useAuth, useEvents, useNavigation)
- Child components (to isolate unit tests)
- Router functions (useNavigate, useLocation)
- Service functions (email sending, notifications)

**What NOT to Mock:**
- Built-in React hooks (useState, useEffect) - test real behavior
- Rendering library components (except complex ones in isolation)
- Utility functions used internally
- Event handlers and user interactions

## Fixtures and Factories

**Test Data:**
- Inline mock objects created in tests
- No factory functions or fixtures library used
- Simple object literals for mock data

**Example from CreateEventDialog.test.tsx:**
```typescript
const mockProps = {
  open: true,
  onClose: jest.fn(),
  onEventCreated: jest.fn()
};

beforeEach(() => {
  jest.clearAllMocks();
});
```

**Location:**
- Inline in test files (no shared fixtures directory)
- Mock functions created with `jest.fn()`
- Reset with `jest.clearAllMocks()` in `beforeEach()`

## Setup and Teardown

**Global Setup:**
- File: `src/setupTests.ts` (auto-loaded by react-scripts)
- Imports `@testing-library/jest-dom` for custom matchers
- Global Firebase mocks defined for all tests
- TextEncoder/TextDecoder polyfills for Node.js environment

**setupTests.ts Overview:**
```typescript
// Loads jest-dom matchers
import '@testing-library/jest-dom';

// Defines global mocks for Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn((auth, fn) => fn(null)),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  })),
  // ... more Firebase mocks
}));

// Makes mocks available globally
(global as any).mockFirebase = { ... };
```

**Per-Test Setup:**
- `beforeEach()` for clearing mocks before each test
- Example: `jest.clearAllMocks()` in CreateEventDialog.test.tsx

## Coverage

**Requirements:** Not enforced

**View Coverage:**
```bash
npm test -- --coverage
```

**Current Coverage:** No coverage targets configured

**Notes:**
- Only 3 test files exist for entire codebase (16,699 lines of TypeScript)
- Significant coverage gaps (most pages and components untested)
- No CI/CD coverage gate configured

## Test Types

**Unit Tests:**
- Focus: Individual components and functions in isolation
- Approach: Mock dependencies, test props and state changes
- Example: `Button.tsx` behavior with different props
- Current coverage: Minimal (only 3 components have tests)

**Integration Tests:**
- Focus: Component interactions and data flow
- Approach: Mock external services, test user workflows
- Example: Home page with filters and event creation
- Current coverage: Very limited (Home.test.tsx covers basic rendering)

**E2E Tests:**
- Framework: Not used
- Status: No end-to-end test suite configured

**Skipped Areas:**
- Page components (EventDetails, Locations, Community, etc.)
- Service layer (sendGridService, emailService, etc.)
- Hooks beyond basic examples (useSupabaseAuth, useEvents, etc.)
- User interactions and form submissions
- API route handlers (api/send-email.ts)

## Common Patterns

**Async Testing:**
- No explicit async patterns observed in current tests
- Firebase mocks return Promises that resolve immediately
- Service functions tested synchronously via mocks
- Would need `async/await` in tests for real async operations

**Example pattern (not in current codebase but typical):**
```typescript
// How async tests should be structured
it('fetches and displays events', async () => {
  // Mock would return Promise
  render(<EventList />);

  // Wait for async operation
  const events = await screen.findByText('Event Title');
  expect(events).toBeInTheDocument();
});
```

**Error Testing:**
- Minimal error testing in current suite
- No tests for error boundaries or error states
- Error scenarios could be tested by mocking failures

**Example pattern:**
```typescript
it('handles error when fetching fails', () => {
  jest.mock('../services/eventService', () => ({
    getEvents: jest.fn().mockRejectedValue(new Error('API error'))
  }));

  render(<EventList />);
  expect(screen.getByText(/error/i)).toBeInTheDocument();
});
```

## React Testing Library Queries

**Query Priority (from Testing Library docs):**
1. `getByRole()` - Most accessible
2. `getByLabelText()` - Form labels
3. `getByPlaceholderText()` - Placeholder text
4. `getByText()` - Visible text
5. `getByTestId()` - Last resort, used minimally

**Queries Used in Current Tests:**
- `getByText(/pattern/i)` - Case-insensitive text matching (case-insensitive regex flags)
- `getByPlaceholderText()` - For form inputs
- `getByRole()` - For buttons and semantic elements
- `queryByText()` - Assert element doesn't exist

**Example:**
```typescript
// From CreateEventDialog.test.tsx
expect(screen.getByPlaceholderText('Event title')).toBeInTheDocument();
expect(screen.getByRole('button', { name: 'Create new event' })).toBeInTheDocument();
expect(screen.queryByPlaceholderText('Event title')).not.toBeInTheDocument();
```

## Testing Utilities

**Helper Functions:**
- `render()` from `@testing-library/react`
- `screen` for querying rendered output
- `fireEvent` from React Testing Library (used in Home.test.tsx but not in others)

**Example from Home.test.tsx:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';

it('example test', () => {
  render(<Home />);
  const element = screen.getByText('text');
  fireEvent.click(element); // Simulate click
});
```

## Gaps and Opportunities

**Untested Components:**
- `EventCard.tsx` (982 lines, many user interactions)
- `CreateEventDialog.tsx` (1497 lines, form handling)
- `EditEventDialog.tsx` (591 lines)
- All page components except Home (EventDetails, Locations, Community, SavedEvents, etc.)
- All service layer functions (email, notifications, Firebase operations)

**Missing Test Types:**
- No integration tests for multi-component workflows
- No E2E tests for user journeys
- No snapshot tests
- No performance tests

**Coverage Priority:** See CONCERNS.md for testing debt recommendations

---

*Testing analysis: 2025-02-23*
