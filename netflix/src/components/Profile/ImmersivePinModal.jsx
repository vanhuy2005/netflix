import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";
import { toast } from "react-toastify";

/**
 * ImmersivePinModal - Netflix Premium PIN Entry Experience
 *
 * Features:
 * - Full-screen backdrop blur overlay
 * - 4 large dots: ○ (empty gray) → ● (filled white with scale)
 * - Ghost input technique (zero lag)
 * - Visual feedback: Green success / Red shake error
 * - Auto-close on success
 * - Memory leak prevention with useIsMounted pattern
 * - Zombie overlay fix with pointerEvents: 'none' on exit
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onSuccess: (pin: string) => void
 * - title: string (e.g., "Nhập mã PIN")
 * - subtitle: string (optional)
 * - mode: 'VERIFY' | 'SET' | 'CHANGE'
 * - existingPin: string (for VERIFY mode)
 */
const ImmersivePinModal = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Nhập mã PIN",
  subtitle = "",
  mode = "SET",
  existingPin = null,
  onForgotPin = null,
}) => {
  const [pinValue, setPinValue] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef(null);

  // useIsMounted pattern to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Auto-focus on input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timer = setTimeout(() => {
        if (isMountedRef.current && inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Clear error animation after shake
  useEffect(() => {
    if (isError) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setIsError(false);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isError]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPinValue("");
      setIsError(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

  // Handle PIN input (Ghost Input Technique - Zero Lag)
  const handlePinChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
    setPinValue(val);
    if (isError) setIsError(false);

    // Auto-submit when 4 digits entered
    if (val.length === 4) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          submitPin(val);
        }
      }, 150);
      // Store timer ref for potential cleanup (handled by component lifecycle)
    }
  };

  // Submit PIN
  const submitPin = (enteredPin) => {
    // VERIFY mode: Check against existing PIN
    if (mode === "VERIFY" && existingPin) {
      if (enteredPin === existingPin) {
        handleSuccess(enteredPin);
      } else {
        handleError();
      }
    }
    // SET/CHANGE mode: Accept any 4-digit PIN
    else {
      handleSuccess(enteredPin);
    }
  };

  // Success flow
  const handleSuccess = (pin) => {
    if (!isMountedRef.current) return;

    setIsSuccess(true);

    // Green flash animation + callback
    const successTimer = setTimeout(() => {
      if (!isMountedRef.current) return;

      onSuccess(pin);

      // Only auto-close for VERIFY and SET modes
      // For CHANGE mode, parent will handle modal state
      if (mode !== "CHANGE") {
        const closeTimer = setTimeout(() => {
          if (isMountedRef.current) {
            onClose();
            setPinValue("");
            setIsSuccess(false);
          }
        }, 300);
        // Cleanup handled by component unmount
      } else {
        // CHANGE mode: Reset state but keep modal open for parent to control
        setPinValue("");
        setIsSuccess(false);
      }
    }, 400);
    // Cleanup handled by component unmount
  };

  // Error flow
  const handleError = () => {
    if (!isMountedRef.current) return;

    setIsError(true);
    setPinValue(""); // Reset input

    // Shake animation
    const errorTimer = setTimeout(() => {
      if (isMountedRef.current && inputRef.current) {
        inputRef.current.focus();
      }
    }, 400);
    // Cleanup handled by component unmount
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, pointerEvents: "none" }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md"
        >
          {/* Close Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            onClick={onClose}
            className="absolute top-8 right-8 p-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-full transition-colors"
          >
            <IoClose className="text-white text-2xl" />
          </motion.button>

          {/* Modal Content */}
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="flex flex-col items-center"
          >
            {/* Title */}
            <motion.h2
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-medium text-white mb-3"
            >
              {title}
            </motion.h2>

            {/* Subtitle */}
            {subtitle && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-gray-400 text-base font-light mb-12"
              >
                {subtitle}
              </motion.p>
            )}

            {/* PIN Dots Display - 4 Large Circles */}
            <div className="flex gap-6 mb-8">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = pinValue.length > index;
                const dotColor = isSuccess
                  ? "border-green-500 bg-green-500"
                  : isError
                  ? "border-red-500 bg-red-500"
                  : isFilled
                  ? "border-white bg-white"
                  : "border-gray-600 bg-transparent";

                return (
                  <motion.div
                    key={index}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 400,
                      damping: 20,
                    }}
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-4 flex items-center justify-center transition-all duration-200 ${dotColor} ${
                      isError ? "animate-shake" : ""
                    }`}
                  >
                    {/* Filled Dot */}
                    {isFilled && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.3, 1] }}
                        transition={{ duration: 0.3 }}
                        className={`w-6 h-6 rounded-full ${
                          isSuccess
                            ? "bg-green-400"
                            : isError
                            ? "bg-red-400"
                            : "bg-gray-900"
                        }`}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {isError && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-500 text-sm font-medium"
                >
                  Mã PIN không đúng. Vui lòng thử lại.
                </motion.p>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {isSuccess && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-green-500 text-sm font-medium"
                >
                  ✓ Thành công!
                </motion.p>
              )}
            </AnimatePresence>

            {/* Hidden Input (Ghost Input Technique) */}
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pinValue}
              onChange={handlePinChange}
              maxLength={4}
              autoComplete="off"
              className="absolute opacity-0 pointer-events-none"
              aria-label="PIN Entry"
            />
          </motion.div>

          {/* Hint Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-12 text-gray-500 text-sm font-light"
          >
            Nhập 4 chữ số để tiếp tục
          </motion.p>

          {/* Forgot PIN Link - Only show in VERIFY mode */}
          {mode === "VERIFY" && onForgotPin && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={onForgotPin}
              className="absolute bottom-4 text-white hover:underline text-sm font-light"
            >
              Bạn quên mã PIN?
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImmersivePinModal;
