import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Navbar from "../../components/Navbar/Navbar";
import MovieCard from "../../components/Browse/MovieCard";
import requests from "../../api/requests";
import { IoInformationCircleOutline } from "react-icons/io5";

// Custom Hook: useDebounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Skeleton Loading Component
const SearchSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <div
        key={i}
        className="aspect-video bg-netflix-darkGray rounded-md animate-pulse"
      />
    ))}
  </div>
);

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const debouncedQuery = useDebounce(query, 500);

  const [results, setResults] = useState([]);
  const [topSearches, setTopSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data based on query
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if query exists and is not empty
        if (debouncedQuery && debouncedQuery.trim() !== "") {
          // Case A: Search with keyword
          console.log("Searching for:", debouncedQuery);
          
          // Clear previous results
          setTopSearches([]);
          
          const searchUrl = requests.search(debouncedQuery);
          console.log("API URL:", searchUrl);
          
          const response = await axios.get(searchUrl);
          console.log("Search results:", response.data.results.length);

          // Filter out items without images
          const filteredResults = response.data.results.filter(
            (item) => item.backdrop_path || item.poster_path
          );

          setResults(filteredResults);
        } else {
          // Case B: No keyword - Show Top Searches (Trending)
          console.log("Loading trending content...");
          
          // Clear previous search results
          setResults([]);
          
          const trendingUrl = requests.fetchTrending;
          console.log("📡 API URL:", trendingUrl);
          
          const response = await axios.get(trendingUrl);
          console.log("Trending results:", response.data.results.length);

          // Filter out items without images
          const filteredResults = response.data.results.filter(
            (item) => item.backdrop_path || item.poster_path
          );

          setTopSearches(filteredResults);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        console.error("Error details:", err.response?.data || err.message);
        setError("Không thể tải kết quả. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [debouncedQuery]);

  // Empty State Component
  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      <IoInformationCircleOutline className="text-6xl text-gray-500 mb-6" />
      <h2 className="text-2xl md:text-3xl text-white font-medium mb-4">
        Không tìm thấy kết quả nào cho "{query}"
      </h2>
      <div className="text-gray-400 text-base space-y-2 max-w-md">
        <p className="mb-4">Gợi ý tìm kiếm:</p>
        <ul className="text-left space-y-2">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Thử sử dụng từ khóa khác</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              Thử tìm kiếm bằng tên phim, chương trình truyền hình hoặc tên diễn
              viên
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Thử dùng tên tiếng Anh của phim</span>
          </li>
        </ul>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/browse")}
        className="mt-8 px-8 py-3 bg-white text-black font-semibold rounded hover:bg-gray-200 transition-colors"
      >
        Về trang chủ
      </motion.button>
    </motion.div>
  );

  return (
    <div className="min-h-screen w-full bg-[#141414]">
      <Navbar />

      {/* Main Content */}
      <div className="pt-24 px-[4%] md:px-[60px] pb-20">
        {/* Filter Bar - Only show when there's a query */}
        {query.trim() && !loading && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 pb-4 border-b border-gray-800"
          >
            <h2 className="text-xl md:text-2xl text-white font-medium">
              Kết quả cho: <span className="text-gray-400">"{query}"</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {results.length} kết quả
            </p>
          </motion.div>
        )}

        {/* Page Title - Top Searches */}
        {!query.trim() && !loading && (
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl text-white font-medium mb-6"
          >
            Tìm kiếm nhiều nhất
          </motion.h1>
        )}

        {/* Loading State */}
        {loading && <SearchSkeleton />}

        {/* Error State */}
        {error && (
          <div className="text-center text-red-500 py-20">
            <p className="text-xl">{error}</p>
          </div>
        )}

        {/* Results Grid - With Search Query */}
        {!loading && query.trim() && (
          <>
            {results.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {results.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{
                        opacity: 0,
                        scale: 0.5,
                        transition: { duration: 0.2 },
                      }}
                      transition={{
                        layout: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.3 },
                        scale: { duration: 0.3 },
                      }}
                    >
                      <MovieCard movie={item} isLarge={false} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <EmptyState />
            )}
          </>
        )}

        {/* Top Searches Grid - No Query */}
        {!loading && !query.trim() && topSearches.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {topSearches.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    layout: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.3 },
                    scale: { duration: 0.3 },
                  }}
                >
                  <MovieCard movie={item} isLarge={false} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
