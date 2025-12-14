import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoArrowBack, IoCheckmarkCircle } from "react-icons/io5";
import { getAvatarsByCategory } from "../../constants/avatars";

const PremiumAvatarPicker = ({ isOpen, onClose, selectedAvatar, onSelect }) => {
  const categories = [
    { id: "classic", name: "Kinh điển", icon: "🎭" },
    { id: "fun", name: "Vui nhộn", icon: "🎉" },
    { id: "kids", name: "Trẻ em", icon: "🧸" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#181818] w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden"
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)' }}
          >
            {/* Header - Library Style */}
            <div className="relative p-8 pb-6 border-b border-[#2a2a2a]">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-400 hover:text-white transition-all"
              >
                <IoClose className="text-2xl" />
              </button>

              <motion.h2
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl text-white font-light mb-2"
              >
                Chọn biểu tượng
              </motion.h2>
              <motion.p
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-gray-500 text-sm font-light"
              >
                Chọn một biểu tượng để tùy chỉnh hồ sơ của bạn
              </motion.p>
            </div>

            {/* Body - Library Sections with Generous Spacing */}
            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #1a1a1a;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #3a3a3a;
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #4a4a4a;
                }
              `}</style>
              {categories.map((category, categoryIndex) => {
                const avatars = getAvatarsByCategory(category.id);

                return (
                  <motion.section
                    key={category.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + categoryIndex * 0.1 }}
                    className="mb-10 last:mb-0"
                  >
                    {/* Section Title - Clean & Modern */}
                    <div className="mb-5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        <h3 className="text-xl font-normal text-white">
                          {category.name}
                        </h3>
                      </div>
                    </div>

                    {/* Avatar Grid - Wide Spacing */}
                    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-5">
                      {avatars.map((avatar, index) => {
                        const isSelected = selectedAvatar?.id === avatar.id;

                        return (
                          <motion.button
                            key={avatar.id}
                            type="button"
                            onClick={() => onSelect(avatar)}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              delay: 0.3 + categoryIndex * 0.1 + index * 0.02,
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            }}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative aspect-square rounded-md overflow-hidden transition-all duration-200 ${
                              isSelected
                                ? "ring-4 ring-white shadow-2xl"
                                : "ring-0 hover:ring-3 hover:ring-gray-500"
                            }`}
                            style={isSelected ? { boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)' } : {}}
                          >
                            {/* Avatar Image */}
                            <img
                              src={avatar.url}
                              alt={avatar.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = avatar.fallback;
                              }}
                            />

                            {/* Selected Checkmark - Larger & More Visible */}
                            <AnimatePresence>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 20,
                                  }}
                                  className="absolute inset-0 bg-black/40 flex items-center justify-center"
                                >
                                  <IoCheckmarkCircle className="text-white text-4xl drop-shadow-lg" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.section>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PremiumAvatarPicker;
