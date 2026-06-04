import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const useInfiniteScroll = (items, pageSize = 6) => {
  const [loadedPages, setLoadedPages] = useState(1);
  const sentinelRef = useRef(null);

  const visibleItems = useMemo(() => {
    const count = Math.min(loadedPages * pageSize, items.length);
    return items.slice(0, count);
  }, [items, loadedPages, pageSize]);

  const hasMore = loadedPages * pageSize < items.length;

  const loadMore = useCallback(() => {
    setLoadedPages((current) => {
      const nextCount = (current + 1) * pageSize;
      if (nextCount >= items.length) {
        return Math.ceil(items.length / pageSize);
      }
      return current + 1;
    });
  }, [items.length, pageSize]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) {
      return undefined;
    }

    const root = document.querySelector('.pm-h5-main');

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      {
        root: root instanceof Element ? root : null,
        rootMargin: '100px',
        threshold: 0,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore, visibleItems.length]);

  return {
    visibleItems,
    hasMore,
    loadMore,
    sentinelRef,
    total: items.length,
    loaded: visibleItems.length,
  };
};
