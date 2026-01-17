/**
 * @vitest-environment happy-dom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { ThemeDropdown } from '../ThemeDropdown';
import type { Theme } from '@/types';

// Mock themes data
const mockThemes: Theme[] = [
  { id: '1', slug: 'traditional', name: '传统风格', icon: '🎎', color: '#E91E63' },
  { id: '2', slug: 'modern', name: '现代时尚', icon: '✨', color: '#2196F3' },
  { id: '3', slug: 'romantic', name: '浪漫约会', icon: '💕', color: '#FF5722' },
];

describe('ThemeDropdown', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    mockOnChange = vi.fn();
    originalFetch = global.fetch;
    // Default mock: successful fetch with themes
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ themes: mockThemes }),
    });
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with placeholder text when no theme is selected', async () => {
      render(<ThemeDropdown value={null} onChange={mockOnChange} />);

      // Wait for fetch to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/themes');
      });

      expect(screen.getByText('主题')).toBeInTheDocument();
      expect(screen.getByText('选择主题')).toBeInTheDocument();
    });

    it('renders selected theme with name and icon', async () => {
      const selectedTheme = mockThemes[0];
      render(<ThemeDropdown value={selectedTheme} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      expect(screen.getByText(selectedTheme.name)).toBeInTheDocument();
      expect(screen.getByText(selectedTheme.icon!)).toBeInTheDocument();
    });

    it('shows clear button when a theme is selected', async () => {
      const selectedTheme = mockThemes[0];
      render(<ThemeDropdown value={selectedTheme} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const clearButton = screen.getByRole('button', { name: '清空主题' });
      expect(clearButton).toBeInTheDocument();
    });

    it('does not show clear button when no theme is selected', async () => {
      render(<ThemeDropdown value={null} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      expect(screen.queryByRole('button', { name: '清空主题' })).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading state while fetching themes', async () => {
      // Create a promise that doesn't resolve immediately
      let resolvePromise: (value: { themes: Theme[] }) => void;
      const fetchPromise = new Promise<{ themes: Theme[] }>((resolve) => {
        resolvePromise = resolve;
      });

      global.fetch = vi.fn().mockResolvedValue({
        json: () => fetchPromise,
      });

      render(<ThemeDropdown value={null} onChange={mockOnChange} />);

      // Open the dropdown
      const trigger = screen.getByText('选择主题');
      fireEvent.click(trigger);

      // Should show loading state
      expect(screen.getByText('加载中...')).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!({ themes: mockThemes });

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no themes are returned', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ themes: [] }),
      });

      render(<ThemeDropdown value={null} onChange={mockOnChange} />);

      // Wait for fetch to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Open the dropdown
      const trigger = screen.getByText('选择主题');
      fireEvent.click(trigger);

      expect(screen.getByText('暂无主题')).toBeInTheDocument();
    });

    it('shows empty state when themes array is undefined', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({}),
      });

      render(<ThemeDropdown value={null} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Open the dropdown
      const trigger = screen.getByText('选择主题');
      fireEvent.click(trigger);

      expect(screen.getByText('暂无主题')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles fetch error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      render(<ThemeDropdown value={null} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch themes:',
          expect.any(Error)
        );
      });

      // Open the dropdown - should show empty state after error
      const trigger = screen.getByText('选择主题');
      fireEvent.click(trigger);

      expect(screen.getByText('暂无主题')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Dropdown Interaction', () => {
    it('opens dropdown when trigger is clicked', async () => {
      render(<ThemeDropdown value={null} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Dropdown should be closed initially
      expect(screen.queryByText(mockThemes[0].name)).not.toBeInTheDocument();

      // Click to open
      const trigger = screen.getByText('选择主题');
      fireEvent.click(trigger);

      // Now themes should be visible
      expect(screen.getByText(mockThemes[0].name)).toBeInTheDocument();
      expect(screen.getByText(mockThemes[1].name)).toBeInTheDocument();
      expect(screen.getByText(mockThemes[2].name)).toBeInTheDocument();
    });

    it('closes dropdown when trigger is clicked again', async () => {
      render(<ThemeDropdown value={null} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Open the dropdown
      const trigger = screen.getByText('选择主题');
      fireEvent.click(trigger);

      // Themes should be visible
      expect(screen.getByText(mockThemes[0].name)).toBeInTheDocument();

      // Click to close
      fireEvent.click(trigger);

      // Themes should no longer be visible
      expect(screen.queryByText(mockThemes[0].name)).not.toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', async () => {
      render(
        <div>
          <div data-testid="outside">Outside element</div>
          <ThemeDropdown value={null} onChange={mockOnChange} />
        </div>
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Open the dropdown
      const trigger = screen.getByText('选择主题');
      fireEvent.click(trigger);

      // Themes should be visible
      expect(screen.getByText(mockThemes[0].name)).toBeInTheDocument();

      // Click outside
      const outside = screen.getByTestId('outside');
      fireEvent.mouseDown(outside);

      // Themes should no longer be visible
      await waitFor(() => {
        expect(screen.queryByText(mockThemes[0].name)).not.toBeInTheDocument();
      });
    });
  });

  describe('Theme Selection', () => {
    it('calls onChange with selected theme when a theme is clicked', async () => {
      render(<ThemeDropdown value={null} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Open the dropdown
      const trigger = screen.getByText('选择主题');
      fireEvent.click(trigger);

      // Click on a theme
      const themeButton = screen.getByRole('button', { name: /传统风格/ });
      fireEvent.click(themeButton);

      expect(mockOnChange).toHaveBeenCalledWith(mockThemes[0]);
    });

    it('closes dropdown after selecting a theme', async () => {
      render(<ThemeDropdown value={null} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Open the dropdown
      const trigger = screen.getByText('选择主题');
      fireEvent.click(trigger);

      // Click on a theme
      const themeButton = screen.getByRole('button', { name: /传统风格/ });
      fireEvent.click(themeButton);

      // Dropdown should be closed
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /现代时尚/ })).not.toBeInTheDocument();
      });
    });

    it('highlights the currently selected theme', async () => {
      const selectedTheme = mockThemes[1];
      render(<ThemeDropdown value={selectedTheme} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Open the dropdown
      const trigger = screen.getByText(selectedTheme.name);
      fireEvent.click(trigger);

      // Selected theme button should have sakura-500 class (selected style)
      const selectedButton = screen.getByRole('button', { name: /现代时尚/ });
      expect(selectedButton).toHaveClass('bg-sakura-500');

      // Other themes should not have selected style
      const unselectedButton = screen.getByRole('button', { name: /传统风格/ });
      expect(unselectedButton).not.toHaveClass('bg-sakura-500');
    });
  });

  describe('Clear Theme', () => {
    it('calls onChange with null when clear button is clicked', async () => {
      const selectedTheme = mockThemes[0];
      render(<ThemeDropdown value={selectedTheme} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Click the clear button
      const clearButton = screen.getByRole('button', { name: '清空主题' });
      fireEvent.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it('does not open dropdown when clearing theme', async () => {
      const selectedTheme = mockThemes[0];
      render(<ThemeDropdown value={selectedTheme} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Click the clear button
      const clearButton = screen.getByRole('button', { name: '清空主题' });
      fireEvent.click(clearButton);

      // Dropdown should still be closed (no theme list visible)
      expect(screen.queryByRole('button', { name: /现代时尚/ })).not.toBeInTheDocument();
    });
  });

  describe('Theme Display', () => {
    it('displays theme icons with default fallback', async () => {
      const themesWithoutIcon: Theme[] = [
        { id: '4', slug: 'no-icon', name: '无图标主题', icon: null, color: null },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ themes: themesWithoutIcon }),
      });

      render(<ThemeDropdown value={null} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Open the dropdown
      const trigger = screen.getByText('选择主题');
      fireEvent.click(trigger);

      // Should show default icon
      expect(screen.getByText('🎨')).toBeInTheDocument();
    });

    it('displays all fetched themes', async () => {
      render(<ThemeDropdown value={null} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Open the dropdown
      const trigger = screen.getByText('选择主题');
      fireEvent.click(trigger);

      // All themes should be rendered
      mockThemes.forEach((theme) => {
        expect(screen.getByText(theme.name)).toBeInTheDocument();
        expect(screen.getByText(theme.icon!)).toBeInTheDocument();
      });
    });
  });

  describe('Fetch Behavior', () => {
    it('fetches themes on component mount', async () => {
      render(<ThemeDropdown value={null} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith('/api/themes');
      });
    });

    it('only fetches themes once on mount', async () => {
      const { rerender } = render(<ThemeDropdown value={null} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Rerender with different props
      rerender(<ThemeDropdown value={mockThemes[0]} onChange={mockOnChange} />);

      // Should still only have one fetch call
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
