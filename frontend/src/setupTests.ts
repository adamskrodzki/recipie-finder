import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Mock scrollIntoView for JSDOM
Element.prototype.scrollIntoView = jest.fn();

// Mock hooks that cause act warnings in tests
jest.mock('./hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    isLoading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  }),
}));

jest.mock('./hooks/useRecipeStorage', () => ({
  useRecipeStorage: () => ({
    favorites: [],
    ratings: {},
    isLoading: false,
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    addRating: jest.fn(),
    removeRating: jest.fn(),
  }),
}));

// Mock the supabaseClient module to avoid import.meta issues in Jest
jest.mock('./services/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      insert: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      update: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      ilike: jest.fn(() => Promise.resolve({ data: [], error: null })),
      single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
      order: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    auth: {
      signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: { id: 'user-123'}, session: {}}, error: null })),
      signUp: jest.fn(() => Promise.resolve({ data: { user: { id: 'user-123'}, session: {}}, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: { user: {id: 'user-123'}}}, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn()}}})),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: { path: 'mock/path.jpg' }, error: null })),
        download: jest.fn(() => Promise.resolve({ data: new Blob(['mock content']), error: null })),
        remove: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'http://localhost/mock-public-url.jpg' }})),
      })),
    }
  }
})); 