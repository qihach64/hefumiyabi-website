"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { GuestsDetail } from '@/components/GuestsDropdown';

interface SearchState {
  location: string;
  date: string;
  guests: number;
  guestsDetail: GuestsDetail;
}

interface SearchStateContextType {
  searchState: SearchState;
  setLocation: (location: string) => void;
  setDate: (date: string) => void;
  setGuests: (guests: number) => void;
  setGuestsDetail: (detail: GuestsDetail) => void;
  resetSearchState: () => void;
}

const SearchStateContext = createContext<SearchStateContextType | undefined>(undefined);

const getInitialGuestsDetail = (): GuestsDetail => {
  if (typeof window === 'undefined') {
    return { total: 1, men: 0, women: 1, children: 0 };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    total: parseInt(params.get('guests') || '1'),
    men: parseInt(params.get('men') || '0'),
    women: parseInt(params.get('women') || '1'),
    children: parseInt(params.get('children') || '0'),
  };
};

const getInitialSearchState = (): SearchState => {
  if (typeof window === 'undefined') {
    return {
      location: '',
      date: '',
      guests: 1,
      guestsDetail: { total: 1, men: 0, women: 1, children: 0 },
    };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    location: params.get('location') || '',
    date: params.get('date') || '',
    guests: parseInt(params.get('guests') || '1'),
    guestsDetail: getInitialGuestsDetail(),
  };
};

export function SearchStateProvider({ children }: { children: ReactNode }) {
  const [searchState, setSearchState] = useState<SearchState>(getInitialSearchState);

  const setLocation = (location: string) => {
    setSearchState(prev => ({ ...prev, location }));
  };

  const setDate = (date: string) => {
    setSearchState(prev => ({ ...prev, date }));
  };

  const setGuests = (guests: number) => {
    setSearchState(prev => ({ ...prev, guests }));
  };

  const setGuestsDetail = (guestsDetail: GuestsDetail) => {
    setSearchState(prev => ({
      ...prev,
      guests: guestsDetail.total,
      guestsDetail
    }));
  };

  const resetSearchState = () => {
    setSearchState({
      location: '',
      date: '',
      guests: 1,
      guestsDetail: { total: 1, men: 0, women: 1, children: 0 },
    });
  };

  return (
    <SearchStateContext.Provider
      value={{
        searchState,
        setLocation,
        setDate,
        setGuests,
        setGuestsDetail,
        resetSearchState,
      }}
    >
      {children}
    </SearchStateContext.Provider>
  );
}

export function useSearchState() {
  const context = useContext(SearchStateContext);
  if (context === undefined) {
    throw new Error('useSearchState must be used within a SearchStateProvider');
  }
  return context;
}
