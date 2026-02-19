import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithRouter, screen } from '@/test/testUtils';
import { DrillPackList } from './DrillPackList';

// Mock useDrillPackData
const mockPacks = [
  {
    drill_pack_id: 'pack_p_b',
    pack_name: 'P vs B',
    contrast_type: 'Voicing',
    target_phoneme: '/p/',
    contrast_phoneme: '/b/',
    total_pairs: 15,
    min_difficulty: 1,
    max_difficulty: 3,
    tier: 'free',
  },
  {
    drill_pack_id: 'pack_t_d',
    pack_name: 'T vs D',
    contrast_type: 'Voicing',
    target_phoneme: '/t/',
    contrast_phoneme: '/d/',
    total_pairs: 12,
    min_difficulty: 1,
    max_difficulty: 2,
    tier: 'free',
  },
];

vi.mock('@/hooks/useDrillPackData', () => ({
  useDrillPackData: vi.fn(() => ({
    packs: mockPacks,
    loading: false,
    error: null,
    drillPairs: [],
    fetchByPack: vi.fn(),
    fetchAll: vi.fn(),
    getRandomPair: vi.fn(),
    getPackProgress: vi.fn(() => ({ total: 0, completed: 0 })),
    getAudioUrl: vi.fn(),
  })),
}));

// Must import after mock setup so we can override
import { useDrillPackData } from '@/hooks/useDrillPackData';

describe('DrillPackList', () => {
  beforeEach(() => {
    vi.mocked(useDrillPackData).mockReturnValue({
      packs: mockPacks,
      loading: false,
      error: null,
      drillPairs: [],
      fetchByPack: vi.fn(),
      fetchAll: vi.fn(),
      getRandomPair: vi.fn(() => null),
      getPackProgress: vi.fn(() => ({ total: 0, completed: 0 })),
      getAudioUrl: vi.fn(() => ''),
    });
  });

  it('renders pack cards with names', () => {
    renderWithRouter(<DrillPackList />);
    expect(screen.getByText('P vs B')).toBeInTheDocument();
    expect(screen.getByText('T vs D')).toBeInTheDocument();
  });

  it('renders phoneme contrast labels', () => {
    renderWithRouter(<DrillPackList />);
    expect(screen.getByText('/p/ vs /b/')).toBeInTheDocument();
    expect(screen.getByText('/t/ vs /d/')).toBeInTheDocument();
  });

  it('renders pair counts', () => {
    renderWithRouter(<DrillPackList />);
    expect(screen.getByText('15 pairs')).toBeInTheDocument();
    expect(screen.getByText('12 pairs')).toBeInTheDocument();
  });

  it('renders links to correct pack player routes', () => {
    renderWithRouter(<DrillPackList />);
    const links = screen.getAllByRole('link');
    const packLinks = links.filter(link =>
      link.getAttribute('href')?.startsWith('/practice/drills/')
    );
    expect(packLinks).toHaveLength(2);
    expect(packLinks[0]).toHaveAttribute('href', '/practice/drills/pack_p_b');
    expect(packLinks[1]).toHaveAttribute('href', '/practice/drills/pack_t_d');
  });

  it('shows loading spinner when loading', () => {
    vi.mocked(useDrillPackData).mockReturnValue({
      packs: [],
      loading: true,
      error: null,
      drillPairs: [],
      fetchByPack: vi.fn(),
      fetchAll: vi.fn(),
      getRandomPair: vi.fn(() => null),
      getPackProgress: vi.fn(() => ({ total: 0, completed: 0 })),
      getAudioUrl: vi.fn(() => ''),
    });
    renderWithRouter(<DrillPackList />);
    expect(screen.getByText('Loading drill packs...')).toBeInTheDocument();
  });

  it('shows empty state when no packs', () => {
    vi.mocked(useDrillPackData).mockReturnValue({
      packs: [],
      loading: false,
      error: null,
      drillPairs: [],
      fetchByPack: vi.fn(),
      fetchAll: vi.fn(),
      getRandomPair: vi.fn(() => null),
      getPackProgress: vi.fn(() => ({ total: 0, completed: 0 })),
      getAudioUrl: vi.fn(() => ''),
    });
    renderWithRouter(<DrillPackList />);
    expect(screen.getByText('No drill packs found')).toBeInTheDocument();
  });

  it('renders page title', () => {
    renderWithRouter(<DrillPackList />);
    expect(screen.getByText('Phoneme Drills')).toBeInTheDocument();
  });

  it('renders back link to practice hub', () => {
    renderWithRouter(<DrillPackList />);
    const backLink = screen.getByText('Back to Practice Hub');
    expect(backLink.closest('a')).toHaveAttribute('href', '/practice');
  });
});
