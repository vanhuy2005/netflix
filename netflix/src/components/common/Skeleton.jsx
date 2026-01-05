import { motion } from "framer-motion";

/**
 * Movie Row Skeleton
 * Shimmer loading effect that matches exact MovieCard dimensions
 * Prevents Cumulative Layout Shift (CLS)
 */
const MovieRowSkeleton = ({ isLarge = false }) => {
  return (
    <div className="mb-4 md:mb-8 w-full">
      {/* Title Skeleton */}
      <div className="pl-[4%] md:pl-[60px] mb-2">
        <div className="h-5 md:h-6 w-32 md:w-48 bg-gray-800 rounded animate-pulse" />
      </div>

      {/* Cards Row Skeleton */}
      <div className="flex gap-2 overflow-hidden pl-[4%] md:pl-[60px]">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`flex-shrink-0 relative ${
              isLarge
                ? "w-[110px] md:w-[150px] aspect-[2/3]"
                : "w-[160px] md:w-[220px] aspect-video"
            }`}
          >
            {/* Background skeleton */}
            <div className="absolute inset-0 bg-gray-800 rounded-md overflow-hidden">
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700 to-transparent"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "linear",
                  delay: i * 0.1, // Stagger effect
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Recommendation Row Skeleton
 * Specialized skeleton for recommendation row with exact spacing
 */
export const RecommendationRowSkeleton = () => {
  return (
    <div className="mb-4 md:mb-8 w-full px-4 md:px-12">
      {/* Title Skeleton with icon */}
      <div className="mb-2 flex items-center gap-2">
        <div className="h-5 md:h-6 w-4 bg-gray-800 rounded animate-pulse" />
        <div className="h-5 md:h-6 w-48 md:w-64 bg-gray-800 rounded animate-pulse" />
      </div>

      {/* Cards Row Skeleton */}
      <div className="flex gap-2 overflow-hidden py-2">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 relative w-[160px] md:w-[220px] aspect-video"
          >
            {/* Background skeleton */}
            <div className="absolute inset-0 bg-gray-800 rounded-md overflow-hidden">
              {/* Shimmer effect (Netflix-style) */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700 to-transparent opacity-50"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "linear",
                  delay: i * 0.15,
                }}
              />
            </div>

            {/* Fake overlay info (optional detail) */}
            <div className="absolute bottom-2 left-2 right-2 space-y-1">
              <div className="h-3 w-3/4 bg-gray-700 rounded animate-pulse" />
              <div className="h-2 w-1/2 bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Simple Card Skeleton
 * Generic skeleton for individual movie cards
 */
export const MovieCardSkeleton = ({ isLarge = false }) => {
  return (
    <div
      className={`relative ${
        isLarge
          ? "w-[110px] md:w-[150px] aspect-[2/3]"
          : "w-[160px] md:w-[220px] aspect-video"
      }`}
    >
      <div className="absolute inset-0 bg-gray-800 rounded-md overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700 to-transparent"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "linear",
          }}
        />
      </div>
    </div>
  );
};

/**
 * Billboard Skeleton
 * Large hero skeleton for featured content
 */
export const BillboardSkeleton = () => {
  return (
    <div className="relative w-full h-[56.25vw] max-h-[800px] bg-gray-900">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

      {/* Content skeleton */}
      <div className="absolute bottom-[20%] left-[4%] md:left-[60px] max-w-[500px] space-y-4">
        {/* Title */}
        <div className="h-12 md:h-16 w-3/4 bg-gray-800 rounded animate-pulse" />

        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-4/6 bg-gray-800 rounded animate-pulse" />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <div className="h-12 w-32 bg-gray-800 rounded animate-pulse" />
          <div className="h-12 w-32 bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default MovieRowSkeleton;
