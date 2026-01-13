/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock nuqs before importing the hook
const mockSetLocation = vi.fn();
const mockSetDate = vi.fn();
const mockSetTheme = vi.fn();
const mockSetGuests = vi.fn();

let mockLocationValue: string | null = null;
let mockDateValue: string | null = null;
let mockThemeValue: string | null = null;
let mockGuestsValue: number = 1;

vi.mock('nuqs', () => ({
  useQueryState: vi.fn((key: string, parser: any) => {
    switch (key) {
      case 'location':
        return [mockLocationValue, mockSetLocation];
      case 'date':
        return [mockDateValue, mockSetDate];
      case 'theme':
        return [mockThemeValue, mockSetTheme];
      case 'guests':
        return [mockGuestsValue, mockSetGuests];
      default:
        return [null, vi.fn()];
    }
  }),
  parseAsString: {},
  parseAsInteger: {
    withDefault: (defaultValue: number) => ({ defaultValue }),
  },
}));

import { useSearchState } from '../useSearchState';

describe('useSearchState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationValue = null;
    mockDateValue = null;
    mockThemeValue = null;
    mockGuestsValue = 1;
  });

  it('returns all state values', () => {
    const { result } = renderHook(() => useSearchState());

    expect(result.current.location).toBe(null);
    expect(result.current.date).toBe(null);
    expect(result.current.theme).toBe(null);
    expect(result.current.guests).toBe(1);
  });

  it('returns all setter functions', () => {
    const { result } = renderHook(() => useSearchState());

    expect(typeof result.current.setLocation).toBe('function');
    expect(typeof result.current.setDate).toBe('function');
    expect(typeof result.current.setTheme).toBe('function');
    expect(typeof result.current.setGuests).toBe('function');
  });

  it('hasFilters is false when no filters are set', () => {
    const { result } = renderHook(() => useSearchState());

    expect(result.current.hasFilters).toBe(false);
  });

  it('hasFilters is true when location is set', () => {
    mockLocationValue = '京都';
    const { result } = renderHook(() => useSearchState());

    expect(result.current.hasFilters).toBe(true);
  });

  it('hasFilters is true when date is set', () => {
    mockDateValue = '2025-01-15';
    const { result } = renderHook(() => useSearchState());

    expect(result.current.hasFilters).toBe(true);
  });

  it('hasFilters is true when theme is set', () => {
    mockThemeValue = 'traditional';
    const { result } = renderHook(() => useSearchState());

    expect(result.current.hasFilters).toBe(true);
  });

  it('hasFilters ignores guests value', () => {
    mockGuestsValue = 5;
    const { result } = renderHook(() => useSearchState());

    // guests doesn't affect hasFilters
    expect(result.current.hasFilters).toBe(false);
  });

  describe('clearAll', () => {
    it('calls all setters with null', () => {
      const { result } = renderHook(() => useSearchState());

      act(() => {
        result.current.clearAll();
      });

      expect(mockSetLocation).toHaveBeenCalledWith(null);
      expect(mockSetDate).toHaveBeenCalledWith(null);
      expect(mockSetTheme).toHaveBeenCalledWith(null);
      expect(mockSetGuests).toHaveBeenCalledWith(null);
    });
  });
});
