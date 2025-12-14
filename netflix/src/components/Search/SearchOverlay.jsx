import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { IoPlay } from "react-icons/io5";
import requests from "../../api/requests";

const SearchOverlay = ({ onClose }) => {
  const [topSearches, setTopSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopSearches = async () => {
      try {
        const response = await axios.get(requests.fetchTrending);

        // Filter items with images and take top 6
        const filtered = response.data.results
          .filter((item) => item.backdrop_path || item.poster_path)
          .slice(0, 10);

        setTopSearches(filtered);
      } catch (error) {
        console.error("Error fetching top searches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopSearches();
  }, []);

  const handleMovieClick = (movieId) => {
    onClose();
    navigate(`/player/${movieId}`);
  };

  return (
    <>
      {/* Backdrop - Click to close */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown Box */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute top-full right-0 mt-2 w-[400px] bg-black/95 backdrop-blur-md rounded-md overflow-hidden shadow-2xl z-50 border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="px-6 py-5 border-b border-gray-800">
          <h3 className="text-white text-base font-semibold">
            Tìm kiếm nhiều nhất
          </h3>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="px-4 py-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-netflix-darkGray rounded-md animate-pulse"
              />
            ))}
          </div>
        ) : (
          /* Top Searches List */
          <div className="max-h-[400px] overflow-y-auto">
            {topSearches.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleMovieClick(item.id)}
                className="group flex items-center px-5 py-3 hover:bg-[#2F2F2F] cursor-pointer transition-colors border-b border-gray-800/50 last:border-0"
              >
                {/* Thumbnail */}
                <div className="relative w-[110px] h-[62px] flex-shrink-0 rounded overflow-hidden">
                  <img
                    src={`https://image.tmdb.org/t/p/w200${
                      item.backdrop_path || item.poster_path
                    }`}
                    alt={item.title || item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Movie Info */}
                <div className="flex-1 ml-6 min-w-0">
                  <h4 className="text-white text-[16px] font-medium line-clamp-1">
                    {item.title || item.name}
                  </h4>
                </div>

                {/* Play Icon on Right */}
                <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <IoPlay className="text-white text-2xl" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </>
  );
};

export default SearchOverlay;
