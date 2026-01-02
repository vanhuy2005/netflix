import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar/Navbar";
import Billboard from "../../components/Browse/Billboard";
import Row from "../../components/Browse/Row";
import requests from "../../api/requests";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";

const ALL_ROWS = [
  {
    id: 1,
    title: "Netflix Originals",
    fetchUrl: requests.fetchNetflixOriginals,
    isLarge: true,
  },
  { id: 2, title: "Xu Hướng", fetchUrl: requests.fetchTrending },
  { id: 3, title: "Được Đánh Giá Cao", fetchUrl: requests.fetchTopRated },
  { id: 4, title: "Phim Hành Động", fetchUrl: requests.fetchActionMovies },
  { id: 5, title: "Phim Hài", fetchUrl: requests.fetchComedyMovies },
  { id: 6, title: "Phim Kinh Dị", fetchUrl: requests.fetchHorrorMovies },
  { id: 7, title: "Phim Lãng Mạn", fetchUrl: requests.fetchRomanceMovies },
  { id: 8, title: "Phim Tài Liệu", fetchUrl: requests.fetchDocumentaries },
  {
    id: 9,
    title: "Khoa Học Viễn Tưởng",
    fetchUrl: requests.fetchSciFiMovies,
  },
  { id: 10, title: "Phim Hoạt Hình", fetchUrl: requests.fetchAnimation },
  { id: 11, title: "Phim Ly Kỳ", fetchUrl: requests.fetchThriller },
  { id: 12, title: "Phim Chính Kịch", fetchUrl: requests.fetchDrama },
];

const ROWS_PER_BATCH = 3;

const BrowsePage = () => {
  const [visibleRows, setVisibleRows] = useState(ROWS_PER_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const hasMore = visibleRows < ALL_ROWS.length;

  const loadMoreRows = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

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
    // [FIX] overflow-x-hidden: Ngăn trang bị cuộn ngang
    <div className="min-h-screen w-full bg-[#141414] overflow-x-hidden">
      <Navbar />

      {/* Billboard */}
      <div className="relative w-full">
        <Billboard />
      </div>

      {/* Movie Rows */}
      {/* -mt-12 md:-mt-24: Kéo hàng phim lên đè lên phần dưới của Billboard */}
      <div className="relative z-20 w-full pb-20 -mt-16 md:-mt-24 lg:-mt-32 space-y-4 md:space-y-8">
        {ALL_ROWS.slice(0, visibleRows).map((row, index) => (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "100px" }} // Tối ưu hiệu năng, chỉ load khi gần đến
            transition={{ duration: 0.6 }}
          >
            <Row
              title={row.title}
              fetchUrl={row.fetchUrl}
              isLarge={row.isLarge || false}
            />
          </motion.div>
        ))}

        {/* Loading Sentinel */}
        {hasMore && (
          <div ref={sentinelRef} className="w-full py-10 flex justify-center">
            {isLoadingMore && (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
              </div>
            )}
          </div>
        )}

        {/* End of Content */}
        {!hasMore && (
          <div className="w-full py-20 flex flex-col items-center text-gray-500 gap-2">
            <p className="text-sm">Đã hiển thị tất cả nội dung</p>
            <div className="w-20 h-[1px] bg-gray-800"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowsePage;