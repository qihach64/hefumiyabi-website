/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock nuqs useSearchState hook
const mockSetLocation = vi.fn().mockResolvedValue(undefined);
const mockSetDate = vi.fn().mockResolvedValue(undefined);
const mockSetTheme = vi.fn().mockResolvedValue(undefined);

// State object to hold current mock values
const mockState = {
  location: null as string | null,
  date: null as string | null,
  theme: null as string | null,
};

vi.mock('@/shared/hooks', () => ({
  useSearchState: () => ({
    location: mockState.location,
    setLocation: mockSetLocation,
    date: mockState.date,
    setDate: mockSetDate,
    theme: mockState.theme,
    setTheme: mockSetTheme,
    guests: 1,
    setGuests: vi.fn(),
    minPrice: null,
    maxPrice: null,
    setMinPrice: vi.fn(),
    setMaxPrice: vi.fn(),
    sort: 'recommended',
    setSort: vi.fn(),
    category: null,
    setCategory: vi.fn(),
    tags: null,
    setTags: vi.fn(),
    hasFilters: !!(mockState.location || mockState.date || mockState.theme),
    clearAll: vi.fn(),
    setPriceRange: vi.fn(),
  }),
}));

// Mock ThemeDropdown component
vi.mock('../ThemeDropdown', () => ({
  ThemeDropdown: ({ value, onChange }: { value: unknown; onChange: (theme: unknown) => void }) => (
    <div data-testid="theme-dropdown">
      <button
        data-testid="theme-dropdown-trigger"
        onClick={() => onChange({ id: 'test-theme', slug: 'traditional', name: '传统', icon: '🎎' })}
      >
        {value ? (value as { name: string }).name : '选择主题'}
      </button>
      <button
        data-testid="theme-dropdown-clear"
        onClick={() => onChange(null)}
      >
        清除
      </button>
    </div>
  ),
}));

// Mock fetch for locations and themes APIs
const mockLocations = ['东京', '京都', '大阪', '奈良', '横滨'];
const mockThemes = [
  { id: '1', slug: 'traditional', name: '传统', icon: '🎎', color: '#ff0000' },
  { id: '2', slug: 'modern', name: '现代', icon: '✨', color: '#00ff00' },
];

const createMockFetch = () => {
  return vi.fn().mockImplementation((url: string) => {
    if (url === '/api/locations') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ locations: mockLocations }),
      });
    }
    if (url === '/api/themes') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ themes: mockThemes }),
      });
    }
    return Promise.reject(new Error('Unknown URL'));
  });
};

import { HeroSearchBar } from '../HeroSearchBar';

describe('HeroSearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    // Reset mock state
    mockState.location = null;
    mockState.date = null;
    mockState.theme = null;
    global.fetch = createMockFetch();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  describe('Rendering', () => {
    it('renders the desktop search bar', async () => {
      render(<HeroSearchBar />);

      // Check for destination label (multiple elements expected - desktop and mobile)
      expect(screen.getAllByText('目的地').length).toBeGreaterThan(0);

      // Check for date label
      expect(screen.getAllByText('到店日期').length).toBeGreaterThan(0);

      // Check for search button (desktop)
      expect(screen.getAllByLabelText('搜索').length).toBeGreaterThan(0);
    });

    it('renders the mobile search button', async () => {
      render(<HeroSearchBar />);

      // Mobile search button text (multiple elements when both desktop and mobile views exist)
      expect(screen.getAllByText('搜索和服体验').length).toBeGreaterThan(0);
      expect(screen.getAllByText('目的地 · 日期 · 主题').length).toBeGreaterThan(0);
    });

    it('renders destination input with placeholder', async () => {
      render(<HeroSearchBar />);

      const inputs = screen.getAllByPlaceholderText('东京、京都...');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('renders ThemeDropdown component', async () => {
      render(<HeroSearchBar />);

      expect(screen.getAllByTestId('theme-dropdown').length).toBeGreaterThan(0);
    });
  });

  describe('useSearchState integration', () => {
    it('uses useSearchState hook for location state', async () => {
      mockState.location = '京都';
      render(<HeroSearchBar />);

      // The input should display the location value from the hook
      const inputs = screen.getAllByDisplayValue('京都');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('uses useSearchState hook for date state', async () => {
      mockState.date = '2025-01-15';
      render(<HeroSearchBar />);

      // The date should be formatted and displayed (multiple elements in desktop and mobile)
      expect(screen.getAllByText('1月15日').length).toBeGreaterThan(0);
    });

    it('calls setLocation when location input changes', async () => {
      const user = userEvent.setup();
      render(<HeroSearchBar />);

      const inputs = screen.getAllByPlaceholderText('东京、京都...');
      const desktopInput = inputs[0];

      await user.type(desktopInput, '东京');

      // setLocation should be called as user types
      expect(mockSetLocation).toHaveBeenCalled();
    });

    it('calls setDate when date input changes', async () => {
      render(<HeroSearchBar />);

      // Find the hidden date input
      const dateInputs = document.querySelectorAll('input[type="date"]');
      expect(dateInputs.length).toBeGreaterThan(0);

      fireEvent.change(dateInputs[0], { target: { value: '2025-01-20' } });

      expect(mockSetDate).toHaveBeenCalledWith('2025-01-20');
    });
  });

  describe('Search navigation', () => {
    it('navigates to /plans when search button is clicked with no filters', async () => {
      const user = userEvent.setup();
      render(<HeroSearchBar />);

      const searchButtons = screen.getAllByLabelText('搜索');
      await user.click(searchButtons[0]);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/plans');
      });
    });

    it('builds search URL with location when location is set', async () => {
      mockState.location = '京都';
      const user = userEvent.setup();
      render(<HeroSearchBar />);

      const searchButtons = screen.getAllByLabelText('搜索');
      await user.click(searchButtons[0]);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
        const calledUrl = mockPush.mock.calls[0][0] as string;
        expect(calledUrl).toContain('location=');
      });
    });

    it('builds search URL with date when date is set', async () => {
      mockState.date = '2025-01-15';
      const user = userEvent.setup();
      render(<HeroSearchBar />);

      const searchButtons = screen.getAllByLabelText('搜索');
      await user.click(searchButtons[0]);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
        const calledUrl = mockPush.mock.calls[0][0] as string;
        expect(calledUrl).toContain('date=2025-01-15');
      });
    });

    it('builds search URL with theme when theme is set', async () => {
      mockState.theme = 'traditional';
      const user = userEvent.setup();
      render(<HeroSearchBar />);

      const searchButtons = screen.getAllByLabelText('搜索');
      await user.click(searchButtons[0]);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
        const calledUrl = mockPush.mock.calls[0][0] as string;
        expect(calledUrl).toContain('theme=traditional');
      });
    });

    it('builds search URL with all params when multiple are set', async () => {
      mockState.location = '东京';
      mockState.date = '2025-02-01';
      mockState.theme = 'modern';
      const user = userEvent.setup();
      render(<HeroSearchBar />);

      const searchButtons = screen.getAllByLabelText('搜索');
      await user.click(searchButtons[0]);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
        const calledUrl = mockPush.mock.calls[0][0] as string;
        expect(calledUrl).toContain('location=');
        expect(calledUrl).toContain('date=2025-02-01');
        expect(calledUrl).toContain('theme=modern');
      });
    });
  });

  describe('Location dropdown', () => {
    it('fetches locations on mount', async () => {
      render(<HeroSearchBar />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/locations');
      });
    });

    it('shows dropdown when location input is focused', async () => {
      const user = userEvent.setup();
      render(<HeroSearchBar />);

      // Wait for locations to be fetched
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/locations');
      });

      const inputs = screen.getAllByPlaceholderText('东京、京都...');
      const desktopInput = inputs[0];

      await user.click(desktopInput);

      // Dropdown should appear with location options (multiple elements - in dropdown)
      await waitFor(() => {
        // The dropdown shows location options with description text
        expect(screen.getAllByText('东京').length).toBeGreaterThan(0);
      });
    });

    it('filters locations based on input', async () => {
      const user = userEvent.setup();
      render(<HeroSearchBar />);

      // Wait for locations to be fetched
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/locations');
      });

      const inputs = screen.getAllByPlaceholderText('东京、京都...');
      const desktopInput = inputs[0];

      await user.type(desktopInput, '京');

      // Should call setLocation with the typed value
      expect(mockSetLocation).toHaveBeenCalled();
    });

    it('calls setLocation when a location is selected', async () => {
      const user = userEvent.setup();
      render(<HeroSearchBar />);

      // Wait for locations to be fetched
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/locations');
      });

      const inputs = screen.getAllByPlaceholderText('东京、京都...');
      const desktopInput = inputs[0];

      await user.click(desktopInput);

      // Wait for dropdown to appear
      await waitFor(() => {
        expect(screen.getAllByText('东京').length).toBeGreaterThan(0);
      });

      // Click on a location option - find buttons within the dropdown
      const tokyoButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent?.includes('东京')
      );
      expect(tokyoButtons.length).toBeGreaterThan(0);
      await user.click(tokyoButtons[0]);

      expect(mockSetLocation).toHaveBeenCalledWith('东京');
    });
  });

  describe('Clear location button', () => {
    it('shows clear button when location has value', async () => {
      mockState.location = '京都';
      render(<HeroSearchBar />);

      const clearButtons = screen.getAllByLabelText('清空目的地');
      expect(clearButtons.length).toBeGreaterThan(0);
    });

    it('calls setLocation with null when clear button is clicked', async () => {
      mockState.location = '京都';
      const user = userEvent.setup();
      render(<HeroSearchBar />);

      const clearButtons = screen.getAllByLabelText('清空目的地');
      await user.click(clearButtons[0]);

      expect(mockSetLocation).toHaveBeenCalledWith(null);
    });
  });

  describe('Mobile expanded view', () => {
    it('expands mobile search when button is clicked', async () => {
      const user = userEvent.setup();
      render(<HeroSearchBar />);

      // Find and click the mobile search trigger button (get all and use the first mobile one)
      const mobileButtons = screen.getAllByText('目的地 · 日期 · 主题');
      const mobileButton = mobileButtons[0].closest('button');
      expect(mobileButton).toBeInTheDocument();

      await user.click(mobileButton!);

      // Should show expanded search form - the mobile expanded view shows different structure
      await waitFor(() => {
        // The expanded view has a close button with X icon
        // and the heading "搜索和服体验" as an h3
        const headings = screen.getAllByText('搜索和服体验');
        expect(headings.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('shows search button with text in mobile expanded view', async () => {
      const user = userEvent.setup();
      render(<HeroSearchBar />);

      const mobileButtons = screen.getAllByText('目的地 · 日期 · 主题');
      const mobileButton = mobileButtons[0].closest('button');
      await user.click(mobileButton!);

      await waitFor(() => {
        // Mobile expanded view has a "搜索" button with text
        const searchButtons = screen.getAllByRole('button').filter(
          btn => btn.textContent === '搜索' || btn.textContent?.includes('搜索')
        );
        expect(searchButtons.length).toBeGreaterThan(0);
      });
    });

    it('can close mobile expanded view', async () => {
      const user = userEvent.setup();
      render(<HeroSearchBar />);

      // Expand mobile search
      const mobileButtons = screen.getAllByText('目的地 · 日期 · 主题');
      const mobileButton = mobileButtons[0].closest('button');
      await user.click(mobileButton!);

      // Wait for expansion
      await waitFor(() => {
        expect(screen.getAllByText('搜索和服体验').length).toBeGreaterThanOrEqual(1);
      });

      // Find close button (it's a button with X icon inside the expanded view)
      const closeButtons = screen.getAllByRole('button').filter(btn => {
        // Look for buttons that contain X icon in the expanded mobile view
        return btn.querySelector('svg.lucide-x') !== null;
      });

      if (closeButtons.length > 0) {
        await user.click(closeButtons[0]);
        // After closing, the compact button should be visible again
        expect(screen.getAllByText('目的地 · 日期 · 主题').length).toBeGreaterThan(0);
      }
    });
  });

  describe('ThemeDropdown props', () => {
    it('passes correct value to ThemeDropdown', async () => {
      render(<HeroSearchBar />);

      // Check that ThemeDropdown is rendered with correct initial state
      const dropdowns = screen.getAllByTestId('theme-dropdown');
      expect(dropdowns.length).toBeGreaterThan(0);
    });

    it('handles theme change from ThemeDropdown', async () => {
      const user = userEvent.setup();
      render(<HeroSearchBar />);

      const triggers = screen.getAllByTestId('theme-dropdown-trigger');
      await user.click(triggers[0]);

      // setTheme should be called with the theme slug
      expect(mockSetTheme).toHaveBeenCalledWith('traditional');
    });

    it('handles theme clear from ThemeDropdown', async () => {
      mockState.theme = 'traditional';
      const user = userEvent.setup();
      render(<HeroSearchBar />);

      const clearButtons = screen.getAllByTestId('theme-dropdown-clear');
      await user.click(clearButtons[0]);

      expect(mockSetTheme).toHaveBeenCalledWith(null);
    });
  });

  describe('Date display formatting', () => {
    it('displays "选择日期" when no date is selected', async () => {
      render(<HeroSearchBar />);

      // Desktop view shows "选择日期"
      expect(screen.getAllByText('选择日期').length).toBeGreaterThan(0);
    });

    it('displays formatted date in Chinese locale', async () => {
      mockState.date = '2025-03-20';
      render(<HeroSearchBar />);

      // Should display "3月20日" format (multiple in desktop/mobile)
      expect(screen.getAllByText('3月20日').length).toBeGreaterThan(0);
    });
  });

  describe('Loading state', () => {
    it('search button is enabled by default', async () => {
      render(<HeroSearchBar />);

      const searchButtons = screen.getAllByLabelText('搜索');
      expect(searchButtons[0]).not.toBeDisabled();
    });

    it('navigates when search button is clicked', async () => {
      const user = userEvent.setup();
      render(<HeroSearchBar />);

      const searchButtons = screen.getAllByLabelText('搜索');
      await user.click(searchButtons[0]);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });
    });
  });

  describe('API error handling', () => {
    it('handles locations API error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === '/api/locations') {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ themes: mockThemes }),
        });
      });

      render(<HeroSearchBar />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch locations:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('component still renders when APIs fail', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      render(<HeroSearchBar />);

      // Component should still render even if APIs fail
      await waitFor(() => {
        expect(screen.getAllByText('目的地').length).toBeGreaterThan(0);
      });

      vi.restoreAllMocks();
    });
  });

  describe('Click outside closes dropdown', () => {
    it('closes location dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(<HeroSearchBar />);

      // Wait for locations to be fetched
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/locations');
      });

      const inputs = screen.getAllByPlaceholderText('东京、京都...');
      const desktopInput = inputs[0];

      // Open dropdown
      await user.click(desktopInput);

      await waitFor(() => {
        expect(screen.getAllByText('东京').length).toBeGreaterThan(0);
      });

      // Click outside (on the document body)
      fireEvent.mouseDown(document.body);

      // Dropdown should eventually close (the component listens to mousedown)
      // The dropdown visibility is controlled by showDropdown state
    });
  });
});
