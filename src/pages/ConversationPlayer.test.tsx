import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithRouter, screen, fireEvent, waitFor } from '@/test/testUtils';
import { ConversationPlayer } from './ConversationPlayer';
import type { ConversationPair } from '@/hooks/useConversationData';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ category: 'appointments' }),
    useNavigate: () => vi.fn(),
  };
});

const mockFetchByCategory = vi.fn();
const mockLogProgress = vi.fn();
const mockEnsureResumed = vi.fn().mockResolvedValue(undefined);
const mockPlayUrl = vi.fn().mockResolvedValue(undefined);
const mockStopPlayback = vi.fn();
const mockAdvancePlan = vi.fn();

const makeConversation = (i: number): ConversationPair => ({
  id: `conv_${i}`,
  promptText: `Could you schedule an appointment for ${i}?`,
  responseText: `Sure, how about next week?`,
  targetKeyword: `appointment${i}`,
  targetPhoneme: null,
  category: 'appointments',
  difficulty: 2,
  tier: 'free',
  acousticFoil: `arrangement${i}`,
  semanticFoil: `meeting${i}`,
  plausibleFoil: `schedule${i}`,
  promptAudioUrl: `https://audio.test/conv_${i}_prompt.mp3`,
  responseAudioUrl: `https://audio.test/conv_${i}_response.mp3`,
});

const mockConversations: ConversationPair[] = Array.from({ length: 15 }, (_, i) => makeConversation(i));

vi.mock('@/hooks/useConversationData', () => ({
  useConversationData: vi.fn(() => ({
    conversations: mockConversations,
    categories: [],
    loading: false,
    error: null,
    fetchByCategory: mockFetchByCategory,
    fetchAll: vi.fn(),
    getRandomPair: vi.fn(() => null),
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

describe('ConversationPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders activity briefing before starting', () => {
    renderWithRouter(<ConversationPlayer />);
    expect(screen.getByText('Appointments')).toBeInTheDocument();
    expect(screen.getByText(/10 items/)).toBeInTheDocument();
  });

  it('shows trial interface after clicking start', async () => {
    renderWithRouter(<ConversationPlayer />);
    fireEvent.click(screen.getByText('Begin'));

    await waitFor(() => {
      expect(screen.getByText('1 / 10')).toBeInTheDocument();
    });
  });

  it('fetches category data on mount', () => {
    renderWithRouter(<ConversationPlayer />);
    expect(mockFetchByCategory).toHaveBeenCalledWith('appointments');
  });

  it('shows four answer buttons during trial', async () => {
    renderWithRouter(<ConversationPlayer />);
    fireEvent.click(screen.getByText('Begin'));

    await waitFor(() => {
      // Find answer buttons (p-6 class = conversation answer buttons)
      const buttons = screen.getAllByRole('button').filter(btn =>
        btn.className.includes('p-6') && btn.className.includes('rounded-2xl')
      );
      expect(buttons).toHaveLength(4);
    });
  });

  it('shows progress bar during trial', async () => {
    renderWithRouter(<ConversationPlayer />);
    fireEvent.click(screen.getByText('Begin'));

    await waitFor(() => {
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('1 / 10')).toBeInTheDocument();
    });
  });

  it('plays audio when play button clicked', async () => {
    renderWithRouter(<ConversationPlayer />);
    fireEvent.click(screen.getByText('Begin'));

    await waitFor(() => {
      expect(screen.getByText('1 / 10')).toBeInTheDocument();
    });

    const playButton = screen.getAllByRole('button').find(btn =>
      btn.className.includes('rounded-full') && btn.className.includes('bg-pink-500')
    );
    expect(playButton).toBeDefined();
    fireEvent.click(playButton!);

    await waitFor(() => {
      expect(mockEnsureResumed).toHaveBeenCalled();
      expect(mockPlayUrl).toHaveBeenCalled();
    });
  });

  it('logs progress when answer is selected', async () => {
    renderWithRouter(<ConversationPlayer />);
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
          contentType: 'conversation',
          metadata: expect.objectContaining({
            activityType: 'conversation',
            voiceId: 'sarah',
            category: 'appointments',
          }),
        })
      );
    });
  });

  it('shows feedback after answering', async () => {
    renderWithRouter(<ConversationPlayer />);
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

  it('shows prompt text context during trial', async () => {
    renderWithRouter(<ConversationPlayer />);
    fireEvent.click(screen.getByText('Begin'));

    await waitFor(() => {
      // Should display the conversation prompt text
      const promptTexts = screen.getAllByText(/Could you schedule/);
      expect(promptTexts.length).toBeGreaterThan(0);
    });
  });

  it('shows back link to conversations', async () => {
    renderWithRouter(<ConversationPlayer />);
    fireEvent.click(screen.getByText('Begin'));

    await waitFor(() => {
      const backLink = screen.getByText('Back to Conversations');
      expect(backLink.closest('a')).toHaveAttribute('href', '/practice/conversations');
    });
  });
});
