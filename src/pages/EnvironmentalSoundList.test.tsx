import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithRouter, screen } from '@/test/testUtils';
import { EnvironmentalSoundList } from './EnvironmentalSoundList';

const mockCategories = [
  {
    category: 'household',
    total_sounds: 12,
    min_difficulty: 1,
    max_difficulty: 3,
    has_safety_critical: false,
  },
  {
    category: 'traffic',
    total_sounds: 8,
    min_difficulty: 2,
    max_difficulty: 4,
    has_safety_critical: true,
  },
];

vi.mock('@/hooks/useEnvironmentalData', () => ({
  useEnvironmentalData: vi.fn(() => ({
    categories: mockCategories,
    sounds: [],
    loading: false,
    error: null,
    fetchByCategory: vi.fn(),
    fetchAll: vi.fn(),
    fetchSafetyCritical: vi.fn(),
    getRandomSound: vi.fn(() => null),
    getAudioUrl: vi.fn(() => ''),
  })),
}));

import { useEnvironmentalData } from '@/hooks/useEnvironmentalData';

describe('EnvironmentalSoundList', () => {
  beforeEach(() => {
    vi.mocked(useEnvironmentalData).mockReturnValue({
      categories: mockCategories,
      sounds: [],
      loading: false,
      error: null,
      fetchByCategory: vi.fn(),
      fetchAll: vi.fn(),
      fetchSafetyCritical: vi.fn(),
      getRandomSound: vi.fn(() => null),
      getAudioUrl: vi.fn(() => ''),
    });
  });

  it('renders category cards with names', () => {
    renderWithRouter(<EnvironmentalSoundList />);
    expect(screen.getByText('household')).toBeInTheDocument();
    expect(screen.getByText('traffic')).toBeInTheDocument();
  });

  it('renders sound counts', () => {
    renderWithRouter(<EnvironmentalSoundList />);
    expect(screen.getByText('12 sounds')).toBeInTheDocument();
    expect(screen.getByText('8 sounds')).toBeInTheDocument();
  });

  it('shows safety badge for safety-critical categories', () => {
    renderWithRouter(<EnvironmentalSoundList />);
    const safetyBadges = screen.getAllByText('Safety');
    expect(safetyBadges).toHaveLength(1); // Only traffic has safety
  });

  it('sorts safety-critical categories first', () => {
    renderWithRouter(<EnvironmentalSoundList />);
    const links = screen.getAllByRole('link').filter(link =>
      link.getAttribute('href')?.startsWith('/player/sound/')
    );
    // Traffic (safety) should be first
    expect(links[0]).toHaveAttribute('href', '/player/sound/traffic');
    expect(links[1]).toHaveAttribute('href', '/player/sound/household');
  });

  it('renders links to correct player routes', () => {
    renderWithRouter(<EnvironmentalSoundList />);
    const links = screen.getAllByRole('link').filter(link =>
      link.getAttribute('href')?.startsWith('/player/sound/')
    );
    expect(links).toHaveLength(2);
  });

  it('shows loading spinner when loading', () => {
    vi.mocked(useEnvironmentalData).mockReturnValue({
      categories: [],
      sounds: [],
      loading: true,
      error: null,
      fetchByCategory: vi.fn(),
      fetchAll: vi.fn(),
      fetchSafetyCritical: vi.fn(),
      getRandomSound: vi.fn(() => null),
      getAudioUrl: vi.fn(() => ''),
    });
    renderWithRouter(<EnvironmentalSoundList />);
    expect(screen.getByText('Loading sounds...')).toBeInTheDocument();
  });

  it('shows empty state when no categories', () => {
    vi.mocked(useEnvironmentalData).mockReturnValue({
      categories: [],
      sounds: [],
      loading: false,
      error: null,
      fetchByCategory: vi.fn(),
      fetchAll: vi.fn(),
      fetchSafetyCritical: vi.fn(),
      getRandomSound: vi.fn(() => null),
      getAudioUrl: vi.fn(() => ''),
    });
    renderWithRouter(<EnvironmentalSoundList />);
    expect(screen.getByText('No sound categories found')).toBeInTheDocument();
  });

  it('renders page title', () => {
    renderWithRouter(<EnvironmentalSoundList />);
    expect(screen.getByText('Sound Awareness')).toBeInTheDocument();
  });

  it('renders back link to practice hub', () => {
    renderWithRouter(<EnvironmentalSoundList />);
    const backLink = screen.getByText('Back to Practice Hub');
    expect(backLink.closest('a')).toHaveAttribute('href', '/practice');
  });
});
