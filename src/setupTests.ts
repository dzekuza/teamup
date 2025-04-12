// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Add TypeScript declarations for global mocks
declare global {
  namespace NodeJS {
    interface Global {
      mockFirebase: {
        collection: jest.Mock;
        doc: jest.Mock;
        addDoc: jest.Mock;
        getDocs: jest.Mock;
        updateDoc: jest.Mock;
        deleteDoc: jest.Mock;
        query: jest.Mock;
        orderBy: jest.Mock;
        where: jest.Mock;
        onSnapshot: jest.Mock;
      }
    }
  }
}

// Add TextEncoder/TextDecoder polyfills for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock Firebase
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockAddDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockQuery = jest.fn();
const mockOrderBy = jest.fn();
const mockWhere = jest.fn();
const mockOnSnapshot = jest.fn();

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
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: mockCollection,
  doc: mockDoc,
  addDoc: mockAddDoc,
  getDocs: mockGetDocs,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  query: mockQuery,
  orderBy: mockOrderBy,
  where: mockWhere,
  onSnapshot: mockOnSnapshot,
}));

// Make mocks available globally for tests
(global as any).mockFirebase = {
  collection: mockCollection,
  doc: mockDoc,
  addDoc: mockAddDoc,
  getDocs: mockGetDocs,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  query: mockQuery,
  orderBy: mockOrderBy,
  where: mockWhere,
  onSnapshot: mockOnSnapshot,
};
