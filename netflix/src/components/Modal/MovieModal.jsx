import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import YouTube from "react-youtube";
import {
  IoCloseOutline,
  IoPlay,
  IoAdd,
  IoCheckmark,
  IoVolumeMute,
  IoVolumeHigh,
  IoStar,
} from "react-icons/io5";
import { useModal } from "../../context/ModalContext";
import { getImageUrl } from "../../utils/tmdbApi";
import {
  auth,
  saveShow,
  removeShow,
  subscribeToSavedShows,
} from "../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";

const MovieModal = () => {
  const { isOpen, content, closeModal } = useModal();
  const navigate = useNavigate();

  // State
  const [details, setDetails] = useState(null);
  const [cast, setCast] = useState([]);
  const [director, setDirector] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [trailer, setTrailer] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [user, setUser] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedShows, setSavedShows] = useState([]);

  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  // --- AUTH & FIREBASE LOGIC (Giữ nguyên) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setSavedShows([]);
      return;
    }
    const currentProfile = localStorage.getItem("current_profile");
    if (!currentProfile) return;
    const profile = JSON.parse(currentProfile);

    try {
      const unsubscribe = subscribeToSavedShows(user, profile.id, (shows) => {
        setSavedShows(shows);
      });
      return () => unsubscribe && unsubscribe();
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  useEffect(() => {
    if (content && savedShows.length > 0) {
      const saved = savedShows.some((show) => String(show.id) === String(content.id));
      setIsSaved(saved);
    } else {
      setIsSaved(false);
    }
  }, [content, savedShows]);

  // --- FETCH DATA ---
  useEffect(() => {
    if (content) {
      const fetchDetails = async () => {
        try {
          const type = content.media_type === "tv" || content.first_air_date ? "tv" : "movie";

          const [detailRes, creditRes, similarRes, videoRes] = await Promise.all([
            axios.get(`https://api.themoviedb.org/3/${type}/${content.id}?api_key=${TMDB_API_KEY}&language=vi-VN`),
            axios.get(`https://api.themoviedb.org/3/${type}/${content.id}/credits?api_key=${TMDB_API_KEY}`),
            axios.get(`https://api.themoviedb.org/3/${type}/${content.id}/similar?api_key=${TMDB_API_KEY}&language=vi-VN`),
            axios.get(`https://api.themoviedb.org/3/${type}/${content.id}/videos?api_key=${TMDB_API_KEY}`),
          ]);

          setDetails(detailRes.data);
          setCast(creditRes.data.cast.slice(0, 4));
          const dir = creditRes.data.crew.find((p) => p.job === "Director");
          setDirector(dir ? dir.name : null);
          // Lấy nhiều phim hơn chút để scroll ngang cho đẹp
          setSimilar(similarRes.data.results.slice(0, 15));

          const vid = videoRes.data.results.find((v) => v.site === "YouTube" && v.type === "Trailer") || videoRes.data.results[0];
          setTrailer(vid ? vid.key : null);
        } catch (error) {
          console.error("Fetch Error:", error);
        }
      };
      fetchDetails();
    }
    return () => {
      setDetails(null);
      setTrailer(null);
    };
  }, [content, TMDB_API_KEY]);

  // --- HANDLERS ---
  const handlePlay = () => {
    closeModal();
    navigate(`/player/${content.id}`);
  };

  const handleToggleList = async () => {
    if (!user) return;
    const currentProfile = localStorage.getItem("current_profile");
    if (!currentProfile) return;
    const profile = JSON.parse(currentProfile);

    try {
      if (isSaved) await removeShow(user, profile.id, content.id);
      else await saveShow(user, profile.id, content);
    } catch (error) {
      console.error(error);
    }
  };

  const renderStars = (vote) => {
    const stars = Math.round(vote / 2);
    return (
      <div className="flex items-center gap-1 text-yellow-500 text-sm">
        {[...Array(5)].map((_, i) => (
          <IoStar key={i} className={i < stars ? "fill-current" : "text-gray-600"} />
        ))}
      </div>
    );
  };

  const opts = {
    height: "100%",
    width: "100%",
    playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, mute: isMuted ? 1 : 0, loop: 1, playlist: trailer || "" },
  };

  if (!content) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="modal-backdrop"
          onClick={(e) => e.target.id === "modal-backdrop" && closeModal()}
          // Thêm className hide-scrollbar nếu bạn có custom css, hoặc dùng tailwind scrollbar-hide plugin
          className="fixed inset-0 z-[100] bg-black/80 flex justify-center overflow-y-auto pt-10 pb-10 px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ duration: 0.4, type: "spring", damping: 25 }}
            className="relative w-full max-w-[850px] bg-[#141414] rounded-sm overflow-hidden shadow-2xl flex flex-col"
            style={{ height: "fit-content" }}
          >
            {/* === 1. HERO SECTION === */}
            <div className="relative w-full aspect-video bg-[#141414] group">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 z-50 w-9 h-9 bg-[#181818]/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10"
              >
                <IoCloseOutline size={22} />
              </button>

              <div className="absolute inset-0 overflow-hidden">
                {trailer ? (
                  <YouTube
                    videoId={trailer}
                    opts={opts}
                    className="w-full h-full pointer-events-none opacity-80"
                    iframeClassName="w-[140%] h-[140%] absolute -top-[20%] -left-[20%]"
                  />
                ) : (
                  <img
                    src={getImageUrl(content.backdrop_path || content.poster_path, "original")}
                    className="w-full h-full object-cover"
                    alt="Backdrop"
                  />
                )}
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />

              <div className="absolute bottom-0 left-0 w-full px-8 pb-10 flex flex-col gap-6">
                <h2 className="text-4xl md:text-5xl font-black text-white drop-shadow-xl tracking-tight max-w-[80%] leading-none">
                  {details?.title || content?.title || content?.name}
                </h2>

                {/* --- BUTTONS CHỈNH SỬA: VUÔNG VỨC & TRANSPARENT --- */}
                <div className="flex items-center gap-3">
                  {/* Nút Xem ngay: Vuông vức (rounded-[2px]) */}
                  <button
                    onClick={handlePlay}
                    className="flex items-center gap-2 bg-white text-black h-[42px] px-8 rounded-[2px] font-bold text-base hover:bg-gray-200 transition active:scale-95"
                  >
                    <IoPlay size={24} /> Xem ngay
                  </button>
                  
                  {/* Nút Danh sách: Trong suốt, Viền mỏng, Vuông vức */}
                  <button
                    onClick={handleToggleList}
                    className="flex items-center gap-2 bg-transparent border border-gray-500 text-white h-[42px] px-8 rounded-[2px] font-bold text-base hover:bg-white/10 transition active:scale-95"
                  >
                    {isSaved ? <IoCheckmark size={24} /> : <IoAdd size={24} />}
                    {isSaved ? "Đã lưu" : "Danh sách"}
                  </button>

                  {trailer && (
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="w-10 h-10 border border-white/30 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:border-white transition ml-auto bg-black/30 backdrop-blur-sm"
                    >
                      {isMuted ? <IoVolumeMute size={20} /> : <IoVolumeHigh size={20} />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* === 2. INFO SECTION === */}
            <div className="px-8 py-8 grid grid-cols-1 md:grid-cols-[2.5fr_1.2fr] gap-8 bg-[#141414]">
              <div className="text-white space-y-4">
                <div className="flex items-center gap-3 text-sm flex-wrap">
                   <span className="bg-[#e5b53b] text-black text-xs font-bold px-1.5 py-0.5 rounded-[2px]">VIP</span>
                   <span className="text-gray-300 font-medium">{content.release_date?.substring(0, 4) || content.first_air_date?.substring(0, 4)}</span>
                   <span className="border border-gray-500 text-gray-300 px-1.5 text-xs h-[18px] flex items-center justify-center">{details?.adult ? "18+" : "13+"}</span>
                   <span className="text-gray-300">{details?.runtime ? `${Math.floor(details.runtime/60)}h ${details.runtime%60}ph` : "Unknown"}</span>
                   <span className="border border-gray-500 text-gray-300 px-1 text-[10px] h-[16px] flex items-center justify-center rounded-[2px]">HD</span>
                </div>
                <div className="flex items-center gap-2">
                   {renderStars(content.vote_average || 0)}
                   <span className="text-gray-400 text-xs mt-0.5">({content.vote_count} lượt)</span>
                </div>
                <p className="text-base text-gray-300 leading-relaxed font-light">
                  {details?.overview || content.overview || "Chưa có mô tả cho phim này."}
                </p>
              </div>

              <div className="text-sm space-y-3">
                <div className="flex flex-wrap gap-1">
                  <span className="text-[#777]">Diễn viên:</span>
                  <span className="text-white hover:underline cursor-pointer">{cast.map(c => c.name).join(", ")}</span>
                </div>
                {director && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[#777]">Đạo diễn:</span>
                    <span className="text-white hover:underline cursor-pointer">{director}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  <span className="text-[#777]">Thể loại:</span>
                  <span className="text-white">{details?.genres?.map(g => g.name).join(", ")}</span>
                </div>
              </div>
            </div>

            {/* === 3. SIMILAR SECTION (HORIZONTAL SCROLL) === */}
            {similar.length > 0 && (
              <div className="px-8 py-6 bg-[#141414] border-t border-gray-800/50">
                <h3 className="text-lg font-bold text-white mb-4">Đề xuất cho bạn</h3>
                
                {/* Container Scroll Ngang:
                  - flex: xếp ngang
                  - overflow-x-auto: cho phép scroll
                  - [&::-webkit-scrollbar]:hidden: ẩn thanh scrollbar (Tailwind arbitrary variant)
                */}
                <div className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden">
                  {similar.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => { closeModal(); setTimeout(() => navigate(`/player/${item.id}`), 300); }}
                      // Card: Vuông vức, trong suốt (bg-transparent), min-width cố định
                      className="min-w-[220px] w-[220px] bg-transparent rounded-[2px] overflow-hidden cursor-pointer group flex flex-col"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video relative overflow-hidden rounded-[2px]">
                        <img
                          src={getImageUrl(item.backdrop_path || item.poster_path, "w500")}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          alt={item.title}
                        />
                        {/* Rating góc trên phải */}
                        {item.vote_average > 0 && (
                          <div className="absolute top-1 right-1 text-[9px] font-bold bg-black/70 text-[#46d369] px-1 py-0.5 rounded-[2px]">
                            {Math.round(item.vote_average * 10)}%
                          </div>
                        )}
                        {/* Overlay Play */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/80 flex items-center justify-center">
                                <IoPlay className="text-white ml-0.5 text-sm" />
                            </div>
                        </div>
                      </div>
                      
                      {/* Info: Trong suốt, chữ nhỏ tinh tế */}
                      <div className="pt-2 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                             <h4 className="text-gray-200 text-sm font-medium line-clamp-1 group-hover:text-white transition">
                               {item.title || item.name}
                             </h4>
                          </div>
                          
                          <div className="flex items-center gap-2 text-[10px] text-gray-500">
                             <span>{item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4)}</span>
                             <span className="border border-gray-600 px-1 rounded-[2px]">HD</span>
                             <button className="ml-auto text-gray-400 hover:text-white">
                                <IoAdd size={16} />
                             </button>
                          </div>
                          
                          <p className="text-[#777] text-[11px] line-clamp-2 leading-relaxed mt-0.5">
                            {item.overview || "Mô tả đang cập nhật..."}
                          </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MovieModal;