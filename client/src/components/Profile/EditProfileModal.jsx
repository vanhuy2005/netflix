import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoClose,
  IoPencil,
  IoTrashOutline,
  IoLockClosed,
  IoArrowBack,
  IoWarning,
  IoEye,
  IoEyeOff,
  IoMale,
  IoFemale,
  IoHelpCircle,
} from "react-icons/io5";
import { NETFLIX_AVATARS } from "../../constants/avatars";
import { toast } from "react-toastify";
import { auth } from "../../config/firebase";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import PremiumAvatarPicker from "./PremiumAvatarPicker";
import PremiumToggleSwitch from "./PremiumToggleSwitch";
import ImmersivePinModal from "./ImmersivePinModal";

const EditProfileModal = ({ profile, onSave, onDelete, onCancel }) => {
  // ============= STATE MANAGEMENT =============

  // View States: 'MAIN' | 'PIN_ENTRY' | 'PASSWORD' | 'CONFIRM_DELETE'
  const [view, setView] = useState("MAIN");

  // PIN Flow: { action: 'SETUP'|'CHANGE'|'REMOVE'|'DELETE_PROFILE', step: 'VERIFY'|'SET' }
  const [pinFlow, setPinFlow] = useState({ action: null, step: null });

  // Form Data
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [gender, setGender] = useState(profile.gender || "other");
  const [isKid, setIsKid] = useState(profile.isKid || false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalMode, setPinModalMode] = useState("SET"); // SET | VERIFY | CHANGE

  // PIN Input (Ghost Input Technique)
  const [pinValue, setPinValue] = useState("");
  const [isError, setIsError] = useState(false);
  const inputRef = useRef(null);

  // Password Verification (Forgot PIN)
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // ============= EFFECTS =============

  // Auto-focus on PIN input when entering PIN screen
  useEffect(() => {
    if (view === "PIN_ENTRY" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [view]);

  // Clear error animation after shake
  useEffect(() => {
    if (isError) {
      const timer = setTimeout(() => setIsError(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isError]);

  // ============= PIN HANDLING (GHOST INPUT TECHNIQUE) =============

  // INSTANT PIN INPUT - No Lag, No Delay
  const handlePinChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
    setPinValue(val);
    if (isError) setIsError(false);

    // Auto-submit when 4 digits entered
    if (val.length === 4) {
      setTimeout(() => submitPin(val), 100); // Small delay for UX smoothness
    }
  };

  // PIN Submission Logic
  const submitPin = async (enteredPin) => {
    // CASE 1: Verifying existing PIN
    if (pinFlow.step === "VERIFY") {
      if (enteredPin === profile.pin) {
        // Correct PIN ✓
        setPinValue("");

        if (pinFlow.action === "CHANGE") {
          // Change flow: Move to SET step
          setPinFlow({ ...pinFlow, step: "SET" });
          toast.info("Nhập mã PIN mới (4 chữ số)");
        } else if (pinFlow.action === "REMOVE") {
          // Remove flow: Delete PIN immediately
          await onSave({ name, avatar, pin: null });
          toast.success("Đã gỡ bỏ mã PIN bảo vệ");
          setView("MAIN");
        } else if (pinFlow.action === "DELETE_PROFILE") {
          // Delete profile flow: Show final confirmation
          setView("CONFIRM_DELETE");
        }
      } else {
        // Wrong PIN ✗
        setIsError(true);
        setPinValue("");
        toast.error("Mã PIN không đúng. Vui lòng thử lại.");
        setTimeout(() => inputRef.current?.focus(), 300);
      }
    }
    // CASE 2: Setting new PIN
    else if (pinFlow.step === "SET") {
      await onSave({ name, avatar, pin: enteredPin });
      toast.success("Đã thiết lập mã PIN thành công!");
      setView("MAIN");
    }
  };

  // ============= FLOW INITIATORS =============

  const startAddPin = () => {
    setPinFlow({ action: "SETUP", step: "SET" });
    setPinValue("");
    setView("PIN_ENTRY");
  };

  const startChangePin = () => {
    setPinFlow({ action: "CHANGE", step: "VERIFY" });
    setPinValue("");
    setView("PIN_ENTRY");
  };

  const startRemovePin = () => {
    setPinFlow({ action: "REMOVE", step: "VERIFY" });
    setPinValue("");
    setView("PIN_ENTRY");
  };

  const startDeleteProfile = () => {
    if (profile.pin) {
      setPendingPinAction("DELETE");
      openPinModal("VERIFY");
    } else {
      setView("CONFIRM_DELETE");
    }
  };

  // ============= PASSWORD VERIFICATION (FORGOT PIN) =============

  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      toast.error("Vui lòng nhập mật khẩu");
      return;
    }

    setIsVerifying(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error("Không tìm thấy thông tin người dùng");
      }

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Password correct: Clear old PIN and allow setting new one
      setPassword("");
      setShowPassword(false);
      setView("MAIN");
      toast.success("Đã xác thực! Hãy đặt mã PIN mới.");

      // Open modal to set new PIN
      setPinModalMode("SET");
      setShowPinModal(true);
    } catch (error) {
      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        toast.error("Mật khẩu không đúng");
      } else {
        toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // ============= SAVE HANDLERS =============

  const handleSaveInfo = () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên hồ sơ");
      return;
    }
    // Save all form data and close modal
    onSave(
      {
        name: name.trim(),
        avatar,
        gender,
        isKid,
        pin: profile.pin,
      },
      true
    ); // Close modal after main save
  };

  const handleBackToMain = () => {
    setPinValue("");
    setPassword("");
    setShowPassword(false);
    setIsError(false);
    setPinFlow({ action: null, step: null });
    setPendingPinAction(null); // Reset pending action to prevent freeze
    setShowPinModal(false); // Close PIN modal if open
    setView("MAIN");
  };

  // ============= RENDER SCREENS =============

  // PIN Entry Screen (Ghost Input Overlay)
  const renderPinScreen = () => {
    const title =
      pinFlow.step === "VERIFY"
        ? "Nhập mã PIN hiện tại"
        : "Tạo mã PIN 4 chữ số";

    const subtitle =
      pinFlow.step === "VERIFY"
        ? "Xác thực để tiếp tục"
        : "Mã PIN này bảo vệ hồ sơ của bạn";

    return (
      <div className="absolute inset-0 bg-[#141414] z-50 flex flex-col items-center justify-center">
        {/* Back Button */}
        <button
          type="button"
          onClick={handleBackToMain}
          className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <IoArrowBack size={24} />
          <span className="text-sm">Quay lại</span>
        </button>

        {/* Lock Icon */}
        <IoLockClosed className="text-6xl text-gray-600 mb-6" />

        {/* Title & Subtitle */}
        <h3 className="text-white text-2xl md:text-3xl font-medium mb-2 text-center px-4">
          {title}
        </h3>
        <p className="text-gray-400 text-sm mb-10 text-center px-4">
          {subtitle}
        </p>

        {/* GHOST INPUT OVERLAY - The Key to Smooth Input */}
        <div className={`relative mb-6 ${isError ? "animate-shake" : ""}`}>
          {/* Hidden Real Input */}
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pinValue}
            onChange={handlePinChange}
            maxLength={4}
            autoComplete="off"
            className="absolute inset-0 w-full h-full opacity-0 cursor-default z-10"
            style={{ caretColor: "transparent" }}
          />

          {/* Visual Display: 4 Boxes */}
          <div className="flex gap-3 md:gap-4 pointer-events-none">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-3xl font-bold text-white border-2 rounded-md transition-colors duration-150
                  ${
                    isError
                      ? "border-red-600 bg-red-900/20"
                      : pinValue[index]
                      ? "border-white"
                      : "border-gray-600"
                  }`}
              >
                {pinValue[index] ? "●" : ""}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {isError && (
          <p className="text-red-500 text-sm mb-4">
            Mã PIN không đúng. Vui lòng thử lại.
          </p>
        )}

        {/* Helper Text */}
        <p className="text-gray-500 text-xs mb-4">Nhập 4 chữ số để tiếp tục</p>

        {/* Forgot PIN Link */}
        {pinFlow.step === "VERIFY" && (
          <button
            type="button"
            onClick={() => setView("PASSWORD")}
            className="text-white hover:underline text-sm"
          >
            Bạn quên mã PIN?
          </button>
        )}
      </div>
    );
  };

  // Password Verification Screen
  const renderPasswordScreen = () => (
    <div className="absolute inset-0 bg-[#141414] z-50 flex flex-col items-center justify-center p-8">
      {/* Back Button */}
      <button
        type="button"
        onClick={handleBackToMain}
        className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
      >
        <IoArrowBack size={24} />
        <span className="text-sm">Quay lại</span>
      </button>

      {/* Lock Icon */}
      <IoLockClosed className="text-6xl text-gray-600 mb-6" />

      {/* Title */}
      <h3 className="text-2xl text-white font-medium mb-2 text-center">
        Nhập mật khẩu tài khoản
      </h3>

      {/* Subtitle */}
      <p className="text-gray-400 text-sm mb-8 text-center max-w-md">
        Để đặt lại PIN, vui lòng xác thực bằng mật khẩu Netflix của bạn
      </p>

      {/* Password Input */}
      <div
        className="w-full max-w-md mb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleVerifyPassword()}
            placeholder="Mật khẩu"
            autoFocus
            className="w-full bg-[#333] text-white px-4 py-3 pr-12 rounded text-lg outline-none focus:bg-[#444] transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showPassword ? <IoEyeOff size={24} /> : <IoEye size={24} />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleVerifyPassword}
        disabled={isVerifying || !password.trim()}
        className="w-full max-w-md px-12 py-3 bg-white text-black font-bold text-lg hover:bg-netflix-red hover:text-white transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isVerifying ? "Đang xác thực..." : "Tiếp tục"}
      </button>
    </div>
  );

  // Confirm Delete Screen
  const renderDeleteConfirm = () => (
    <div className="absolute inset-0 bg-[#141414] z-50 flex flex-col items-center justify-center p-8">
      {/* Warning Icon */}
      <div className="w-20 h-20 rounded-full bg-red-600/20 flex items-center justify-center mb-6">
        <IoWarning className="text-5xl text-red-500" />
      </div>

      {/* Profile Avatar */}
      <img
        src={avatar}
        alt={name}
        className="w-24 h-24 rounded-md mb-4 opacity-60"
      />

      {/* Title */}
      <h2 className="text-2xl md:text-3xl text-white font-medium mb-2 text-center">
        Xóa hồ sơ "{name}"?
      </h2>

      {/* Warning Text */}
      <p className="text-gray-400 text-center mb-8 max-w-md">
        Hành động này không thể hoàn tác. Tất cả dữ liệu của hồ sơ sẽ bị xóa
        vĩnh viễn.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
        <button
          type="button"
          onClick={handleBackToMain}
          className="flex-1 px-8 py-4 bg-transparent border-2 border-gray-600 text-gray-300 font-bold text-lg hover:border-white hover:text-white transition-all rounded"
        >
          Giữ lại hồ sơ
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 px-8 py-4 bg-red-600 text-white font-bold text-lg hover:bg-red-700 transition-all rounded"
        >
          Xóa hồ sơ
        </button>
      </div>
    </div>
  );

  // ============= PIN HANDLERS WITH VERIFICATION FLOW =============

  // State for multi-step PIN flows
  const [pendingPinAction, setPendingPinAction] = useState(null); // 'CHANGE' | 'REMOVE' | 'DELETE'

  const handleSetPin = (pin) => {
    onSave(
      {
        name: name.trim(),
        avatar,
        gender,
        isKid,
        pin: pin,
      },
      false
    ); // Keep modal open
    setPendingPinAction(null);
  };

  const handleChangePin = (newPin) => {
    onSave(
      {
        name: name.trim(),
        avatar,
        gender,
        isKid,
        pin: newPin,
      },
      false
    ); // Keep modal open
    setPendingPinAction(null);
  };

  const handleRemovePin = () => {
    onSave(
      {
        name: name.trim(),
        avatar,
        gender,
        isKid,
        pin: null,
      },
      false
    ); // Keep modal open
    setPendingPinAction(null);
  };

  const openPinModal = (mode) => {
    setPinModalMode(mode);
    setShowPinModal(true);
  };

  // Handle PIN modal success based on mode
  const handlePinModalSuccess = (pin) => {
    if (pinModalMode === "SET") {
      handleSetPin(pin);
      setShowPinModal(false);
      setPendingPinAction(null);
    } else if (pinModalMode === "VERIFY") {
      // After verification, execute pending action
      if (pendingPinAction === "CHANGE") {
        // Verification passed, now set new PIN
        setPinModalMode("CHANGE");
        toast.info("Nhập mã PIN mới (4 chữ số)");
        // Keep modal open, don't close
        return;
      } else if (pendingPinAction === "REMOVE") {
        // Verification passed, remove PIN
        handleRemovePin();
        setShowPinModal(false);
        setPendingPinAction(null);
      } else if (pendingPinAction === "DELETE") {
        // Verification passed, show delete confirmation
        setShowPinModal(false);
        setPendingPinAction(null);
        setView("CONFIRM_DELETE");
      }
    } else if (pinModalMode === "CHANGE") {
      handleChangePin(pin);
      setShowPinModal(false);
      setPendingPinAction(null);
    }
  }; // ============= MAIN RENDER - NETFLIX PREMIUM FULLSCREEN =============

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: "none" }}
      className="fixed inset-0 z-50 bg-[#141414] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800/20 via-[#141414] to-[#0a0a0a] flex items-center justify-center overflow-y-auto p-4"
      onClick={onCancel}
    >
      {/* ===== SUB-SCREENS (Legacy - Keeping for delete confirm) ===== */}
      {view === "PASSWORD" && renderPasswordScreen()}
      {view === "CONFIRM_DELETE" && renderDeleteConfirm()}

      {/* ===== MAIN EDIT SCREEN ===== */}
      {view === "MAIN" && (
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl min-h-[600px] flex flex-col"
        >
          {/* Header - Large & Thin Typography */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-light text-white mb-3">
              Chỉnh sửa hồ sơ
            </h1>
            <p className="text-gray-500 text-base font-light">
              Tùy chỉnh thông tin và cài đặt cá nhân
            </p>
          </div>

          {/* Main Content - 2 COLUMN LAYOUT */}
          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">
            {/* LEFT COLUMN: Avatar Hero with Deep Shadow */}
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
                  src={avatar}
                  alt={name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Edit Icon - Bottom Right Corner */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-3 right-3 w-10 h-10 bg-black/80 backdrop-blur-sm rounded-full border-2 border-white flex items-center justify-center"
                >
                  <IoPencil className="text-white text-lg" />
                </motion.div>
              </motion.div>

              <button
                type="button"
                onClick={() => setShowAvatarPicker(true)}
                className="mt-5 text-gray-500 hover:text-white transition-colors text-sm font-light"
              >
                Chọn biểu tượng
              </button>
            </div>

            {/* RIGHT COLUMN: Form Controls - Clean & Spacious */}
            <div className="flex-1 space-y-6">
              {/* Name Input - Border Bottom Style */}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                placeholder="Nhập tên hồ sơ"
                className="w-full bg-transparent text-white text-xl px-0 py-3 border-b-2 border-gray-700 outline-none transition-all placeholder:text-gray-600 focus:border-white"
              />

              {/* Gender Selection - Minimal Pills */}
              {!isKid && (
                <div className="flex gap-3">
                  {[
                    { value: "male", icon: IoMale, label: "Nam" },
                    { value: "female", icon: IoFemale, label: "Nữ" },
                    { value: "other", icon: IoHelpCircle, label: "Khác" },
                  ].map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => setGender(option.value)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all ${
                        gender === option.value
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
                </div>
              )}

              {/* Settings Group - Premium Style */}
              <div className="space-y-4 pt-4">
                {/* Kids Mode - Toggle Switch Row */}
                <motion.div
                  whileHover={{ backgroundColor: "rgba(42, 42, 42, 0.5)" }}
                  className="w-full p-5 bg-[#2a2a2a]/30 rounded-md flex items-start justify-between transition-all cursor-pointer"
                  onClick={() => setIsKid(!isKid)}
                >
                  <div className="flex-1">
                    <p className="text-white font-normal mb-1">Trẻ em?</p>
                    <p className="text-gray-500 text-xs font-light">
                      Chỉ hiển thị nội dung dành cho trẻ em 12+
                    </p>
                  </div>
                  <div
                    className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${
                      isKid ? "bg-green-500" : "bg-gray-600"
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
                        isKid ? "left-6" : "left-0.5"
                      }`}
                    />
                  </div>
                </motion.div>

                {/* PIN Lock - Settings Row (Opens Modal) */}
                <motion.button
                  type="button"
                  onClick={() => {
                    if (!profile.pin) {
                      openPinModal("SET");
                    } else {
                      openPinModal("VERIFY");
                    }
                  }}
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
                        profile.pin ? "text-green-500" : "text-gray-500"
                      }`}
                    >
                      {profile.pin ? "Đã bật" : "Đang tắt"}
                    </span>
                    <span className="text-gray-600 text-lg">›</span>
                  </div>
                </motion.button>

                {/* PIN Actions (When PIN exists) */}
                {profile.pin && (
                  <div className="flex gap-3 pl-4">
                    <button
                      type="button"
                      onClick={() => {
                        setPendingPinAction("CHANGE");
                        openPinModal("VERIFY");
                      }}
                      className="text-sm text-gray-500 hover:text-white transition-colors font-light"
                    >
                      Đổi mã PIN
                    </button>
                    <span className="text-gray-700">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingPinAction("REMOVE");
                        openPinModal("VERIFY");
                      }}
                      className="text-sm text-gray-500 hover:text-white transition-colors font-light"
                    >
                      Gỡ bỏ
                    </button>
                    <span className="text-gray-700">•</span>
                    <button
                      type="button"
                      onClick={() => setView("PASSWORD")}
                      className="text-sm text-gray-500 hover:text-white transition-colors font-light"
                    >
                      Quên PIN?
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions - Netflix Design System */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-[#2a2a2a]">
            {/* Delete Profile - Ghost Red */}
            <motion.button
              type="button"
              onClick={startDeleteProfile}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 border border-gray-500 text-gray-500 font-medium text-sm uppercase tracking-widest hover:border-red-600 hover:text-red-600 transition-colors duration-300 rounded-sm flex items-center gap-2"
            >
              <IoTrashOutline className="text-base" />
              <span>Xóa hồ sơ</span>
            </motion.button>

            {/* Save/Cancel */}
            <div className="flex gap-4">
              <motion.button
                type="button"
                onClick={onCancel}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-2.5 bg-transparent border border-gray-500 text-gray-500 font-medium text-base uppercase tracking-widest hover:border-white hover:text-white transition-colors duration-300 rounded-sm"
              >
                Hủy
              </motion.button>
              <motion.button
                type="button"
                onClick={handleSaveInfo}
                disabled={!name.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-2.5 bg-white text-black font-bold text-base uppercase tracking-widest hover:bg-[#E50914] hover:text-white transition-colors duration-300 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Lưu
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Premium Avatar Picker Modal */}
      <PremiumAvatarPicker
        isOpen={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        selectedAvatar={
          NETFLIX_AVATARS.find((av) => av.url === avatar) || NETFLIX_AVATARS[0]
        }
        onSelect={(av) => {
          setAvatar(av.url);
          setShowAvatarPicker(false);
        }}
      />

      {/* Immersive PIN Modal */}
      <AnimatePresence>
        {showPinModal && (
          <ImmersivePinModal
            isOpen={showPinModal}
            onClose={() => {
              setShowPinModal(false);
              setPendingPinAction(null);
            }}
            onSuccess={handlePinModalSuccess}
            title={
              pinModalMode === "SET"
                ? "Thiết lập mã PIN"
                : pinModalMode === "CHANGE"
                ? "Nhập mã PIN mới"
                : "Nhập mã PIN hiện tại"
            }
            subtitle={
              pinModalMode === "SET"
                ? "Nhập 4 chữ số để bảo vệ hồ sơ"
                : pinModalMode === "CHANGE"
                ? "Tạo mã PIN mới (4 chữ số)"
                : pendingPinAction === "CHANGE"
                ? "Xác thực để thay đổi mã PIN"
                : pendingPinAction === "REMOVE"
                ? "Xác thực để gỡ bỏ mã PIN"
                : "Xác thực để tiếp tục"
            }
            mode={pinModalMode === "VERIFY" ? "VERIFY" : "SET"}
            existingPin={pinModalMode === "VERIFY" ? profile.pin : null}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EditProfileModal;
