// Mock Supabase client for Jest tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSupabaseClient: any = {
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  insert: jest.fn(() => mockSupabaseClient),
  update: jest.fn(() => mockSupabaseClient),
  delete: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  ilike: jest.fn(() => mockSupabaseClient),
  single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
  rpc: jest.fn(() => Promise.resolve({ data: {}, error: null })),
  limit: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => mockSupabaseClient),
  // Add any other Supabase client methods your services might use
  auth: {
    signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: { id: 'user-123'}, session: {}}, error: null })),
    signUp: jest.fn(() => Promise.resolve({ data: { user: { id: 'user-123'}, session: {}}, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    getSession: jest.fn(() => Promise.resolve({ data: { session: { user: {id: 'user-123'}}}, error: null })),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn()}}})),
  },
  storage: {
    from: jest.fn(() => mockSupabaseClient), // Chain for storage.from('bucket')
    upload: jest.fn(() => Promise.resolve({ data: { path: 'mock/path.jpg' }, error: null })),
    download: jest.fn(() => Promise.resolve({ data: new Blob(['mock content']), error: null })),
    remove: jest.fn(() => Promise.resolve({ data: {}, error: null })),
    getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'http://localhost/mock-public-url.jpg' }})),
    // Add 'list' and other storage methods if used
  }
};

export const supabase = mockSupabaseClient; 