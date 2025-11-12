"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SearchLoadingContextType {
  isSearching: boolean;
  startSearch: () => void;
  stopSearch: () => void;
}

const SearchLoadingContext = createContext<SearchLoadingContextType>({
  isSearching: false,
  startSearch: () => {},
  stopSearch: () => {},
});

export function SearchLoadingProvider({ children }: { children: ReactNode }) {
  const [isSearching, setIsSearching] = useState(false);

  const startSearch = () => {
    console.log('🔵 SearchLoadingContext: startSearch called');
    setIsSearching(true);
    console.log('🔵 SearchLoadingContext: isSearching set to true');
  };

  const stopSearch = () => {
    console.log('🔴 SearchLoadingContext: stopSearch called');
    setIsSearching(false);
    console.log('🔴 SearchLoadingContext: isSearching set to false');
  };

  return (
    <SearchLoadingContext.Provider value={{ isSearching, startSearch, stopSearch }}>
      {children}
    </SearchLoadingContext.Provider>
  );
}

export function useSearchLoading() {
  return useContext(SearchLoadingContext);
}
