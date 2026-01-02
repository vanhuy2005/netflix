import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../config/firebase";
import Navbar from "../../components/Navbar/Navbar";
import Billboard from "../../components/Browse/Billboard";
import Row from "../../components/Browse/Row";
import RecommendationRow from "../../components/Browse/RecommendationRow";
import ContinueWatchingRow from "../../components/Browse/ContinueWatchingRow"; // [PHASE 2]
import requests from "../../api/requests";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import { useContinueWatching } from "../../hooks/useContinueWatching"; // [PHASE 2]

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
  const [user, setUser] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [profileName, setProfileName] = useState("You"); // [PHASE 2] Profile Name
  const [visibleRows, setVisibleRows] = useState(ROWS_PER_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const hasMore = visibleRows < ALL_ROWS.length;

  // [PHASE 2] Get continue watching data early to decide layout
  const { movies: continueMovies } = useContinueWatching(user, profileId);

  // Auth listener & Profile Loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      // Get current profile from local storage
      if (currentUser) {
        try {
          const currentProfile = localStorage.getItem("current_profile");
          if (currentProfile) {
            const profile = JSON.parse(currentProfile);
            setProfileId(profile.id);
            setProfileName(profile.name || "You");
          }
        } catch (error) {
          console.error("Error loading profile:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

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

  const showRecommendations = user && profileId;
  const hasContinueWatching = continueMovies && continueMovies.length > 0;

  return (
    <div className="min-h-screen w-full bg-[#141414] overflow-x-hidden">
      <Navbar />

      {/* Billboard */}
      <div className="relative w-full z-30">
        <Billboard />
      </div>

      {/* --- PERSONALIZED CONTENT SECTION --- */}

      {/* 1. Continue Watching Row (Ưu tiên hiển thị cao nhất) */}
      {hasContinueWatching && (
        // [OPTIMIZED] z-40 with hover:z-50 for smooth layering
        <div className="relative z-40 hover:z-50 w-full -mt-4 md:-mt-6 mb-4 pointer-events-auto transition-all duration-300">
          <ContinueWatchingRow
            user={user}
            profileId={profileId}
            profileName={profileName}
          />
        </div>
      )}

      {/* 2. Smart Recommendations Row */}
      {showRecommendations && (
        <div
          className={`relative z-30 hover:z-50 w-full mb-4 transition-all duration-300 ${
            hasContinueWatching ? "mt-2" : "-mt-4 md:-mt-6"
          }`}
        >
          <RecommendationRow user={user} profileId={profileId} />
        </div>
      )}

      {/* 3. Generic Movie Rows (Standard Content) */}
      <div
        className={`relative z-20 w-full pb-20 transition-all duration-300 ${
          hasContinueWatching || showRecommendations
            ? "mt-2"
            : "-mt-16 md:-mt-24 lg:-mt-32"
        }`}
      >
        {ALL_ROWS.slice(0, visibleRows).map((row, index) => (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "100px" }}
            transition={{ duration: 0.6 }}
            // [OPTIMIZED Z-INDEX]: Row hover nổi lên z-50, base z-10
            className="relative z-10 hover:z-50 transition-all duration-300"
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
