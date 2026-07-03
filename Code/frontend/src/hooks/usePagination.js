import { useState, useCallback } from "react";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "../utils/constants";

/**
 * Pagination state helper
 */
const usePagination = (initialPage = DEFAULT_PAGE, initialPageSize = DEFAULT_PAGE_SIZE) => {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    resetPage,
  };
};

export default usePagination;
