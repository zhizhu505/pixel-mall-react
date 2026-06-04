import { useMemo, useState } from 'react';

export const usePagination = (items, pageSize = 6) => {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const slice = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return {
    page: currentPage,
    setPage,
    totalPages,
    pageSize,
    slice,
    total: items.length,
    hasPrev: currentPage > 1,
    hasNext: currentPage < totalPages,
  };
};
