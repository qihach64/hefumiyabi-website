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
    setIsSearching(true);
  };

  const stopSearch = () => {
    setIsSearching(false);
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
