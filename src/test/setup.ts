import '@testing-library/jest-dom';
import { afterEach, vi, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});

// ============================================================================
// Web Audio API Mocks
// ============================================================================

class MockGainNode {
  gain = { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockAudioBufferSourceNode {
  buffer: AudioBuffer | null = null;
  loop = false;
  onended: (() => void) | null = null;
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn(() => {
    if (this.onended) this.onended();
  });
}

class MockAudioBuffer {
  length = 44100;
  duration = 1;
  numberOfChannels = 2;
  sampleRate = 44100;
  getChannelData = vi.fn(() => new Float32Array(44100));
  copyFromChannel = vi.fn();
  copyToChannel = vi.fn();
}

class MockAudioContext {
  state: AudioContextState = 'suspended';
  currentTime = 0;
  destination = {};
  sampleRate = 44100;
  private listeners: Map<string, Array<() => void>> = new Map();

  createGain = vi.fn(() => new MockGainNode());
  createBufferSource = vi.fn(() => new MockAudioBufferSourceNode());
  decodeAudioData = vi.fn(async () => new MockAudioBuffer());
  resume = vi.fn(async () => {
    this.state = 'running';
    this.dispatchEvent('statechange');
  });
  suspend = vi.fn(async () => {
    this.state = 'suspended';
    this.dispatchEvent('statechange');
  });
  close = vi.fn(async () => {
    this.state = 'closed';
    this.dispatchEvent('statechange');
  });

  addEventListener = vi.fn((event: string, callback: () => void) => {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  });

  removeEventListener = vi.fn((event: string, callback: () => void) => {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  });

  private dispatchEvent(event: string) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb());
  }
}

// Apply Web Audio API mocks globally
vi.stubGlobal('AudioContext', MockAudioContext);
vi.stubGlobal('webkitAudioContext', MockAudioContext);

// Mock fetch for audio loading
vi.stubGlobal('fetch', vi.fn(async () => ({
  ok: true,
  arrayBuffer: async () => new ArrayBuffer(1024),
})));

// ============================================================================
// Capacitor Mocks
// ============================================================================

vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: vi.fn(),
    notification: vi.fn(),
    vibrate: vi.fn(),
    selectionStart: vi.fn(),
    selectionChanged: vi.fn(),
    selectionEnd: vi.fn(),
  },
  ImpactStyle: {
    Heavy: 'HEAVY',
    Medium: 'MEDIUM',
    Light: 'LIGHT',
  },
  NotificationType: {
    Success: 'SUCCESS',
    Warning: 'WARNING',
    Error: 'ERROR',
  },
}));

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    deleteFile: vi.fn(),
    mkdir: vi.fn(),
    stat: vi.fn(),
  },
  Directory: {
    Documents: 'DOCUMENTS',
    Data: 'DATA',
    Cache: 'CACHE',
  },
}));

// ============================================================================
// Supabase Mock
// ============================================================================

const mockSupabaseUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
};

const mockSupabaseSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  user: mockSupabaseUser,
};

export const mockSupabase = {
  auth: {
    getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
    getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
    signUp: vi.fn(async () => ({ data: { user: mockSupabaseUser, session: mockSupabaseSession }, error: null })),
    signInWithPassword: vi.fn(async () => ({ data: { user: mockSupabaseUser, session: mockSupabaseSession }, error: null })),
    signOut: vi.fn(async () => ({ error: null })),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(async () => ({ data: null, error: null })),
        gte: vi.fn(() => ({
          order: vi.fn(async () => ({ data: [], error: null })),
        })),
      })),
      order: vi.fn(async () => ({ data: [], error: null })),
    })),
    insert: vi.fn(async () => ({ data: null, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(async () => ({ data: null, error: null })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(async () => ({ data: null, error: null })),
    })),
  })),
  storage: {
    from: vi.fn(() => ({
      getPublicUrl: vi.fn((path: string) => ({
        data: { publicUrl: `https://mock-storage.supabase.co/${path}` },
      })),
      upload: vi.fn(async () => ({ data: { path: 'mock-path' }, error: null })),
      download: vi.fn(async () => ({ data: new Blob(), error: null })),
    })),
  },
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

// ============================================================================
// localStorage Mock (enhanced)
// ============================================================================

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ============================================================================
// matchMedia Mock (for responsive tests)
// ============================================================================

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ============================================================================
// IntersectionObserver Mock
// ============================================================================

class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

// ============================================================================
// ResizeObserver Mock
// ============================================================================

class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

vi.stubGlobal('ResizeObserver', MockResizeObserver);

// ============================================================================
// Export mock utilities for tests
// ============================================================================

export const mockAudioContext = MockAudioContext;
export const mockGainNode = MockGainNode;
export const mockAudioBufferSourceNode = MockAudioBufferSourceNode;
export { mockSupabaseUser, mockSupabaseSession };

// Helper to set authenticated state in tests
export const setMockAuthenticatedUser = (user = mockSupabaseUser) => {
  mockSupabase.auth.getSession.mockResolvedValue({
    data: { session: { ...mockSupabaseSession, user } },
    error: null,
  });
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user },
    error: null,
  });
};

// Helper to set guest (unauthenticated) state in tests
export const setMockGuestUser = () => {
  mockSupabase.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });
};
