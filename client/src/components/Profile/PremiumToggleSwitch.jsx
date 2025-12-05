import { motion } from "framer-motion";

const PremiumToggleSwitch = ({ enabled, onChange, label, description }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-[#333] hover:border-[#555] transition-colors">
      <div className="flex-1">
        <div className="text-white font-medium mb-1">{label}</div>
        {description && (
          <div className="text-gray-400 text-sm">{description}</div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-netflix-red focus:ring-offset-2 focus:ring-offset-[#141414] ${
          enabled ? "bg-green-500" : "bg-gray-600"
        }`}
      >
        <motion.span
          layout
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition ${
            enabled ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
};

export default PremiumToggleSwitch;
