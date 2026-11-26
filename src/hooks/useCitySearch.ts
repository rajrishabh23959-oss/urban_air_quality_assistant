"use client";

import { useEffect, useState, type RefObject } from "react";
import { searchCitiesApi } from "@/lib/api-client";
import type { Location } from "@/types";

function useOutsideDismiss(containerRef: RefObject<HTMLDivElement | null>, onClose: () => void) {
  useEffect(() => {
    const onOutside = (e: MouseEvent | FocusEvent) => {
      if (
        containerRef.current &&
        e.target instanceof Node &&
        !containerRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("focusin", onOutside);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("focusin", onOutside);
    };
  }, [containerRef, onClose]);
}

function handleDropdownKey(
  e: React.KeyboardEvent<HTMLInputElement>,
  isOpen: boolean,
  results: Location[],
  activeIndex: number,
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>,
  onSelect: (loc: Location) => void,
  onClose: () => void,
) {
  if (!isOpen || results.length === 0) {
    if (e.key === "Escape") onClose();
    return;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    setActiveIndex((prev) => (prev + 1) % results.length);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
  } else if (e.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
    e.preventDefault();
    onSelect(results[activeIndex]);
  } else if (e.key === "Escape") {
    onClose();
    setActiveIndex(-1);
  }
}

function useCitySearchQueryEffect(
  query: string,
  setResults: (r: Location[]) => void,
  setIsOpen: (open: boolean) => void,
  setActiveIndex: (idx: number) => void,
  setSearchError: (err: string | null) => void,
  setIsSearching: (s: boolean) => void,
) {
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        setResults(await searchCitiesApi(trimmed, controller.signal));
        setIsOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setSearchError("City search is temporarily unavailable.");
          setIsOpen(false);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, setResults, setIsOpen, setActiveIndex, setSearchError, setIsSearching]);
}

/**
 * Manages debounced city geocoding search, keyboard navigation, and outside-click dismissal.
 */
export function useCitySearch(
  onSelectLocation: (location: Location) => void,
  containerRef: RefObject<HTMLDivElement | null>,
) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const closeDropdown = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };
  useOutsideDismiss(containerRef, closeDropdown);
  useCitySearchQueryEffect(
    query,
    setResults,
    setIsOpen,
    setActiveIndex,
    setSearchError,
    setIsSearching,
  );

  function handleSelect(loc: Location) {
    onSelectLocation(loc);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleQueryChange(next: string) {
    setQuery(next);
    if (next.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      setSearchError(null);
    }
  }

  return {
    query,
    results,
    isOpen,
    activeIndex,
    searchError,
    isSearching,
    setSearchError,
    handleSelect,
    handleQueryChange,
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) =>
      handleDropdownKey(
        e,
        isOpen,
        results,
        activeIndex,
        setActiveIndex,
        handleSelect,
        closeDropdown,
      ),
  };
}
