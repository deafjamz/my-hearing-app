import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEnvironmentalData } from './useEnvironmentalData';

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
  if (table === 'environmental_sound_categories') return viewChain;
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

// --- Sample data ---

const sampleSoundRow = {
  id: 'sound-001',
  content_type: 'environmental_sound',
  content_text: 'doorbell',
  text_alt: null,
  erber_level: null,
  difficulty: 2,
  target_phoneme: null,
  contrast_phoneme: null,
  phoneme_position: null,
  clinical_metadata: {
    name: 'Doorbell Ring',
    description: 'A standard doorbell ringing sound',
    category: 'household',
    intensity: 'moderate',
    foils: ['phone', 'alarm', 'timer'],
    acoustic_similarity: 'tonal',
    safety_critical: false,
  },
  tier: 'free',
  drill_pack_id: null,
  prompt_text: null,
  response_text: null,
  created_at: '2025-01-01T00:00:00Z',
};

const sampleSafetyRow = {
  ...sampleSoundRow,
  id: 'sound-002',
  content_text: 'fire_alarm',
  clinical_metadata: {
    name: 'Fire Alarm',
    description: 'Emergency fire alarm siren',
    category: 'safety',
    intensity: 'high',
    foils: ['car_horn', 'ambulance', 'doorbell'],
    acoustic_similarity: 'siren',
    safety_critical: true,
  },
  difficulty: 1,
};

const sampleViewCategory = {
  category: 'household',
  total_sounds: 12,
  safety_critical_count: 0,
  min_difficulty: 1,
  max_difficulty: 3,
};

