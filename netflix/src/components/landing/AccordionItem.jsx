import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaMinus } from "react-icons/fa";

const AccordionItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="mb-2">
      <button
        onClick={onClick}
        className="w-full bg-[#2d2d2d] hover:bg-[#414141] text-white p-6 md:p-8 text-left text-xl md:text-2xl font-medium flex items-center justify-between transition-colors duration-200 rounded-sm"
      >
        <span>{question}</span>
        {isOpen ? (
          <FaMinus className="text-3xl md:text-4xl flex-shrink-0 ml-4" />
        ) : (
          <FaPlus className="text-3xl md:text-4xl flex-shrink-0 ml-4" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden bg-[#2d2d2d] mt-[1px]"
          >
            <div className="p-6 md:p-8 text-lg md:text-2xl text-white leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccordionItem;
