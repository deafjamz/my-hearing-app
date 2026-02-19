import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithRouter, screen, fireEvent, waitFor } from '@/test/testUtils';
import { EnvironmentalSoundPlayer } from './EnvironmentalSoundPlayer';
import type { EnvironmentalSound } from '@/hooks/useEnvironmentalData';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ category: 'household' }),
    useNavigate: () => vi.fn(),
  };
});

const mockFetchByCategory = vi.fn();
const mockLogProgress = vi.fn();
const mockEnsureResumed = vi.fn().mockResolvedValue(undefined);
const mockPlayUrl = vi.fn().mockResolvedValue(undefined);
const mockStopPlayback = vi.fn();
const mockAdvancePlan = vi.fn();

const makeSound = (i: number): EnvironmentalSound => ({
  id: `sound_${i}`,
  name: `Doorbell ${i}`,
  description: `A doorbell ringing, variant ${i}`,
  correctAnswer: `doorbell${i}`,
  category: 'household',
  intensity: 'moderate',
  difficulty: 2,
  tier: 'free',
  foils: [`phone${i}`, `alarm${i}`, `timer${i}`],
  acousticSimilarity: 'tonal',
  safetyCritical: false,
  audioUrl: `https://audio.test/sound_${i}.mp3`,
});

const mockSounds: EnvironmentalSound[] = Array.from({ length: 15 }, (_, i) => makeSound(i));

vi.mock('@/hooks/useEnvironmentalData', () => ({
  useEnvironmentalData: vi.fn(() => ({
    sounds: mockSounds,
    categories: [],
    loading: false,
    error: null,
    fetchByCategory: mockFetchByCategory,
    fetchAll: vi.fn(),
    fetchSafetyCritical: vi.fn(),
    getRandomSound: vi.fn(() => null),
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

vi.mock('@/hooks/useTodaysPlan', () => ({
  useTodaysPlan: () => ({
    nextActivity: null,
    advancePlan: mockAdvancePlan,
    isInPlan: false,
  }),
}));

vi.mock('@/lib/haptics', () => ({
  hapticSelection: vi.fn(),
  hapticSuccess: vi.fn(),
  hapticFailure: vi.fn(),
}));

describe('EnvironmentalSoundPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders activity briefing before starting', () => {
    renderWithRouter(<EnvironmentalSoundPlayer />);
    expect(screen.getByText('Household')).toBeInTheDocument();
    expect(screen.getByText(/10 sounds/)).toBeInTheDocument();
  });

  it('shows trial interface after clicking start', async () => {
    renderWithRouter(<EnvironmentalSoundPlayer />);
    fireEvent.click(screen.getByText('Begin'));

    await waitFor(() => {
      expect(screen.getByText('1 / 10')).toBeInTheDocument();
    });
  });

  it('fetches category data on mount', () => {
    renderWithRouter(<EnvironmentalSoundPlayer />);
    expect(mockFetchByCategory).toHaveBeenCalledWith('household');
  });

  it('shows multiple answer buttons during trial', async () => {
    renderWithRouter(<EnvironmentalSoundPlayer />);
    fireEvent.click(screen.getByText('Begin'));

    await waitFor(() => {
      // 4 choices: correctAnswer + 3 foils
      const buttons = screen.getAllByRole('button').filter(btn =>
        btn.className.includes('p-6') && btn.className.includes('rounded-2xl')
      );
      expect(buttons).toHaveLength(4);
    });
  });

  it('shows progress bar during trial', async () => {
    renderWithRouter(<EnvironmentalSoundPlayer />);
    fireEvent.click(screen.getByText('Begin'));

    await waitFor(() => {
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('1 / 10')).toBeInTheDocument();
    });
  });

  it('plays audio when play button clicked', async () => {
    renderWithRouter(<EnvironmentalSoundPlayer />);
    fireEvent.click(screen.getByText('Begin'));

    await waitFor(() => {
      expect(screen.getByText('1 / 10')).toBeInTheDocument();
    });

    const playButton = screen.getAllByRole('button').find(btn =>
      btn.className.includes('rounded-full') && btn.className.includes('bg-green-500')
    );
    expect(playButton).toBeDefined();
    fireEvent.click(playButton!);

    await waitFor(() => {
      expect(mockEnsureResumed).toHaveBeenCalled();
      expect(mockPlayUrl).toHaveBeenCalled();
    });
  });

  it('logs progress when answer is selected', async () => {
    renderWithRouter(<EnvironmentalSoundPlayer />);
    fireEvent.click(screen.getByText('Begin'));

    await waitFor(() => {
      expect(screen.getByText('1 / 10')).toBeInTheDocument();
    });

    const answerButtons = screen.getAllByRole('button').filter(btn =>
      btn.className.includes('p-6') && btn.className.includes('rounded-2xl')
    );
    fireEvent.click(answerButtons[0]);

    await waitFor(() => {
      expect(mockLogProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'environmental',
          metadata: expect.objectContaining({
            activityType: 'environmental_sound',
            category: 'household',
          }),
        })
      );
    });
  });

  it('shows feedback after answering', async () => {
    renderWithRouter(<EnvironmentalSoundPlayer />);
    fireEvent.click(screen.getByText('Begin'));

    await waitFor(() => {
      expect(screen.getByText('1 / 10')).toBeInTheDocument();
    });

    const answerButtons = screen.getAllByRole('button').filter(btn =>
      btn.className.includes('p-6') && btn.className.includes('rounded-2xl')
    );
    fireEvent.click(answerButtons[0]);

    await waitFor(() => {
      const feedbackText = screen.queryByText('Correct!') || screen.queryByText('Not quite');
      expect(feedbackText).toBeInTheDocument();
    });
  });

  it('shows back link to sound categories', async () => {
    renderWithRouter(<EnvironmentalSoundPlayer />);
    fireEvent.click(screen.getByText('Begin'));

    await waitFor(() => {
      const backLink = screen.getByText('Back to Sound Categories');
      expect(backLink.closest('a')).toHaveAttribute('href', '/practice/sounds');
    });
  });
});
