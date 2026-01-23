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

  // Store/Region params (用于首页筛选)
  const [storeId, setStoreId] = useQueryState('storeId', parseAsString);
  const [region, setRegion] = useQueryState('region', parseAsString);

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
      setStoreId(null),
      setRegion(null),
    ]);
  };

  // 清除筛选条件但保留搜索条件 (location, date, theme)
  const clearFilters = async () => {
    await Promise.all([
      setMinPrice(null),
      setMaxPrice(null),
      setSort(null),
      setCategory(null),
      setTags(null),
      setStoreId(null),
      setRegion(null),
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
    storeId,
    region,
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
    setStoreId,
    setRegion,
    // Utilities
    clearAll,
    clearFilters,
    setPriceRange,
    hasFilters: !!(location || date || theme || minPrice || maxPrice || tags?.length || category || storeId || region),
  };
}
