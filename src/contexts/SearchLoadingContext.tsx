"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SearchLoadingContextType {
  isSearching: boolean;
  searchTarget: string;
  startSearch: (targetParams: string) => void;
  stopSearch: () => void;
}

const SearchLoadingContext = createContext<SearchLoadingContextType>({
  isSearching: false,
  searchTarget: '',
  startSearch: () => {},
  stopSearch: () => {},
});

export function SearchLoadingProvider({ children }: { children: ReactNode }) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTarget, setSearchTarget] = useState('');

  const startSearch = (targetParams: string) => {
    console.log('🔵 SearchLoadingContext: startSearch called with target =', targetParams);
    setSearchTarget(targetParams);
    setIsSearching(true);
    console.log('🔵 SearchLoadingContext: isSearching set to true');
  };

  const stopSearch = () => {
    console.log('🔴 SearchLoadingContext: stopSearch called');
    setIsSearching(false);
    setSearchTarget('');
    console.log('🔴 SearchLoadingContext: isSearching set to false');
  };

  return (
    <SearchLoadingContext.Provider value={{ isSearching, searchTarget, startSearch, stopSearch }}>
      {children}
    </SearchLoadingContext.Provider>
  );
}

export function useSearchLoading() {
  return useContext(SearchLoadingContext);
}
