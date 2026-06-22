import * as React from "react";

type UsePaginationOptions = {
  pageSize?: number;
  initialPage?: number;
  totalItems?: number;
  page?: number;
  onPageChange?: (page: number) => void;
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
  {
    pageSize = 9,
    initialPage = 1,
    totalItems: totalItemsOption,
    page: controlledPage,
    onPageChange,
  }: UsePaginationOptions = {}
): UsePaginationResult<T> {
  const [internalPage, setInternalPage] = React.useState(initialPage);

  const totalItems = totalItemsOption !== undefined ? totalItemsOption : items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const activePage = controlledPage !== undefined ? controlledPage : internalPage;
  const clampedPage = Math.min(Math.max(activePage, 1), totalPages);

  const setPage = React.useCallback(
    (nextPage: number) => {
      const clamped = Math.min(Math.max(nextPage, 1), totalPages);
      if (onPageChange) {
        onPageChange(clamped);
      }
      if (controlledPage === undefined) {
        setInternalPage(clamped);
      }
    },
    [totalPages, controlledPage, onPageChange]
  );

  const startIndex = (clampedPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const currentItems = React.useMemo(() => {
    if (totalItemsOption !== undefined) {
      return items;
    }
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex, totalItemsOption]);

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
