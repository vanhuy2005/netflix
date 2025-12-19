import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { IoClose } from "react-icons/io5";

const PinEntryModal = ({ profile, onSuccess, onCancel }) => {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [isError, setIsError] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  // useIsMounted pattern to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Auto-focus first input
    inputRefs[0].current?.focus();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setIsError(false);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit when all filled
    if (index === 3 && value) {
      const enteredPin = newPin.join("");
      if (enteredPin === profile.pin) {
        onSuccess();
      } else {
        setIsError(true);
        const errorTimer = setTimeout(() => {
          if (isMountedRef.current) {
            setPin(["", "", "", ""]);
            if (inputRefs[0].current) {
              inputRefs[0].current.focus();
            }
          }
        }, 500);
        // Cleanup handled by component unmount
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: "none" }}
      className="fixed inset-0 z-[60] bg-[#141414] flex items-center justify-center"
    >
      <div className="text-center">
        {/* Avatar */}
        <motion.img
          src={profile.avatar}
          alt={profile.name}
          className="w-20 h-20 rounded-md mx-auto mb-6 opacity-80"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        />

        {/* Title */}
        <h2 className="text-2xl text-white font-medium mb-2">
          Hồ sơ "{profile.name}" đã bị khóa
        </h2>
        <p className="text-gray-400 text-lg mb-8">Nhập mã PIN để tiếp tục</p>

        {/* 4-Digit Input */}
        <motion.div
          animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex gap-4 justify-center mb-8"
        >
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-14 h-14 md:w-16 md:h-16 text-center text-3xl text-white bg-transparent border-2 rounded transition-all ${
                isError
                  ? "border-red-500"
                  : digit
                  ? "border-white scale-110"
                  : "border-gray-500"
              } focus:outline-none focus:border-white focus:scale-110`}
            />
          ))}
        </motion.div>

        {/* Error Message */}
        {isError && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mb-4"
          >
            Mã PIN không đúng. Vui lòng thử lại.
          </motion.p>
        )}

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-white transition-colors text-sm"
        >
          Quay lại
        </button>
      </div>
    </motion.div>
  );
};

export default PinEntryModal;
