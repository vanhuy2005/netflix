import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { auth, subscribeToSavedShows } from "../../config/firebase";
import Navbar from "../../components/Navbar/Navbar";
import MovieCard from "../../components/Browse/MovieCard";

// Skeleton Loading Component
const ListSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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

    // Check if profile exists before subscribing
    const currentProfile = localStorage.getItem("current_profile");
    if (!currentProfile) {
      console.log(
        "No profile selected, skipping savedShows subscription in MyList"
      );
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
        if (unsubscribeSavedShows) {
          unsubscribeSavedShows();
        }
      };
    } catch (error) {
      console.error("Error subscribing to saved shows in MyList:", error);
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
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="text-6xl mb-6 opacity-20">📺</div>
            <h2 className="text-xl md:text-2xl text-gray-400 mb-3">
              Bạn chưa chọn nội dung nào
            </h2>
            <p className="text-gray-500 text-base mb-8">
              Hãy chọn phim để xem sau
            </p>
            <button
              onClick={() => navigate("/browse")}
              className="px-8 py-3 bg-white text-black font-semibold rounded hover:bg-gray-200 transition-colors"
            >
              Khám phá ngay
            </button>
          </div>
        ) : (
          /* Grid Layout using MovieCard component with smooth animations */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {savedShows.map((movie) => (
                <motion.div
                  key={movie.id}
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
                  <MovieCard movie={movie} isLarge={false} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Saved Count */}
        {savedShows.length > 0 && (
          <div className="mt-8 text-center text-gray-500 text-sm">
            {savedShows.length} phim đã lưu
          </div>
        )}
      </div>
    </div>
  );
};

export default MyList;
