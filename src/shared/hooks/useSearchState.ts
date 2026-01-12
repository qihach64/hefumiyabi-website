import { useQueryState, parseAsString, parseAsInteger } from 'nuqs';

export function useSearchState() {
  const [location, setLocation] = useQueryState('location', parseAsString);
  const [date, setDate] = useQueryState('date', parseAsString);
  const [theme, setTheme] = useQueryState('theme', parseAsString);
  const [guests, setGuests] = useQueryState('guests', parseAsInteger.withDefault(1));

  const clearAll = () => {
    setLocation(null);
    setDate(null);
    setTheme(null);
    setGuests(null);
  };

  return {
    // Values
    location,
    date,
    theme,
    guests,
    // Setters
    setLocation,
    setDate,
    setTheme,
    setGuests,
    // Utilities
    clearAll,
    hasFilters: !!(location || date || theme),
  };
}
