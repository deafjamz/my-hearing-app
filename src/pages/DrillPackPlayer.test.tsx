import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithRouter, screen, fireEvent, waitFor } from '@/test/testUtils';
import { DrillPackPlayer } from './DrillPackPlayer';
import type { DrillPair } from '@/hooks/useDrillPackData';

// Mock react-router-dom params
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ packId: 'pack_p_b' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock hooks
const mockFetchByPack = vi.fn();
const mockLogProgress = vi.fn();
const mockEnsureResumed = vi.fn().mockResolvedValue(undefined);
const mockPlayUrl = vi.fn().mockResolvedValue(undefined);
const mockStopPlayback = vi.fn();
const mockAdvancePlan = vi.fn();

const makePair = (i: number): DrillPair => ({
  id: `drill_${i}`,
  word1: `pat${i}`,
  word2: `bat${i}`,
  targetPhoneme: '/p/',
  contrastPhoneme: '/b/',
  position: 'initial',
  packId: 'pack_p_b',
  packName: 'P vs B',
  contrastType: 'Voicing',
  difficulty: 2,
  tier: 'free',
  ipa1: '/pæt/',
  ipa2: '/bæt/',
  clinicalNote: '',
  word1AudioUrl: `https://audio.test/drill_${i}_pat${i}.mp3`,
  word2AudioUrl: `https://audio.test/drill_${i}_bat${i}.mp3`,
});

const mockPairs: DrillPair[] = Array.from({ length: 15 }, (_, i) => makePair(i));

const mockPacks = [{
  drill_pack_id: 'pack_p_b',
  pack_name: 'P vs B',
  contrast_type: 'Voicing',
  target_phoneme: '/p/',
  contrast_phoneme: '/b/',
  total_pairs: 15,
  min_difficulty: 1,
  max_difficulty: 3,
  tier: 'free',
}];

vi.mock('@/hooks/useDrillPackData', () => ({
  useDrillPackData: vi.fn(() => ({
    drillPairs: mockPairs,
    packs: mockPacks,
    loading: false,
    error: null,
    fetchByPack: mockFetchByPack,
    fetchAll: vi.fn(),
    getRandomPair: vi.fn(),
    getPackProgress: vi.fn(() => ({ total: 15, completed: 0 })),
    getAudioUrl: vi.fn(() => 'https://audio.test/mock.mp3'),
  })),
}));

vi.mock('@/hooks/useSilentSentinel', () => ({
  useSilentSentinel: () => ({
    ensureResumed: mockEnsureResumed,
    playUrl: mockPlayUrl,
    stopPlayback: mockStopPlayback,
    isPlaying: false,
    audioRef: { current: null },
  }),
}));

vi.mock('@/hooks/useProgress', () => ({
  useProgress: () => ({
    logProgress: mockLogProgress,
    loading: false,
  }),
}));

vi.mock('@/store/UserContext', () => ({
  useUser: () => ({
    user: { id: 'test-user' },
    voice: 'sarah',
    hasAccess: () => true,
    loading: false,
  }),
}));

vi.mock('@/store/VoiceContext', () => ({
  useVoice: () => ({
    selectedVoice: { name: 'sarah', gender: 'female' },
  }),
}));

vi.mock('@/hooks/useTodaysPlan', () => ({
  useTodaysPlan: () => ({
    nextActivity: null,
    advancePlan: mockAdvancePlan,
    isInPlan: false,
  }),
}));

vi.mock('@/lib/voiceGender', () => ({
  getVoiceGender: () => 'female',
}));

vi.mock('@/lib/haptics', () => ({
  hapticSelection: vi.fn(),
  hapticSuccess: vi.fn(),
  hapticFailure: vi.fn(),
}));

describe('DrillPackPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders activity briefing before starting', () => {
    renderWithRouter(<DrillPackPlayer />);
    expect(screen.getByText('P vs B')).toBeInTheDocument();
    expect(screen.getByText(/10 pairs/)).toBeInTheDocument();
  });

  it('shows trial interface after clicking start', async () => {
    renderWithRouter(<DrillPackPlayer />);
    const startButton = screen.getByText('Begin');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('1 / 10')).toBeInTheDocument();
    });
  });

  it('fetches pack data on mount', () => {
    renderWithRouter(<DrillPackPlayer />);
    expect(mockFetchByPack).toHaveBeenCalledWith('pack_p_b');
  });

  it('shows two answer buttons during trial', async () => {
    renderWithRouter(<DrillPackPlayer />);
    fireEvent.click(screen.getByText('Begin'));

    await waitFor(() => {
      // Find buttons inside the answer grid (p-8 class = answer buttons)
      const buttons = screen.getAllByRole('button').filter(btn =>
        btn.className.includes('p-8') && btn.className.includes('rounded-2xl')
      );
      expect(buttons).toHaveLength(2);
    });
  });

  it('shows progress bar during trial', async () => {
    renderWithRouter(<DrillPackPlayer />);
    fireEvent.click(screen.getByText('Begin'));

    await waitFor(() => {
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('1 / 10')).toBeInTheDocument();
    });
  });

  it('plays audio when play button clicked', async () => {
    renderWithRouter(<DrillPackPlayer />);
    fireEvent.click(screen.getByText('Begin'));

    await waitFor(() => {
      expect(screen.getByText('1 / 10')).toBeInTheDocument();
    });

    // Find and click the play button (the large circular one)
    const playButtons = screen.getAllByRole('button');
    const playButton = playButtons.find(btn =>
      btn.className.includes('rounded-full') && btn.className.includes('bg-purple-500')
    );
    expect(playButton).toBeDefined();
    fireEvent.click(playButton!);

    await waitFor(() => {
      expect(mockEnsureResumed).toHaveBeenCalled();
      expect(mockPlayUrl).toHaveBeenCalled();
    });
  });

  it('logs progress when answer is selected', async () => {
    renderWithRouter(<DrillPackPlayer />);
    fireEvent.click(screen.getByText('Begin'));

    await waitFor(() => {
      expect(screen.getByText('1 / 10')).toBeInTheDocument();
    });

    // Click one of the answer buttons (p-8 class = answer buttons)
    const answerButtons = screen.getAllByRole('button').filter(btn =>
      btn.className.includes('p-8') && btn.className.includes('rounded-2xl')
    );
    fireEvent.click(answerButtons[0]);

    await waitFor(() => {
      expect(mockLogProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'phoneme_drill',
          metadata: expect.objectContaining({
            activityType: 'phoneme_drill',
            voiceId: 'sarah',
            packId: 'pack_p_b',
          }),
        })
      );
    });
  });

  it('shows feedback after answering', async () => {
    renderWithRouter(<DrillPackPlayer />);
    fireEvent.click(screen.getByText('Begin'));

    await waitFor(() => {
      expect(screen.getByText('1 / 10')).toBeInTheDocument();
    });

    const answerButtons = screen.getAllByRole('button').filter(btn =>
      btn.className.includes('p-8') && btn.className.includes('rounded-2xl')
    );
    fireEvent.click(answerButtons[0]);

    await waitFor(() => {
      const feedbackText = screen.queryByText('Correct!') || screen.queryByText('Not quite');
      expect(feedbackText).toBeInTheDocument();
    });
  });

  it('shows back link to drill packs', async () => {
    renderWithRouter(<DrillPackPlayer />);
    fireEvent.click(screen.getByText('Begin'));

    await waitFor(() => {
      const backLink = screen.getByText('Back to Drill Packs');
      expect(backLink.closest('a')).toHaveAttribute('href', '/practice/drills');
    });
  });
});
