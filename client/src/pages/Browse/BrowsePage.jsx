import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar/Navbar";
import Billboard from "../../components/Browse/Billboard";
import Row from "../../components/Browse/Row";
import requests from "../../api/requests";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";

// All available row configurations
const ALL_ROWS = [
  {
    id: 1,
    title: "Netflix Originals",
    fetchUrl: requests.fetchNetflixOriginals,
    isLarge: true,
  },
  { id: 2, title: "THỊNH HÀNH", fetchUrl: requests.fetchTrending },
  { id: 3, title: "ĐƯỢC ĐÁNH GIÁ CAO", fetchUrl: requests.fetchTopRated },
  { id: 4, title: "PHIM HÀNH ĐỘNG", fetchUrl: requests.fetchActionMovies },
  { id: 5, title: "PHIM HÀI", fetchUrl: requests.fetchComedyMovies },
  { id: 6, title: "PHIM KINH DỊ", fetchUrl: requests.fetchHorrorMovies },
  { id: 7, title: "PHIM LÃNG MẠN", fetchUrl: requests.fetchRomanceMovies },
  { id: 8, title: "PHIM TÀI LIỆU", fetchUrl: requests.fetchDocumentaries },
  {
    id: 9,
    title: "PHIM KHOA HỌC VIỄN TƯỞNG",
    fetchUrl: requests.fetchSciFiMovies,
  },
  { id: 10, title: "PHIM HOẠT HÌNH", fetchUrl: requests.fetchAnimation },
  { id: 11, title: "PHIM LI KÌ", fetchUrl: requests.fetchThriller },
  { id: 12, title: "PHIM CHÍNH KỊCH ", fetchUrl: requests.fetchDrama },
];

const ROWS_PER_BATCH = 3; // Load 3 rows at a time

const BrowsePage = () => {
  const [visibleRows, setVisibleRows] = useState(ROWS_PER_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const hasMore = visibleRows < ALL_ROWS.length;

  const loadMoreRows = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    // Simulate network delay for smooth UX
    setTimeout(() => {
      setVisibleRows((prev) =>
        Math.min(prev + ROWS_PER_BATCH, ALL_ROWS.length)
      );
      setIsLoadingMore(false);
    }, 500);
  }, [isLoadingMore, hasMore]);

  const { sentinelRef } = useInfiniteScroll(
    loadMoreRows,
    hasMore,
    isLoadingMore
  );

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-netflix-deepBlack">
      {/* Navbar với scroll behavior */}
      <Navbar />

      {/* Billboard Hero Section - Full Viewport */}
      <div className="relative w-full">
        <Billboard />
        {/* Gradient blend đã có trong Billboard, không cần thêm ở đây */}
      </div>

      {/* Movie Rows - Giảm overlap để không đè lên Billboard quá nhiều */}
      <div className="relative z-20 w-full pb-20 -mt-12 md:-mt-16 lg:-mt-20">
        {ALL_ROWS.slice(0, visibleRows).map((row, index) => (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: Math.min(index * 0.08, 1) }}
          >
            <Row
              title={row.title}
              fetchUrl={row.fetchUrl}
              isLarge={row.isLarge || false}
            />
          </motion.div>
        ))}

        {/* Sentinel Element for Infinite Scroll */}
        {hasMore && (
          <div ref={sentinelRef} className="w-full py-8 flex justify-center">
            {isLoadingMore && (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-netflix-red"></div>
                <span className="text-gray-400 text-sm">Đang tải thêm...</span>
              </div>
            )}
          </div>
        )}

        {/* End of Content Indicator */}
        {!hasMore && (
          <div className="w-full py-12 flex justify-center">
            <div className="text-gray-500 text-sm">
              Bạn đã xem hết tất cả thể loại
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowsePage;
