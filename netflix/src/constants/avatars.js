/**
 * Netflix Profile Avatars - Stable DiceBear API with Local Fallback
 * Using DiceBear avatars (never expire, no hotlinking protection)
 */

export const NETFLIX_AVATARS = [
  // --- 8 Avatar Cũ ---
  {
    id: "red-classic",
    name: "Classic Red",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4",
    fallback: "/assets/default-red.png",
    category: "classic",
  },
  {
    id: "profile-default",
    name: "Netflix Profile",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede",
    fallback: "/assets/profile_img.png",
    category: "classic",
  },
  {
    id: "green-avatar",
    name: "Green Avatar",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=d1d4f9",
    fallback: "/assets/default-green.png",
    category: "kids",
  },
  {
    id: "slate-avatar",
    name: "Slate Avatar",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam&backgroundColor=ffd5dc",
    fallback: "/assets/default-slate.png",
    category: "classic",
  },
  {
    id: "blue-avatar",
    name: "Blue Hero",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Max&backgroundColor=ffdfbf",
    fallback: "/assets/profile_img.png",
    category: "fun",
  },
  {
    id: "orange-avatar",
    name: "Orange Buddy",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&backgroundColor=c0aede",
    fallback: "/assets/default-green.png",
    category: "kids",
  },
  {
    id: "purple-avatar",
    name: "Purple Star",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie&backgroundColor=b6e3f4",
    fallback: "/assets/default-slate.png",
    category: "fun",
  },
  {
    id: "pink-avatar",
    name: "Pink Friend",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia&backgroundColor=ffd5dc",
    fallback: "/assets/default-red.png",
    category: "classic",
  },

  // --- 4 Avatar Mới Thêm ---
  {
    id: "yellow-cool",
    name: "Yellow Cool",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&backgroundColor=ffdfbf&accessories=sunglasses",
    fallback: "/assets/profile_img.png",
    category: "fun",
  },
  {
    id: "teal-calm",
    name: "Teal Calm",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe&backgroundColor=b6e3f4",
    fallback: "/assets/default-slate.png",
    category: "classic",
  },
  {
    id: "red-angry",
    name: "Red Angry",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rocky&backgroundColor=ffdfbf&eyebrows=angry",
    fallback: "/assets/default-red.png",
    category: "fun",
  },
  {
    id: "dark-mysterious",
    name: "Dark Mystery",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow&backgroundColor=c0aede&clothing=blazerAndShirt",
    fallback: "/assets/profile_img.png",
    category: "classic",
  },
];

/**
 * Get avatar by ID
 * @param {string} avatarId - The avatar ID to find
 * @returns {object|null} Avatar object or null if not found
 */
export const getAvatarById = (avatarId) => {
  return NETFLIX_AVATARS.find((avatar) => avatar.id === avatarId) || null;
};

/**
 * Get avatars by category
 * @param {string} category - Category to filter by (classic, fun, kids)
 * @returns {array} Array of avatars in that category
 */
export const getAvatarsByCategory = (category) => {
  return NETFLIX_AVATARS.filter((avatar) => avatar.category === category);
};

/**
 * Get random avatar
 * @returns {object} Random avatar object
 */
export const getRandomAvatar = () => {
  const randomIndex = Math.floor(Math.random() * NETFLIX_AVATARS.length);
  return NETFLIX_AVATARS[randomIndex];
};

export default NETFLIX_AVATARS;
