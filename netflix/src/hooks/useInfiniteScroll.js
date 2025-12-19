import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for implementing infinite scroll functionality
 * 
 * @param {Function} callback - Function to call when sentinel is visible
 * @param {boolean} hasMore - Whether there are more items to load
 * @param {boolean} loading - Whether currently loading
 * @returns {Object} - { sentinelRef, isVisible }
 */
const useInfiniteScroll = (callback, hasMore = true, loading = false) => {
  const [isVisible, setIsVisible] = useState(false);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const handleIntersection = useCallback((entries) => {
    const [entry] = entries;
    
    if (entry.isIntersecting && hasMore && !loading) {
      setIsVisible(true);
      callback();
    } else {
      setIsVisible(false);
    }
  }, [callback, hasMore, loading]);

  useEffect(() => {
    const options = {
      root: null, // viewport
      rootMargin: '100px', // Load 100px before reaching the sentinel
      threshold: 0.1, // Trigger when 10% visible
    };

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(handleIntersection, options);

    // Observe sentinel element
    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observerRef.current.observe(currentSentinel);
    }

    // Cleanup on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection]);

  return { sentinelRef, isVisible };
};

export default useInfiniteScroll;
