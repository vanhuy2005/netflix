import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa";

const SignupStep1 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromLanding = location.state?.email || "";
  const [email] = useState(emailFromLanding);
  const [doNotEmail, setDoNotEmail] = useState(false);

  const handleSendLink = () => {
    // Navigate to step 2 với email
    navigate("/signup/step2", { state: { email, doNotEmail } });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-8 py-4">
        <img
          src="/assets/logo.png"
          alt="Netflix"
          className="h-10 cursor-pointer"
          onClick={() => navigate("/")}
        />
      </header>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Device Icons */}
          <div className="flex justify-center gap-4 mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-16 border-2 border-netflix-red rounded flex items-end justify-center p-2"
            >
              <div className="w-full h-1 bg-netflix-red rounded" />
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="w-24 h-16 border-2 border-netflix-red rounded relative"
            >
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-netflix-red" />
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="flex gap-2"
            >
              <div className="w-12 h-16 border-2 border-netflix-red rounded" />
              <div className="w-8 h-12 border-2 border-netflix-red rounded self-end" />
            </motion.div>
          </div>

          {/* Step Indicator */}
          <p className="text-sm text-gray-600 mb-2">Step 1 of 3</p>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Finish setting up your account
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-700 mb-6">
            We'll send a sign-up link to{" "}
            <span className="font-semibold text-gray-900">{email}</span>, so you
            can use Netflix without a password on any device at any time.
          </p>

          {/* Checkbox */}
          <label className="flex items-start gap-3 mb-8 cursor-pointer group">
            <input
              type="checkbox"
              checked={doNotEmail}
              onChange={(e) => setDoNotEmail(e.target.checked)}
              className="mt-1 w-5 h-5 border-2 border-gray-400 rounded cursor-pointer accent-netflix-red"
            />
            <span className="text-gray-700 group-hover:text-gray-900 transition">
              Please do not email me Netflix special offers.
            </span>
          </label>

          {/* Send Link Button */}
          <motion.button
            onClick={handleSendLink}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-netflix-red hover:bg-netflix-redHover text-white text-xl font-semibold py-4 rounded transition-colors shadow-lg"
          >
            Send link
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupStep1;
