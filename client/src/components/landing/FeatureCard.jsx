import React from "react";
import { motion } from "framer-motion";

const FeatureCard = ({ title, description, icon: Icon, gradient }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -8 }}
      className={`${gradient} rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group cursor-pointer min-h-[240px]`}
    >
      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
          {title}
        </h3>
        <p className="text-sm md:text-base text-gray-400 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Icon */}
      <div className="relative z-10 flex justify-end mt-4">
        <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-[#ff0a54] to-[#ff477e] group-hover:scale-110 transition-transform duration-300">
          <Icon className="text-3xl md:text-4xl text-white" />
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-netflix-red/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};

export default FeatureCard;
