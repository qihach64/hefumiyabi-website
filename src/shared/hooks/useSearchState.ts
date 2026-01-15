'use client';

import { useQueryState, parseAsString, parseAsInteger, parseAsArrayOf } from 'nuqs';

export function useSearchState() {
  // Basic search params
  const [location, setLocation] = useQueryState('location', parseAsString);
  const [date, setDate] = useQueryState('date', parseAsString);
  const [theme, setTheme] = useQueryState('theme', parseAsString);
  const [guests, setGuests] = useQueryState('guests', parseAsInteger.withDefault(1));

  // Filter params
  const [minPrice, setMinPrice] = useQueryState('minPrice', parseAsInteger);
  const [maxPrice, setMaxPrice] = useQueryState('maxPrice', parseAsInteger);
  const [sort, setSort] = useQueryState('sort', parseAsString.withDefault('recommended'));
  const [category, setCategory] = useQueryState('category', parseAsString);
  const [tags, setTags] = useQueryState('tags', parseAsArrayOf(parseAsString, ','));

  const clearAll = async () => {
    await Promise.all([
      setLocation(null),
      setDate(null),
      setTheme(null),
      setGuests(null),
      setMinPrice(null),
      setMaxPrice(null),
      setSort(null),
      setCategory(null),
      setTags(null),
    ]);
  };

  // Utility for setting price range together
  const setPriceRange = async (range: [number | null, number | null]) => {
    await Promise.all([
      setMinPrice(range[0]),
      setMaxPrice(range[1]),
    ]);
  };

  return {
    // Values
    location,
    date,
    theme,
    guests,
    minPrice,
    maxPrice,
    sort,
    category,
    tags,
    // Setters
    setLocation,
    setDate,
    setTheme,
    setGuests,
    setMinPrice,
    setMaxPrice,
    setSort,
    setCategory,
    setTags,
    // Utilities
    clearAll,
    setPriceRange,
    hasFilters: !!(location || date || theme || minPrice || maxPrice || tags?.length || category),
  };
}
