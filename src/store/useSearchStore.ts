/**
 * Search state managed with Zustand.
 */
import { create } from 'zustand';
import type { SearchResult } from '../types/detection';
import { MAX_RECENT_SEARCHES } from '../utils/constants';

interface SearchFilters {
  roomId?: string;
  category?: string;
}

interface SearchState {
  query: string;
  filters: SearchFilters;
  results: SearchResult[];
  recentSearches: string[];
  isSearching: boolean;
}

interface SearchActions {
  setQuery: (query: string) => void;
  setFilters: (filters: SearchFilters) => void;
  setResults: (results: SearchResult[]) => void;
  addRecentSearch: (term: string) => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState & SearchActions>((set) => ({
  // ── State ───────────────────────────────────────────────────────────
  query: '',
  filters: {},
  results: [],
  recentSearches: [],
  isSearching: false,

  // ── Actions ─────────────────────────────────────────────────────────
  setQuery: (query) => set({ query, isSearching: query.length > 0 }),

  setFilters: (filters) => set({ filters }),

  setResults: (results) => set({ results, isSearching: false }),

  addRecentSearch: (term) =>
    set((state) => {
      const trimmed = term.trim();
      if (!trimmed) return state;

      // De-duplicate and cap at MAX_RECENT_SEARCHES
      const filtered = state.recentSearches.filter((s) => s !== trimmed);
      return {
        recentSearches: [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES),
      };
    }),

  clearSearch: () =>
    set({
      query: '',
      filters: {},
      results: [],
      isSearching: false,
    }),
}));
