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
const mockSetMinPrice = vi.fn();
const mockSetMaxPrice = vi.fn();
const mockSetSort = vi.fn();
const mockSetCategory = vi.fn();
const mockSetTags = vi.fn();

let mockLocationValue: string | null = null;
let mockDateValue: string | null = null;
let mockThemeValue: string | null = null;
let mockGuestsValue: number = 1;
let mockMinPriceValue: number | null = null;
let mockMaxPriceValue: number | null = null;
let mockSortValue: string = 'recommended';
let mockCategoryValue: string | null = null;
let mockTagsValue: string[] | null = null;

vi.mock('nuqs', () => ({
  useQueryState: vi.fn((key: string, _parser: unknown) => {
    switch (key) {
      case 'location':
        return [mockLocationValue, mockSetLocation];
      case 'date':
        return [mockDateValue, mockSetDate];
      case 'theme':
        return [mockThemeValue, mockSetTheme];
      case 'guests':
        return [mockGuestsValue, mockSetGuests];
      case 'minPrice':
        return [mockMinPriceValue, mockSetMinPrice];
      case 'maxPrice':
        return [mockMaxPriceValue, mockSetMaxPrice];
      case 'sort':
        return [mockSortValue, mockSetSort];
      case 'category':
        return [mockCategoryValue, mockSetCategory];
      case 'tags':
        return [mockTagsValue, mockSetTags];
      default:
        return [null, vi.fn()];
    }
  }),
  parseAsString: {
    withDefault: (defaultValue: string) => ({ defaultValue }),
  },
  parseAsInteger: {
    withDefault: (defaultValue: number) => ({ defaultValue }),
  },
  parseAsArrayOf: (_parser: unknown, _separator: string) => ({}),
}));

import { useSearchState } from '../useSearchState';

describe('useSearchState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationValue = null;
    mockDateValue = null;
    mockThemeValue = null;
    mockGuestsValue = 1;
    mockMinPriceValue = null;
    mockMaxPriceValue = null;
    mockSortValue = 'recommended';
    mockCategoryValue = null;
    mockTagsValue = null;
  });

  it('returns all state values', () => {
    const { result } = renderHook(() => useSearchState());

    expect(result.current.location).toBe(null);
    expect(result.current.date).toBe(null);
    expect(result.current.theme).toBe(null);
    expect(result.current.guests).toBe(1);
    expect(result.current.minPrice).toBe(null);
    expect(result.current.maxPrice).toBe(null);
    expect(result.current.sort).toBe('recommended');
    expect(result.current.category).toBe(null);
    expect(result.current.tags).toBe(null);
  });

  it('returns all setter functions', () => {
    const { result } = renderHook(() => useSearchState());

    expect(typeof result.current.setLocation).toBe('function');
    expect(typeof result.current.setDate).toBe('function');
    expect(typeof result.current.setTheme).toBe('function');
    expect(typeof result.current.setGuests).toBe('function');
    expect(typeof result.current.setMinPrice).toBe('function');
    expect(typeof result.current.setMaxPrice).toBe('function');
    expect(typeof result.current.setSort).toBe('function');
    expect(typeof result.current.setCategory).toBe('function');
    expect(typeof result.current.setTags).toBe('function');
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

  it('hasFilters is true when minPrice is set', () => {
    mockMinPriceValue = 1000;
    const { result } = renderHook(() => useSearchState());

    expect(result.current.hasFilters).toBe(true);
  });

  it('hasFilters is true when maxPrice is set', () => {
    mockMaxPriceValue = 5000;
    const { result } = renderHook(() => useSearchState());

    expect(result.current.hasFilters).toBe(true);
  });

  it('hasFilters is true when tags are set', () => {
    mockTagsValue = ['popular', 'recommended'];
    const { result } = renderHook(() => useSearchState());

    expect(result.current.hasFilters).toBe(true);
  });

  it('hasFilters is true when category is set', () => {
    mockCategoryValue = 'ladies';
    const { result } = renderHook(() => useSearchState());

    expect(result.current.hasFilters).toBe(true);
  });

  it('hasFilters ignores guests and sort values', () => {
    mockGuestsValue = 5;
    mockSortValue = 'price_asc';
    const { result } = renderHook(() => useSearchState());

    // guests and sort don't affect hasFilters
    expect(result.current.hasFilters).toBe(false);
  });

  describe('clearAll', () => {
    it('calls all setters with null', async () => {
      const { result } = renderHook(() => useSearchState());

      await act(async () => {
        await result.current.clearAll();
      });

      expect(mockSetLocation).toHaveBeenCalledWith(null);
      expect(mockSetDate).toHaveBeenCalledWith(null);
      expect(mockSetTheme).toHaveBeenCalledWith(null);
      expect(mockSetGuests).toHaveBeenCalledWith(null);
      expect(mockSetMinPrice).toHaveBeenCalledWith(null);
      expect(mockSetMaxPrice).toHaveBeenCalledWith(null);
      expect(mockSetSort).toHaveBeenCalledWith(null);
      expect(mockSetCategory).toHaveBeenCalledWith(null);
      expect(mockSetTags).toHaveBeenCalledWith(null);
    });
  });

  describe('setPriceRange', () => {
    it('sets both minPrice and maxPrice', async () => {
      const { result } = renderHook(() => useSearchState());

      await act(async () => {
        await result.current.setPriceRange([1000, 5000]);
      });

      expect(mockSetMinPrice).toHaveBeenCalledWith(1000);
      expect(mockSetMaxPrice).toHaveBeenCalledWith(5000);
    });

    it('can set null values', async () => {
      const { result } = renderHook(() => useSearchState());

      await act(async () => {
        await result.current.setPriceRange([null, null]);
      });

      expect(mockSetMinPrice).toHaveBeenCalledWith(null);
      expect(mockSetMaxPrice).toHaveBeenCalledWith(null);
    });
  });
});