describe('useEnvironmentalData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    catalogChain = createQueryChain({ data: [sampleSoundRow, sampleSafetyRow], error: null });
    viewChain = createQueryChain({ data: [sampleViewCategory], error: null });
  });

  describe('transformRow', () => {
    it('correctly transforms a stimuli_catalog row to EnvironmentalSound', async () => {
      const { result } = renderHook(() => useEnvironmentalData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.sounds).toHaveLength(2);
      });

      const sound = result.current.sounds[0];
      expect(sound.id).toBe('sound-001');
      expect(sound.name).toBe('Doorbell Ring');
      expect(sound.description).toBe('A standard doorbell ringing sound');
      expect(sound.correctAnswer).toBe('doorbell');
      expect(sound.category).toBe('household');
      expect(sound.intensity).toBe('moderate');
      expect(sound.difficulty).toBe(2);
      expect(sound.tier).toBe('free');
      expect(sound.foils).toEqual(['phone', 'alarm', 'timer']);
      expect(sound.acousticSimilarity).toBe('tonal');
      expect(sound.safetyCritical).toBe(false);
    });

    it('identifies safety-critical sounds', async () => {
      const { result } = renderHook(() => useEnvironmentalData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.sounds).toHaveLength(2);
      });

      const safetySound = result.current.sounds.find(s => s.id === 'sound-002');
      expect(safetySound).toBeDefined();
      expect(safetySound!.safetyCritical).toBe(true);
      expect(safetySound!.name).toBe('Fire Alarm');
    });

    it('constructs audio URLs by category (no voice)', async () => {
      const { result } = renderHook(() => useEnvironmentalData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.sounds).toHaveLength(2);
      });

      const sound = result.current.sounds[0];
      expect(sound.audioUrl).toContain('environmental/household/sound-001.mp3');
    });

    it('handles null clinical_metadata gracefully', async () => {
      const rowNullMeta = { ...sampleSoundRow, clinical_metadata: null };
      catalogChain = createQueryChain({ data: [rowNullMeta], error: null });

      const { result } = renderHook(() => useEnvironmentalData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.sounds).toHaveLength(1);
      });

      const sound = result.current.sounds[0];
      expect(sound.category).toBe('general');
      expect(sound.name).toBe('doorbell'); // falls back to content_text
      expect(sound.foils).toEqual([]);
      expect(sound.safetyCritical).toBe(false);
    });

    it('handles string clinical_metadata (JSON parse)', async () => {
      const rowStringMeta = {
        ...sampleSoundRow,
        clinical_metadata: JSON.stringify(sampleSoundRow.clinical_metadata),
      };
      catalogChain = createQueryChain({ data: [rowStringMeta], error: null });

      const { result } = renderHook(() => useEnvironmentalData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.sounds).toHaveLength(1);
      });

      expect(result.current.sounds[0].name).toBe('Doorbell Ring');
    });
  });

  describe('fetchAll', () => {
    it('queries stimuli_catalog with content_type environmental_sound', async () => {
      const { result } = renderHook(() => useEnvironmentalData());

      await act(async () => {
        await result.current.fetchAll();
      });

      expect(mockFrom).toHaveBeenCalledWith('stimuli_catalog');
      expect(catalogChain.eq).toHaveBeenCalledWith('content_type', 'environmental_sound');
    });

    it('sets error on query failure', async () => {
      catalogChain = createQueryChain({ data: null, error: { message: 'DB timeout' } });

      const { result } = renderHook(() => useEnvironmentalData());

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
      const { result } = renderHook(() => useEnvironmentalData());

      await act(async () => {
        await result.current.fetchByCategory('household');
      });

      expect(catalogChain.contains).toHaveBeenCalledWith('clinical_metadata', { category: 'household' });
    });
  });

  describe('fetchSafetyCritical', () => {
    it('filters for safety_critical: true via contains', async () => {
      const { result } = renderHook(() => useEnvironmentalData());

      await act(async () => {
        await result.current.fetchSafetyCritical();
      });

      expect(catalogChain.contains).toHaveBeenCalledWith('clinical_metadata', { safety_critical: true });
    });
  });

  describe('fetchCategories (view + fallback)', () => {
    it('fetches from environmental_sound_categories view on mount', async () => {
      renderHook(() => useEnvironmentalData());

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('environmental_sound_categories');
      });
    });

    it('populates categories from view data', async () => {
      const { result } = renderHook(() => useEnvironmentalData());

      await waitFor(() => {
        expect(result.current.categories).toHaveLength(1);
        expect(result.current.categories[0].category).toBe('household');
        expect(result.current.categories[0].total_sounds).toBe(12);
      });
    });

    it('falls back to manual aggregation when view query errors', async () => {
      viewChain = createQueryChain({ data: null, error: { message: 'relation does not exist' } });

      const { result } = renderHook(() => useEnvironmentalData());

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('stimuli_catalog');
      });
    });
  });

  describe('getRandomSound', () => {
    it('returns null when no sounds loaded', () => {
      const { result } = renderHook(() => useEnvironmentalData());
      expect(result.current.getRandomSound()).toBeNull();
    });

    it('returns a sound from loaded data', async () => {
      const { result } = renderHook(() => useEnvironmentalData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.sounds).toHaveLength(2);
      });

      const sound = result.current.getRandomSound();
      expect(sound).not.toBeNull();
      expect(['sound-001', 'sound-002']).toContain(sound!.id);
    });

    it('filters by category when provided', async () => {
      const { result } = renderHook(() => useEnvironmentalData());

      await act(async () => {
        await result.current.fetchAll();
      });

      await waitFor(() => {
        expect(result.current.sounds).toHaveLength(2);
      });

      const sound = result.current.getRandomSound('household');
      expect(sound).not.toBeNull();
      expect(sound!.category).toBe('household');
    });

    it('returns null for category with no matches', async () => {
      const { result } = renderHook(() => useEnvironmentalData());

      await act(async () => {
        await result.current.fetchAll();
      });

      const sound = result.current.getRandomSound('nonexistent');
      expect(sound).toBeNull();
    });
  });

  describe('getAudioUrl', () => {
    it('builds URL with category and soundId (no voice)', () => {
      const { result } = renderHook(() => useEnvironmentalData());
      const url = result.current.getAudioUrl('sound-001', 'household');
      expect(mockGetPublicUrl).toHaveBeenCalledWith('environmental/household/sound-001.mp3');
      expect(url).toContain('environmental/household/sound-001.mp3');
    });
  });
});
