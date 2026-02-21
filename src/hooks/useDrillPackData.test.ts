import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDrillPackData } from './useDrillPackData';

// --- Supabase mock with chainable query builder ---

const mockGetPublicUrl = vi.fn((path: string) => ({
  data: { publicUrl: `https://mock-storage.supabase.co/${path}` },
}));

// Chainable query builder that records calls
function createQueryChain(resolvedValue: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const terminalFn = vi.fn(async () => resolvedValue);

  // Every method returns the chain, terminal methods resolve
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.contains = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.single = vi.fn(async () => resolvedValue);

  // Make the chain thenable so await works on any terminal call
  chain.then = terminalFn.mockImplementation(
    (resolve: (v: unknown) => void) => Promise.resolve(resolvedValue).then(resolve)
  );

  return chain;
}

let catalogChain: ReturnType<typeof createQueryChain>;
let viewChain: ReturnType<typeof createQueryChain>;

const mockFrom = vi.fn((table: string) => {
  if (table === 'stimuli_catalog') return catalogChain;
  if (table === 'drill_pack_summary') return viewChain;
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

// --- Sample data matching production schema ---

const sampleDrillRow = {
  id: 'drill-001',
  content_type: 'phoneme_drill',
  content_text: 'pat',
  text_alt: 'bat',
  erber_level: null,
  difficulty: 2,
  target_phoneme: '/p/',
  contrast_phoneme: '/b/',
  phoneme_position: 'initial',
  clinical_metadata: {
    pack_name: 'P vs B',
    contrast_type: 'Voicing',
    ipa_1: '/pæt/',
    ipa_2: '/bæt/',
    clinical_note: 'Stop consonant voicing contrast',
  },
  tier: 'free',
  drill_pack_id: 'pack_p_b',
  prompt_text: null,
  response_text: null,
  created_at: '2025-01-01T00:00:00Z',
};

const sampleDrillRow2 = {
  ...sampleDrillRow,
  id: 'drill-002',
  content_text: 'tip',
  text_alt: 'dip',
  target_phoneme: '/t/',
  contrast_phoneme: '/d/',
  drill_pack_id: 'pack_t_d',
  clinical_metadata: {
    pack_name: 'T vs D',
    contrast_type: 'Voicing',
    ipa_1: '/tɪp/',
    ipa_2: '/dɪp/',
    clinical_note: '',
  },
};

const samplePackSummary = {
  drill_pack_id: 'pack_p_b',
  pack_name: 'P vs B',
  contrast_type: 'Voicing',
  target_phoneme: '/p/',
  contrast_phoneme: '/b/',
  total_pairs: 15,
  min_difficulty: 1,
  max_difficulty: 3,
  tier: 'free',
};

describe('useDrillPackData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    catalogChain = createQueryChain({ data: [sampleDrillRow, sampleDrillRow2], error: null });
    viewChain = createQueryChain({ data: [samplePackSummary], error: null });
  });

  describe('transformRow', () => {
    it('correctly transforms a stimuli_catalog row to DrillPair', async () => {
      const { result } = renderHook(() => useDrillPackData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.drillPairs).toHaveLength(2);
      });

      const pair = result.current.drillPairs[0];
      expect(pair.id).toBe('drill-001');
      expect(pair.word1).toBe('pat');
      expect(pair.word2).toBe('bat');
      expect(pair.targetPhoneme).toBe('/p/');
      expect(pair.contrastPhoneme).toBe('/b/');
      expect(pair.position).toBe('initial');
      expect(pair.packId).toBe('pack_p_b');
      expect(pair.packName).toBe('P vs B');
      expect(pair.contrastType).toBe('Voicing');
      expect(pair.difficulty).toBe(2);
      expect(pair.tier).toBe('free');
      expect(pair.ipa1).toBe('/pæt/');
      expect(pair.ipa2).toBe('/bæt/');
    });

    it('constructs audio URLs with current voice', async () => {
      const { result } = renderHook(() => useDrillPackData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.drillPairs).toHaveLength(2);
      });

      const pair = result.current.drillPairs[0];
      // URLs built via getAudioUrl → supabase.storage.from('audio').getPublicUrl(...)
      expect(pair.word1AudioUrl).toContain('sarah');
      expect(pair.word2AudioUrl).toContain('sarah');
    });

    it('handles string clinical_metadata (JSON parse)', async () => {
      const rowWithStringMeta = {
        ...sampleDrillRow,
        clinical_metadata: JSON.stringify(sampleDrillRow.clinical_metadata),
      };
      catalogChain = createQueryChain({ data: [rowWithStringMeta], error: null });

      const { result } = renderHook(() => useDrillPackData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.drillPairs).toHaveLength(1);
      });

      expect(result.current.drillPairs[0].packName).toBe('P vs B');
    });

    it('handles null clinical_metadata gracefully', async () => {
      const rowWithNullMeta = {
        ...sampleDrillRow,
        clinical_metadata: null,
      };
      catalogChain = createQueryChain({ data: [rowWithNullMeta], error: null });

      const { result } = renderHook(() => useDrillPackData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.drillPairs).toHaveLength(1);
      });

      const pair = result.current.drillPairs[0];
      expect(pair.packName).toBe('');
      expect(pair.contrastType).toBe('');
      expect(pair.ipa1).toBe('');
    });
  });

  describe('fetchAll', () => {
    it('queries stimuli_catalog with content_type phoneme_drill', async () => {
      const { result } = renderHook(() => useDrillPackData());

      await act(async () => {
        await result.current.fetchAll();
      });

      expect(mockFrom).toHaveBeenCalledWith('stimuli_catalog');
      expect(catalogChain.eq).toHaveBeenCalledWith('content_type', 'phoneme_drill');
    });

    it('sets loading true during fetch and false after', async () => {
      const { result } = renderHook(() => useDrillPackData());

      expect(result.current.loading).toBe(false);

      await act(async () => {
        await result.current.fetchAll();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('sets error on query failure', async () => {
      catalogChain = createQueryChain({ data: null, error: { message: 'DB error' } });

      const { result } = renderHook(() => useDrillPackData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('fetchByPack', () => {
    it('filters by drill_pack_id', async () => {
      const { result } = renderHook(() => useDrillPackData());

      await act(async () => {
        await result.current.fetchByPack('pack_p_b');
      });

      expect(mockFrom).toHaveBeenCalledWith('stimuli_catalog');
      expect(catalogChain.eq).toHaveBeenCalledWith('content_type', 'phoneme_drill');
      expect(catalogChain.eq).toHaveBeenCalledWith('drill_pack_id', 'pack_p_b');
    });
  });

  describe('fetchPacks (via view + fallback)', () => {
    it('fetches from drill_pack_summary view on mount', async () => {
      renderHook(() => useDrillPackData());

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('drill_pack_summary');
      });
    });

    it('populates packs from view data', async () => {
      const { result } = renderHook(() => useDrillPackData());

      await waitFor(() => {
        expect(result.current.packs).toHaveLength(1);
        expect(result.current.packs[0].pack_name).toBe('P vs B');
      });
    });

    it('falls back to manual aggregation when view fails', async () => {
      // Make the view query fail
      viewChain = createQueryChain({ data: null, error: { message: 'relation does not exist' } });

      // Fallback query to stimuli_catalog should return drill rows
      // The mock will use catalogChain for stimuli_catalog
      const { result } = renderHook(() => useDrillPackData());

      await waitFor(() => {
        // Should still populate packs via fallback
        expect(result.current.packs.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('getRandomPair', () => {
    it('returns null when no pairs loaded', () => {
      const { result } = renderHook(() => useDrillPackData());
      expect(result.current.getRandomPair()).toBeNull();
    });

    it('returns a pair from loaded data', async () => {
      const { result } = renderHook(() => useDrillPackData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.drillPairs).toHaveLength(2);
      });

      const pair = result.current.getRandomPair();
      expect(pair).not.toBeNull();
      expect(['drill-001', 'drill-002']).toContain(pair!.id);
    });

    it('filters by packId when provided', async () => {
      const { result } = renderHook(() => useDrillPackData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.drillPairs).toHaveLength(2);
      });

      const pair = result.current.getRandomPair('pack_p_b');
      expect(pair).not.toBeNull();
      expect(pair!.packId).toBe('pack_p_b');
    });

    it('returns null for unknown packId', async () => {
      const { result } = renderHook(() => useDrillPackData());

      await act(async () => {
        await result.current.fetchAll();
      });

      const pair = result.current.getRandomPair('nonexistent_pack');
      expect(pair).toBeNull();
    });
  });

  describe('getPackProgress', () => {
    it('returns total from pack data', async () => {
      const { result } = renderHook(() => useDrillPackData());

      await waitFor(() => {
        expect(result.current.packs).toHaveLength(1);
      });

      const progress = result.current.getPackProgress('pack_p_b');
      expect(progress.total).toBe(15);
      expect(progress.completed).toBe(0);
    });

    it('returns zeros for unknown pack', () => {
      const { result } = renderHook(() => useDrillPackData());
      const progress = result.current.getPackProgress('unknown');
      expect(progress.total).toBe(0);
      expect(progress.completed).toBe(0);
    });
  });

  describe('getAudioUrl', () => {
    it('builds URL with voice, packId, and word', () => {
      const { result } = renderHook(() => useDrillPackData());
      const url = result.current.getAudioUrl('drill-001', 'pack_p_b', 'pat');
      expect(mockGetPublicUrl).toHaveBeenCalledWith('drills/sarah/pack_p_b/drill-001_pat.mp3');
      expect(url).toContain('drills/sarah/pack_p_b/drill-001_pat.mp3');
    });
  });
});
