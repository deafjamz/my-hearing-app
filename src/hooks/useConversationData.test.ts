import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useConversationData } from './useConversationData';

// --- Supabase mock with chainable query builder ---

const mockGetPublicUrl = vi.fn((path: string) => ({
  data: { publicUrl: `https://mock-storage.supabase.co/${path}` },
}));

function createQueryChain(resolvedValue: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.contains = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.single = vi.fn(async () => resolvedValue);
  chain.then = vi.fn((resolve: (v: unknown) => void) =>
    Promise.resolve(resolvedValue).then(resolve)
  );

  return chain;
}

let catalogChain: ReturnType<typeof createQueryChain>;
let viewChain: ReturnType<typeof createQueryChain>;

const mockFrom = vi.fn((table: string) => {
  if (table === 'stimuli_catalog') return catalogChain;
  if (table === 'conversation_categories') return viewChain;
  return createQueryChain({ data: [], error: null });
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...(args as [string])),
    storage: {
      from: () => ({ getPublicUrl: mockGetPublicUrl }),
    },
  },
}));

vi.mock('@/store/VoiceContext', () => ({
  useVoice: () => ({ currentVoice: 'sarah' }),
}));

// --- Sample data ---

const sampleConvRow = {
  id: 'conv-001',
  content_type: 'conversation',
  content_text: 'I need to schedule a checkup',
  text_alt: null,
  erber_level: null,
  difficulty: 2,
  target_phoneme: '/s/',
  contrast_phoneme: null,
  phoneme_position: null,
  clinical_metadata: {
    category: 'appointments',
    target_keyword: 'checkup',
    acoustic_foil: 'checkout',
    semantic_foil: 'appointment',
    plausible_foil: 'pickup',
  },
  tier: 'free',
  drill_pack_id: null,
  prompt_text: 'Can I help you today?',
  response_text: 'Yes, I need to schedule a checkup.',
  created_at: '2025-01-01T00:00:00Z',
};

const sampleConvRow2 = {
  ...sampleConvRow,
  id: 'conv-002',
  content_text: 'Turn left at the next corner',
  clinical_metadata: {
    category: 'directions',
    target_keyword: 'corner',
    acoustic_foil: 'coroner',
    semantic_foil: 'intersection',
    plausible_foil: 'corridor',
  },
  difficulty: 3,
  prompt_text: 'How do I get to the park?',
  response_text: 'Turn left at the next corner.',
};

const sampleViewCategory = {
  category: 'appointments',
  total_pairs: 10,
  min_difficulty: 1,
  max_difficulty: 3,
  target_phonemes: ['/s/', '/t/'],
};

