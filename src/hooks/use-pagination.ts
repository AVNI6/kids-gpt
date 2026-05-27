import * as React from "react";

type UsePaginationOptions = {
  pageSize?: number;
  initialPage?: number;
};

type UsePaginationResult<T> = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  currentItems: T[];
  hasNextPage: boolean;
  hasPrevPage: boolean;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
};

export function usePagination<T>(
  items: T[],
  { pageSize = 9, initialPage = 1 }: UsePaginationOptions = {}
): UsePaginationResult<T> {
  const [page, setPageState] = React.useState(initialPage);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const clampedPage = Math.min(page, totalPages);

  const setPage = React.useCallback(
    (nextPage: number) => {
      const clamped = Math.min(Math.max(nextPage, 1), totalPages);
      setPageState(clamped);
    },
    [totalPages]
  );

  const startIndex = (clampedPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const currentItems = React.useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  const hasPrevPage = clampedPage > 1;
  const hasNextPage = clampedPage < totalPages;

  const nextPage = React.useCallback(() => {
    setPage(clampedPage + 1);
  }, [clampedPage, setPage]);

  const prevPage = React.useCallback(() => {
    setPage(clampedPage - 1);
  }, [clampedPage, setPage]);

  return {
    page: clampedPage,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    currentItems,
    hasNextPage,
    hasPrevPage,
    setPage,
    nextPage,
    prevPage,
  };
}
