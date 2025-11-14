"use client";

import { createContext, useContext, useState, useEffect, ReactNode, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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

// 内部组件，使用 useSearchParams
function SearchStateProviderInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();

  const [searchState, setSearchState] = useState<SearchState>(() => ({
    location: searchParams.get('location') || '',
    date: searchParams.get('date') || '',
    guests: parseInt(searchParams.get('guests') || '1'),
    guestsDetail: {
      total: parseInt(searchParams.get('guests') || '1'),
      men: parseInt(searchParams.get('men') || '0'),
      women: parseInt(searchParams.get('women') || '1'),
      children: parseInt(searchParams.get('children') || '0'),
    },
  }));

  // 监听 URL 参数变化，同步到状态
  useEffect(() => {
    setSearchState({
      location: searchParams.get('location') || '',
      date: searchParams.get('date') || '',
      guests: parseInt(searchParams.get('guests') || '1'),
      guestsDetail: {
        total: parseInt(searchParams.get('guests') || '1'),
        men: parseInt(searchParams.get('men') || '0'),
        women: parseInt(searchParams.get('women') || '1'),
        children: parseInt(searchParams.get('children') || '0'),
      },
    });
  }, [searchParams]);

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

// 外部组件，包裹 Suspense
export function SearchStateProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <SearchStateContext.Provider
        value={{
          searchState: {
            location: '',
            date: '',
            guests: 1,
            guestsDetail: { total: 1, men: 0, women: 1, children: 0 },
          },
          setLocation: () => {},
          setDate: () => {},
          setGuests: () => {},
          setGuestsDetail: () => {},
          resetSearchState: () => {},
        }}
      >
        {children}
      </SearchStateContext.Provider>
    }>
      <SearchStateProviderInner>
        {children}
      </SearchStateProviderInner>
    </Suspense>
  );
}

export function useSearchState() {
  const context = useContext(SearchStateContext);
  if (context === undefined) {
    throw new Error('useSearchState must be used within a SearchStateProvider');
  }
  return context;
}