describe('useConversationData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    catalogChain = createQueryChain({ data: [sampleConvRow, sampleConvRow2], error: null });
    viewChain = createQueryChain({ data: [sampleViewCategory], error: null });
  });

  describe('transformRow', () => {
    it('correctly transforms a stimuli_catalog row to ConversationPair', async () => {
      const { result } = renderHook(() => useConversationData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.conversations).toHaveLength(2);
      });

      const conv = result.current.conversations[0];
      expect(conv.id).toBe('conv-001');
      expect(conv.promptText).toBe('Can I help you today?');
      expect(conv.responseText).toBe('Yes, I need to schedule a checkup.');
      expect(conv.targetKeyword).toBe('checkup');
      expect(conv.targetPhoneme).toBe('/s/');
      expect(conv.category).toBe('appointments');
      expect(conv.difficulty).toBe(2);
      expect(conv.acousticFoil).toBe('checkout');
      expect(conv.semanticFoil).toBe('appointment');
      expect(conv.plausibleFoil).toBe('pickup');
    });

    it('constructs audio URLs with current voice', async () => {
      const { result } = renderHook(() => useConversationData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.conversations).toHaveLength(2);
      });

      const conv = result.current.conversations[0];
      expect(conv.promptAudioUrl).toContain('sarah');
      expect(conv.responseAudioUrl).toContain('sarah');
    });

    it('falls back to content_text when prompt_text is null', async () => {
      const rowNoPT = { ...sampleConvRow, prompt_text: null };
      catalogChain = createQueryChain({ data: [rowNoPT], error: null });

      const { result } = renderHook(() => useConversationData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.conversations).toHaveLength(1);
      });

      // promptText falls back to content_text
      expect(result.current.conversations[0].promptText).toBe('I need to schedule a checkup');
    });

    it('handles null clinical_metadata gracefully', async () => {
      const rowNullMeta = { ...sampleConvRow, clinical_metadata: null };
      catalogChain = createQueryChain({ data: [rowNullMeta], error: null });

      const { result } = renderHook(() => useConversationData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.conversations).toHaveLength(1);
      });

      const conv = result.current.conversations[0];
      expect(conv.category).toBe('general');
      expect(conv.targetKeyword).toBe('');
      expect(conv.acousticFoil).toBe('');
    });
  });

  describe('fetchAll', () => {
    it('queries stimuli_catalog with content_type conversation', async () => {
      const { result } = renderHook(() => useConversationData());

      await act(async () => {
        await result.current.fetchAll();
      });

      expect(mockFrom).toHaveBeenCalledWith('stimuli_catalog');
      expect(catalogChain.eq).toHaveBeenCalledWith('content_type', 'conversation');
    });

    it('sets loading to false and error to null on success', async () => {
      const { result } = renderHook(() => useConversationData());

      await act(async () => {
        await result.current.fetchAll();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('sets error on query failure', async () => {
      catalogChain = createQueryChain({ data: null, error: { message: 'Network error' } });

      const { result } = renderHook(() => useConversationData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('fetchByCategory', () => {
    it('filters by category via contains on clinical_metadata', async () => {
      const { result } = renderHook(() => useConversationData());

      await act(async () => {
        await result.current.fetchByCategory('appointments');
      });

      expect(catalogChain.contains).toHaveBeenCalledWith('clinical_metadata', { category: 'appointments' });
    });
  });

  describe('fetchCategories (view + fallback)', () => {
    it('fetches from conversation_categories view on mount', async () => {
      renderHook(() => useConversationData());

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('conversation_categories');
      });
    });

    it('populates categories from view data', async () => {
      const { result } = renderHook(() => useConversationData());

      await waitFor(() => {
        expect(result.current.categories).toHaveLength(1);
        expect(result.current.categories[0].category).toBe('appointments');
        expect(result.current.categories[0].total_pairs).toBe(10);
      });
    });

    it('falls back to manual aggregation when view query errors', async () => {
      viewChain = createQueryChain({ data: null, error: { message: 'relation does not exist' } });

      const { result } = renderHook(() => useConversationData());

      // Fallback uses stimuli_catalog; the mock returns conv rows
      await waitFor(() => {
        // Should still attempt to populate categories via fallback
        expect(mockFrom).toHaveBeenCalledWith('stimuli_catalog');
      });
    });
  });

  describe('getRandomPair', () => {
    it('returns null when no conversations loaded', () => {
      const { result } = renderHook(() => useConversationData());
      expect(result.current.getRandomPair()).toBeNull();
    });

    it('returns a conversation from loaded data', async () => {
      const { result } = renderHook(() => useConversationData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.conversations).toHaveLength(2);
      });

      const pair = result.current.getRandomPair();
      expect(pair).not.toBeNull();
      expect(['conv-001', 'conv-002']).toContain(pair!.id);
    });

    it('filters by category when provided', async () => {
      const { result } = renderHook(() => useConversationData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.conversations).toHaveLength(2);
      });

      const pair = result.current.getRandomPair('appointments');
      expect(pair).not.toBeNull();
      expect(pair!.category).toBe('appointments');
    });

    it('returns null for category with no matches', async () => {
      const { result } = renderHook(() => useConversationData());

      await act(async () => {
        await result.current.fetchAll();
      });

      const pair = result.current.getRandomPair('nonexistent');
      expect(pair).toBeNull();
    });
  });

  describe('getAudioUrl', () => {
    it('builds URL with voice and conversation type', () => {
      const { result } = renderHook(() => useConversationData());
      const url = result.current.getAudioUrl('conv-001', 'prompt');
      expect(mockGetPublicUrl).toHaveBeenCalledWith('conversations/sarah/conv-001_prompt.mp3');
      expect(url).toContain('conversations/sarah/conv-001_prompt.mp3');
    });

    it('builds response URL correctly', () => {
      const { result } = renderHook(() => useConversationData());
      const url = result.current.getAudioUrl('conv-001', 'response');
      expect(mockGetPublicUrl).toHaveBeenCalledWith('conversations/sarah/conv-001_response.mp3');
      expect(url).toContain('conversations/sarah/conv-001_response.mp3');
    });
  });
});
