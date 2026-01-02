import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { motion } from "framer-motion";
import { auth, subscribeToSavedShows } from "../../config/firebase";
import Navbar from "../../components/Navbar/Navbar";
import MovieCard from "../../components/Browse/MovieCard";

// --- 1. Animation Variants (Hiệu ứng thác đổ) ---
// Định nghĩa bên ngoài component để tối ưu hiệu năng
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // Thời gian trễ giữa các card (càng nhỏ càng nhanh)
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 }, // Bắt đầu: Mờ và nằm thấp hơn 20px
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" }, // Kết thúc: Hiện rõ và trồi lên
  },
};

// --- 2. Skeleton Loading (Khớp với Grid mới) ---
const ListSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
    {[...Array(12)].map((_, i) => (
      <div
        key={i}
        className="aspect-video bg-netflix-darkGray rounded-md animate-pulse"
      />
    ))}
  </div>
);

const MyList = () => {
  const [user, setUser] = useState(null);
  const [savedShows, setSavedShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Listen to auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Subscribe to saved shows (real-time)
  useEffect(() => {
    if (!user) return;

    const currentProfile = localStorage.getItem("current_profile");
    if (!currentProfile) {
      console.log("No profile selected, skipping subscription");
      setSavedShows([]);
      setLoading(false);
      return;
    }

    const profile = JSON.parse(currentProfile);
    setLoading(true);

    try {
      const unsubscribeSavedShows = subscribeToSavedShows(
        user,
        profile.id,
        (shows) => {
          setSavedShows(shows);
          setLoading(false);
        }
      );

      return () => {
        if (unsubscribeSavedShows) unsubscribeSavedShows();
      };
    } catch (error) {
      console.error("Error subscribing to saved shows:", error);
      setSavedShows([]);
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#141414]">
        <Navbar />
        <div className="pt-24 px-[4%] md:px-[60px] pb-20">
          <h1 className="text-2xl md:text-3xl text-white font-medium mb-6">
            Danh sách của tôi
          </h1>
          <ListSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#141414]">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="pt-24 px-[4%] md:px-[60px] pb-20">
        {/* Page Title */}
        <h1 className="text-2xl md:text-3xl text-white font-medium mb-6">
          Danh sách của tôi
        </h1>

        {/* Empty State */}
        {savedShows.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[50vh] text-center"
          >
            <div className="text-6xl mb-6 opacity-20 grayscale">📺</div>
            <h2 className="text-xl md:text-2xl text-gray-400 mb-3">
              Bạn chưa chọn nội dung nào
            </h2>
            <p className="text-gray-500 text-base mb-8">
              Hãy chọn phim để xem sau
            </p>
            <button
              onClick={() => navigate("/browse")}
              className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition-transform hover:scale-105"
            >
              Khám phá ngay
            </button>
          </motion.div>
        ) : (
          /* --- GRID LAYOUT MỚI & TỐI ƯU --- */
          /* 1. Grid chia cột chi tiết (lên tới 6 cột) để card nhỏ gọn, tinh tế */
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {savedShows.map((movie) => (
              <motion.div
                key={movie.id}
                variants={itemVariants} // Áp dụng hiệu ứng từng item
                className="w-full relative z-0 hover:z-50" // Z-index để khi hover không bị che
              >
                {/* 2. Truyền fillWidth để MovieCard tự co giãn theo Grid */}
                <MovieCard 
                  movie={movie} 
                  isLarge={false} 
                  fillWidth={true} 
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Saved Count */}
        {savedShows.length > 0 && (
          <div className="mt-12 border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            {savedShows.length} phim đã lưu
          </div>
        )}
      </div>
    </div>
  );
};

export default MyList;