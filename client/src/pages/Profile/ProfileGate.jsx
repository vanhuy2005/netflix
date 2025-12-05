import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  IoAddCircle,
  IoCheckmarkCircle,
  IoTrashOutline,
  IoPencilOutline,
  IoLockClosed,
  IoMale,
  IoFemale,
  IoHelpCircle,
} from "react-icons/io5";
import { auth, db, deleteProfile, updateProfile } from "../../config/firebase";
import { NETFLIX_AVATARS } from "../../constants/avatars";
import { toast } from "react-toastify";
import EditProfileModal from "../../components/Profile/EditProfileModal";
import PinEntryModal from "../../components/Profile/PinEntryModal";
import PremiumAvatarPicker from "../../components/Profile/PremiumAvatarPicker";
import PremiumToggleSwitch from "../../components/Profile/PremiumToggleSwitch";
import ImmersivePinModal from "../../components/Profile/ImmersivePinModal";

const ProfileGate = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  // New Profile Form State
  const [newProfileName, setNewProfileName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(NETFLIX_AVATARS[0]);
  const [newProfileGender, setNewProfileGender] = useState("other"); // male, female, other
  const [newProfileIsKid, setNewProfileIsKid] = useState(false);
  const [newProfilePin, setNewProfilePin] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const [editingProfile, setEditingProfile] = useState(null);
  const [unlockingProfile, setUnlockingProfile] = useState(null);
  const navigate = useNavigate();

  // Fetch profiles from Firestore
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!auth.currentUser) {
        navigate("/login");
        return;
      }

      try {
        const profilesRef = collection(
          db,
          `users/${auth.currentUser.uid}/profiles`
        );
        const snapshot = await getDocs(profilesRef);
        const profilesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProfiles(profilesData);

        // If no profiles exist, auto-switch to create mode
        if (profilesData.length === 0) {
          setIsCreating(true);
        }
      } catch (error) {
        console.error("Error fetching profiles:", error);
        toast.error("Không thể tải danh sách hồ sơ");
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [navigate]);

  // Handle profile click (selection or edit)
  const handleProfileClick = (profile) => {
    // If in manage mode, open edit modal
    if (isManaging) {
      setEditingProfile(profile);
      return;
    }

    // If profile has PIN, show PIN entry modal
    if (profile.pin) {
      setUnlockingProfile(profile);
      return;
    }

    // Otherwise, directly select profile
    handleProfileSelect(profile);
  };

  // Handle profile selection (after PIN verification if needed)
  const handleProfileSelect = (profile) => {
    // Save to localStorage
    localStorage.setItem("current_profile", JSON.stringify(profile));

    // Dispatch custom event to notify App.tsx of profile change
    window.dispatchEvent(new Event("profileChanged"));

    // Navigate to browse
    navigate("/browse");
    toast.success(`Chào mừng, ${profile.name}!`);
  };

  // Handle delete profile (NO event parameter - direct call)
  const handleDeleteProfile = async (profile) => {
    // Prevent deleting last profile
    if (profiles.length === 1) {
      toast.error("Không thể xóa hồ sơ duy nhất. Phải có ít nhất 1 hồ sơ.");
      return;
    }

    try {
      // Check if deleting current profile
      const currentProfile = localStorage.getItem("current_profile");
      const isCurrentProfile =
        currentProfile && JSON.parse(currentProfile).id === profile.id;

      // Delete from Firestore
      const success = await deleteProfile(auth.currentUser, profile.id);

      if (success) {
        // Update local state
        setProfiles(profiles.filter((p) => p.id !== profile.id));

        // Clear localStorage if deleting current profile
        if (isCurrentProfile) {
          localStorage.removeItem("current_profile");
          window.dispatchEvent(new Event("profileChanged"));
        }
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
    }
  };

  // Handle create new profile
  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error("Vui lòng nhập tên hồ sơ");
      return;
    }

    if (!auth.currentUser) {
      toast.error("Phiên đăng nhập đã hết hạn");
      navigate("/login");
      return;
    }

    try {
      const profilesRef = collection(
        db,
        `users/${auth.currentUser.uid}/profiles`
      );
      const newProfile = {
        name: newProfileName.trim(),
        avatar: selectedAvatar.url,
        avatarId: selectedAvatar.id,
        gender: newProfileGender,
        isKid: newProfileIsKid,
        pin: newProfilePin || null,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(profilesRef, newProfile);

      // Add to local state
      const createdProfile = {
        id: docRef.id,
        ...newProfile,
      };
      setProfiles([...profiles, createdProfile]);

      // Reset form
      setNewProfileName("");
      setSelectedAvatar(NETFLIX_AVATARS[0]);
      setNewProfileGender("other");
      setNewProfileIsKid(false);
      setNewProfilePin("");
      setIsCreating(false);

      toast.success("Tạo hồ sơ thành công!");
    } catch (error) {
      console.error("Error creating profile:", error);
      toast.error("Không thể tạo hồ sơ. Vui lòng thử lại.");
    }
  };

  // Handle save profile from EditProfileModal
  // shouldCloseModal: true = Close modal after save (default), false = Keep modal open
  const handleSaveProfile = async (updates, shouldCloseModal = true) => {
    if (!editingProfile) return;

    try {
      await updateProfile(auth.currentUser, editingProfile.id, updates);

      // Update local state
      setProfiles(
        profiles.map((p) =>
          p.id === editingProfile.id ? { ...p, ...updates } : p
        )
      );

      // Update localStorage if editing current profile
      const currentProfile = localStorage.getItem("current_profile");
      if (currentProfile) {
        const current = JSON.parse(currentProfile);
        if (current.id === editingProfile.id) {
          localStorage.setItem(
            "current_profile",
            JSON.stringify({ ...current, ...updates })
          );
          window.dispatchEvent(new Event("profileChanged"));
        }
      }

      // Smart modal closing: Only close if requested
      if (shouldCloseModal) {
        setEditingProfile(null);
        toast.success("Cập nhật hồ sơ thành công!");
      } else {
        // Keep modal open but refresh editingProfile state with latest data
        setEditingProfile({ ...editingProfile, ...updates });
        toast.success("Đã cập nhật!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Không thể cập nhật hồ sơ");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#141414] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-netflix-red"></div>
      </div>
    );
  }

  // Create Profile Mode - PREMIUM FULLSCREEN UI (NETFLIX/VIEON STANDARD)
  if (isCreating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-screen h-screen bg-[#141414] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800/20 via-[#141414] to-[#0a0a0a] flex items-center justify-center overflow-y-auto"
      >
        <div className="flex flex-col items-center justify-center px-6 py-12 max-w-5xl w-full">
          {/* Header - Large & Thin Typography */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-light text-white mb-3">
              Thêm hồ sơ
            </h1>
            <p className="text-gray-500 text-base font-light">
              Cá nhân hóa trải nghiệm cho từng thành viên trong gia đình
            </p>
          </motion.div>

          {/* Main Form Container - 2 COLUMN LAYOUT (VIEON/NETFLIX STANDARD) */}
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
            className="w-full flex flex-col md:flex-row gap-10 md:gap-16 items-start"
          >
            {/* LEFT COLUMN: Hero Avatar with Deep Shadow */}
            <div className="flex flex-col items-center md:items-start">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                onClick={() => setShowAvatarPicker(true)}
                className="relative w-52 h-52 rounded-lg overflow-hidden cursor-pointer group shadow-2xl"
                style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)" }}
              >
                <img
                  src={selectedAvatar.url}
                  alt={selectedAvatar.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = selectedAvatar.fallback;
                  }}
                />

                {/* Edit Icon - Bottom Right Corner (4-5 o'clock position) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-3 right-3 w-10 h-10 bg-black/80 backdrop-blur-sm rounded-full border-2 border-white flex items-center justify-center"
                >
                  <IoPencilOutline className="text-white text-lg" />
                </motion.div>
              </motion.div>

              <motion.button
                type="button"
                onClick={() => setShowAvatarPicker(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-5 text-gray-500 hover:text-white transition-colors text-sm font-light"
              >
                Chọn biểu tượng
              </motion.button>
            </div>

            {/* RIGHT COLUMN: Form Controls - Clean & Spacious */}
            <div className="flex-1 space-y-6">
              {/* Name Input - Border Bottom Style */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleCreateProfile()}
                  placeholder="Nhập tên hồ sơ"
                  maxLength={20}
                  autoFocus
                  className="w-full bg-transparent text-white text-xl px-0 py-3 border-b-2 border-gray-700 outline-none transition-all placeholder:text-gray-600 focus:border-white"
                />
              </motion.div>

              {/* Gender Selection - Minimal Pills */}
              {!newProfileIsKid && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="flex gap-3"
                >
                  {[
                    { value: "male", icon: IoMale, label: "Nam" },
                    { value: "female", icon: IoFemale, label: "Nữ" },
                    { value: "other", icon: IoHelpCircle, label: "Khác" },
                  ].map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => setNewProfileGender(option.value)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all ${
                        newProfileGender === option.value
                          ? "bg-white text-black"
                          : "bg-[#2a2a2a] text-gray-400 hover:bg-[#333]"
                      }`}
                    >
                      <option.icon className="text-lg" />
                      <span className="font-normal text-sm">
                        {option.label}
                      </span>
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {/* Settings Group - Premium Style */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-4 pt-4"
              >
                {/* Kids Mode - Toggle Switch Row */}
                <motion.div
                  whileHover={{ backgroundColor: "rgba(42, 42, 42, 0.5)" }}
                  className="w-full p-5 bg-[#2a2a2a]/30 rounded-md flex items-start justify-between transition-all cursor-pointer"
                  onClick={() => setNewProfileIsKid(!newProfileIsKid)}
                >
                  <div className="flex-1">
                    <p className="text-white font-normal mb-1">Trẻ em?</p>
                    <p className="text-gray-500 text-xs font-light">
                      Chỉ hiển thị nội dung dành cho trẻ em 12+
                    </p>
                  </div>
                  <div
                    className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${
                      newProfileIsKid ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    <motion.div
                      layout
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md ${
                        newProfileIsKid ? "left-6" : "left-0.5"
                      }`}
                    />
                  </div>
                </motion.div>

                {/* PIN Lock - Settings Row (Opens Modal) */}
                <motion.button
                  type="button"
                  onClick={() => setShowPinModal(true)}
                  whileHover={{ backgroundColor: "rgba(42, 42, 42, 0.5)" }}
                  className="w-full p-5 bg-[#2a2a2a]/30 rounded-md flex items-center justify-between transition-all group text-left"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <IoLockClosed className="text-xl text-gray-400 group-hover:text-white transition-colors mt-0.5" />
                    <div>
                      <p className="text-white font-normal mb-1">
                        Cài đặt mã khóa
                      </p>
                      <p className="text-gray-500 text-xs font-light">
                        Bảo vệ hồ sơ bằng mã PIN 4 chữ số
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-sm font-light ${
                        newProfilePin ? "text-green-500" : "text-gray-500"
                      }`}
                    >
                      {newProfilePin ? "Đã bật" : "Đang tắt"}
                    </span>
                    <span className="text-gray-600 text-lg">›</span>
                  </div>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>

          {/* Action Buttons - Netflix Design System */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-4 mt-12 w-full max-w-5xl"
          >
            <motion.button
              type="button"
              onClick={handleCreateProfile}
              disabled={!newProfileName.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-2.5 bg-white text-black font-bold text-base uppercase tracking-widest hover:bg-[#E50914] hover:text-white transition-colors duration-300 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Tiếp tục
            </motion.button>

            {profiles.length > 0 && (
              <motion.button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewProfileName("");
                  setSelectedAvatar(NETFLIX_AVATARS[0]);
                  setNewProfileGender("other");
                  setNewProfileIsKid(false);
                  setNewProfilePin("");
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-2.5 bg-transparent border border-gray-500 text-gray-500 font-medium text-base uppercase tracking-widest hover:border-white hover:text-white transition-colors duration-300 rounded-sm"
              >
                Hủy
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* Modals */}
        <PremiumAvatarPicker
          isOpen={showAvatarPicker}
          onClose={() => setShowAvatarPicker(false)}
          selectedAvatar={selectedAvatar}
          onSelect={(avatar) => {
            setSelectedAvatar(avatar);
            setShowAvatarPicker(false);
          }}
        />

        <ImmersivePinModal
          isOpen={showPinModal}
          onClose={() => setShowPinModal(false)}
          onSuccess={(pin) => {
            setNewProfilePin(pin);
            toast.success("Đã thiết lập mã PIN bảo vệ");
          }}
          title="Thiết lập mã PIN"
          subtitle="Nhập 4 chữ số để bảo vệ hồ sơ này"
          mode="SET"
        />
      </motion.div>
    );
  }

  // Profile Selection Mode (Main View) - PREMIUM SPOTLIGHT BACKGROUND
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-screen h-screen bg-[#141414] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800/20 via-[#141414] to-[#0a0a0a] flex flex-col items-center justify-center"
    >
      <div className="max-w-6xl w-full px-8">
        {/* Title - Large & Thin Typography */}
        <motion.h1
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          className="text-5xl md:text-6xl font-light text-white text-center mb-14 md:mb-20"
        >
          {isManaging ? "Quản lý hồ sơ" : "Ai đang xem?"}
        </motion.h1>

        {/* Profile Grid - Wider Spacing */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-12 mb-16"
        >
          {profiles.map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.4 + index * 0.08,
                type: "spring",
                stiffness: 200,
                damping: 18,
              }}
              whileHover={{ scale: isManaging ? 1.05 : 1.1, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleProfileClick(profile)}
              className="group cursor-pointer relative"
            >
              {/* Avatar Container - Larger with Deep Shadow */}
              <div
                className={`relative w-32 h-32 md:w-40 md:h-40 rounded-md overflow-hidden transition-all duration-300 ${
                  isManaging
                    ? "border-2 border-gray-700 group-hover:border-netflix-red"
                    : "border-4 border-transparent group-hover:border-white"
                }`}
                style={{ boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)" }}
              >
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    isManaging
                      ? "brightness-75 group-hover:brightness-50"
                      : "brightness-90 group-hover:brightness-110"
                  }`}
                />

                {/* PIN Lock Indicator */}
                {!isManaging && profile.pin && (
                  <div className="absolute bottom-1 right-1 bg-black/80 rounded p-1">
                    <IoLockClosed className="text-white text-base md:text-xl" />
                  </div>
                )}

                {/* Manage Mode Overlay - PENCIL ICON */}
                {isManaging && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center"
                  >
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      className="text-white"
                    >
                      <IoPencilOutline className="text-5xl md:text-6xl" />
                    </motion.div>
                  </motion.div>
                )}
              </div>

              {/* Name - Larger Text */}
              <p
                className={`text-center mt-5 transition-all duration-300 text-lg md:text-xl font-normal ${
                  isManaging
                    ? "text-gray-500 group-hover:text-netflix-red"
                    : "text-gray-400 group-hover:text-white"
                }`}
              >
                {profile.name}
              </p>
            </motion.div>
          ))}

          {/* Add Profile Button - Hide in Manage Mode */}
          {!isManaging && profiles.length < 5 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.4 + profiles.length * 0.08,
                type: "spring",
                stiffness: 200,
                damping: 18,
              }}
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreating(true)}
              className="group cursor-pointer"
            >
              {/* Add Icon - Larger */}
              <div
                className="relative w-32 h-32 md:w-40 md:h-40 rounded-md bg-[#2a2a2a]/50 border-4 border-transparent group-hover:border-white transition-all duration-300 flex items-center justify-center"
                style={{ boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)" }}
              >
                <IoAddCircle className="text-gray-600 group-hover:text-white transition-colors text-7xl md:text-8xl" />
              </div>

              {/* Label - Larger Text */}
              <p className="text-center mt-5 text-gray-400 group-hover:text-white transition-colors duration-300 text-lg md:text-xl font-normal">
                Thêm hồ sơ
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Manage Profiles Button - Premium Style */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex justify-center mt-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsManaging(!isManaging)}
            className={`px-8 py-2.5 uppercase tracking-widest text-sm font-bold rounded-sm transition-colors duration-300 ${
              isManaging
                ? "bg-white text-black hover:bg-[#E50914] hover:text-white"
                : "bg-transparent border border-gray-500 text-gray-500 hover:border-white hover:text-white"
            }`}
          >
            {isManaging ? "Hoàn tất" : "Quản lý hồ sơ"}
          </motion.button>
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence mode="wait">
        {/* Edit Profile Modal */}
        {editingProfile && (
          <EditProfileModal
            profile={editingProfile}
            onSave={handleSaveProfile}
            onDelete={async () => {
              await handleDeleteProfile(editingProfile);
              setEditingProfile(null);
            }}
            onCancel={() => setEditingProfile(null)}
          />
        )}

        {/* PIN Entry Modal */}
        {unlockingProfile && (
          <PinEntryModal
            profile={unlockingProfile}
            onSuccess={() => {
              handleProfileSelect(unlockingProfile);
              setUnlockingProfile(null);
            }}
            onCancel={() => setUnlockingProfile(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProfileGate;
