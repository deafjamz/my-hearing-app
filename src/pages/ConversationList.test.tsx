import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithRouter, screen } from '@/test/testUtils';
import { ConversationList } from './ConversationList';

const mockCategories = [
  {
    category: 'appointments',
    total_conversations: 10,
    min_difficulty: 2,
    max_difficulty: 3,
  },
  {
    category: 'directions',
    total_conversations: 8,
    min_difficulty: 1,
    max_difficulty: 3,
  },
];

vi.mock('@/hooks/useConversationData', () => ({
  useConversationData: vi.fn(() => ({
    categories: mockCategories,
    conversations: [],
    loading: false,
    error: null,
    fetchByCategory: vi.fn(),
    fetchAll: vi.fn(),
    getRandomPair: vi.fn(() => null),
    getAudioUrl: vi.fn(() => ''),
  })),
}));

import { useConversationData } from '@/hooks/useConversationData';

describe('ConversationList', () => {
  beforeEach(() => {
    vi.mocked(useConversationData).mockReturnValue({
      categories: mockCategories,
      conversations: [],
      loading: false,
      error: null,
      fetchByCategory: vi.fn(),
      fetchAll: vi.fn(),
      getRandomPair: vi.fn(() => null),
      getAudioUrl: vi.fn(() => ''),
    });
  });

  it('renders category cards with names', () => {
    renderWithRouter(<ConversationList />);
    expect(screen.getByText('appointments')).toBeInTheDocument();
    expect(screen.getByText('directions')).toBeInTheDocument();
  });

  it('renders conversation counts', () => {
    renderWithRouter(<ConversationList />);
    expect(screen.getByText('10 conversations')).toBeInTheDocument();
    expect(screen.getByText('8 conversations')).toBeInTheDocument();
  });

  it('renders links to correct player routes', () => {
    renderWithRouter(<ConversationList />);
    const links = screen.getAllByRole('link');
    const categoryLinks = links.filter(link =>
      link.getAttribute('href')?.startsWith('/player/conversation/')
    );
    expect(categoryLinks).toHaveLength(2);
    expect(categoryLinks[0]).toHaveAttribute('href', '/player/conversation/appointments');
    expect(categoryLinks[1]).toHaveAttribute('href', '/player/conversation/directions');
  });

  it('shows loading spinner when loading', () => {
    vi.mocked(useConversationData).mockReturnValue({
      categories: [],
      conversations: [],
      loading: true,
      error: null,
      fetchByCategory: vi.fn(),
      fetchAll: vi.fn(),
      getRandomPair: vi.fn(() => null),
      getAudioUrl: vi.fn(() => ''),
    });
    renderWithRouter(<ConversationList />);
    expect(screen.getByText('Loading conversations...')).toBeInTheDocument();
  });

  it('shows empty state when no categories', () => {
    vi.mocked(useConversationData).mockReturnValue({
      categories: [],
      conversations: [],
      loading: false,
      error: null,
      fetchByCategory: vi.fn(),
      fetchAll: vi.fn(),
      getRandomPair: vi.fn(() => null),
      getAudioUrl: vi.fn(() => ''),
    });
    renderWithRouter(<ConversationList />);
    expect(screen.getByText('No conversation categories found')).toBeInTheDocument();
  });

  it('renders page title', () => {
    renderWithRouter(<ConversationList />);
    expect(screen.getByText('Conversations')).toBeInTheDocument();
  });

  it('renders back link to practice hub', () => {
    renderWithRouter(<ConversationList />);
    const backLink = screen.getByText('Back to Practice Hub');
    expect(backLink.closest('a')).toHaveAttribute('href', '/practice');
  });
});
