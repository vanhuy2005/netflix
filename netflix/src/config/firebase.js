import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocs,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-toastify";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
console.log("Initializing Firebase with config:", {
  apiKey: firebaseConfig.apiKey ? "✓ Exists" : "✗ Missing",
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
});

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("Firebase initialized successfully!");

/**
 * Sign up new user with email and password
 * @param {string} name - User's display name
 * @param {string} email - User's email
 * @param {string} password - User's password
 */
const signup = async (name, email, password) => {
  try {
    // Validate inputs
    if (!name || name.trim().length < 2) {
      toast.error("Tên phải có ít nhất 2 ký tự");
      throw new Error("Invalid name");
    }

    if (!email || !email.includes("@")) {
      toast.error("Email không hợp lệ");
      throw new Error("Invalid email");
    }

    if (!password || password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      throw new Error("Invalid password");
    }

    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Save user data to Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      authProvider: "local",
      createdAt: new Date().toISOString(),
    });

    toast.success("Đăng ký thành công! 🎉");
    return user;
  } catch (error) {
    console.error("Signup error:", error);

    // Handle specific Firebase errors
    let errorMessage = "Đăng ký thất bại";

    if (error.code === "auth/configuration-not-found") {
      errorMessage =
        "⚠️ Firebase Authentication chưa được cấu hình!\n\nVui lòng:\n1. Vào Firebase Console\n2. Mở mục Authentication\n3. Bật Email/Password provider";
      toast.error(errorMessage, { autoClose: 10000 });
      console.error("\n=== HƯỚNG DẪN SỬA LỖI ===");
      console.error("1. Truy cập: https://console.firebase.google.com");
      console.error("2. Chọn project: netflix-443ae");
      console.error("3. Vào Authentication > Sign-in method");
      console.error("4. Bật Email/Password provider");
      console.error("========================\n");
      throw error;
    } else if (error.code === "auth/email-already-in-use") {
      errorMessage = "Email này đã được sử dụng";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Email không hợp lệ";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn";
    } else if (error.code === "auth/operation-not-allowed") {
      errorMessage =
        "Đăng ký bằng email/password chưa được kích hoạt trong Firebase Console";
    } else if (error.code === "auth/network-request-failed") {
      errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet";
    } else if (!error.code) {
      // Custom validation errors
      return; // Already showed toast in validation
    }

    toast.error(errorMessage);
    throw error;
  }
};
/**
 * Login user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 */
const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    toast.success("Đăng nhập thành công!");
    return userCredential.user;
  } catch (error) {
    console.error("Login error:", error);
    // Format Firebase error messages for better UX
    let errorMessage = "Đăng nhập thất bại";

    if (error.code === "auth/user-not-found") {
      errorMessage = "Email không tồn tại";
    } else if (error.code === "auth/wrong-password") {
      errorMessage = "Mật khẩu không đúng";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Email không hợp lệ";
    } else if (error.code === "auth/invalid-credential") {
      errorMessage = "Email hoặc mật khẩu không đúng";
    }

    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Logout current user
 */
const logout = async () => {
  try {
    await signOut(auth);
    toast.success("Đăng xuất thành công!");
  } catch (error) {
    console.error("Logout error:", error);
    toast.error("Đăng xuất thất bại");
    throw error;
  }
};

/**
 * Save a movie to user's profile-specific list
 * @param {Object} user - Firebase user object
 * @param {string} profileId - Profile ID from current_profile
 * @param {Object} movie - Movie data to save
 */
const saveShow = async (user, profileId, movie) => {
  try {
    console.log("🎬 saveShow called:", {
      userId: user?.uid,
      profileId: profileId,
      movieId: movie?.id,
      movieTitle: movie?.title || movie?.name,
    });

    if (!user || !user.uid) {
      console.error("❌ No user");
      toast.error("Vui lòng đăng nhập để lưu phim");
      throw new Error("User not authenticated");
    }

    if (!profileId) {
      console.error("❌ No profile ID");
      toast.error("Vui lòng chọn hồ sơ trước");
      throw new Error("No profile selected");
    }

    if (!movie || !movie.id) {
      console.error("❌ Invalid movie data:", movie);
      toast.error("Thông tin phim không hợp lệ");
      throw new Error("Invalid movie data");
    }

    // NEW PATH: users/{uid}/profiles/{profileId}/savedShows/{movieId}
    const showRef = doc(
      db,
      "users",
      user.uid,
      "profiles",
      profileId,
      "savedShows",
      String(movie.id)
    );

    const movieData = {
      id: movie.id,
      title: movie.title || movie.name || "Untitled",
      backdrop_path: movie.backdrop_path || "",
      poster_path: movie.poster_path || "",
      overview: movie.overview || "",
      vote_average: movie.vote_average || 0,
      release_date: movie.release_date || movie.first_air_date || "",
      savedAt: serverTimestamp(),
    };

    console.log("💾 Saving to Firestore:", movieData);

    // Save movie data
    await setDoc(showRef, movieData);

    console.log("✅ Movie saved successfully!");
    toast.success("✓ Đã thêm vào danh sách của bạn");
  } catch (error) {
    console.error("❌ Save show error:", error);
    toast.error("Không thể lưu phim. Vui lòng thử lại");
    throw error;
  }
};

/**
 * Remove a movie from user's profile-specific list
 * @param {Object} user - Firebase user object
 * @param {string} profileId - Profile ID from current_profile
 * @param {string|number} movieId - Movie ID to remove
 */
const removeShow = async (user, profileId, movieId) => {
  try {
    console.log("🗑️ removeShow called:", {
      userId: user?.uid,
      profileId: profileId,
      movieId: movieId,
    });

    if (!user || !user.uid) {
      console.error("❌ No user");
      toast.error("Vui lòng đăng nhập");
      throw new Error("User not authenticated");
    }

    if (!profileId) {
      console.error("❌ No profile ID");
      toast.error("Vui lòng chọn hồ sơ trước");
      throw new Error("No profile selected");
    }

    if (!movieId) {
      console.error("❌ Invalid movie ID");
      toast.error("ID phim không hợp lệ");
      throw new Error("Invalid movie ID");
    }

    // NEW PATH: Delete from profile-specific savedShows
    const showRef = doc(
      db,
      "users",
      user.uid,
      "profiles",
      profileId,
      "savedShows",
      String(movieId)
    );

    console.log("🗑️ Deleting from Firestore:", showRef.path);
    await deleteDoc(showRef);

    console.log("✅ Movie removed successfully!");
    toast.success("✓ Đã xóa khỏi danh sách");
  } catch (error) {
    console.error("❌ Remove show error:", error);
    toast.error("Không thể xóa phim. Vui lòng thử lại");
    throw error;
  }
};

/**
 * Subscribe to real-time updates of user's profile-specific saved shows
 * @param {Object} user - Firebase user object
 * @param {string} profileId - Profile ID from current_profile
 * @param {Function} callback - Callback function to receive updates
 * @returns {Function} Unsubscribe function
 */
const subscribeToSavedShows = (user, profileId, callback) => {
  try {
    if (!user || !user.uid) {
      console.error("User not authenticated for subscription");
      return () => {}; // Return empty unsubscribe function
    }

    if (!profileId) {
      console.error("No profile ID for subscription");
      return () => {}; // Return empty unsubscribe function
    }

    // NEW PATH: Create reference to profile-specific savedShows collection
    const savedShowsRef = collection(
      db,
      "users",
      user.uid,
      "profiles",
      profileId,
      "savedShows"
    );
    const q = query(savedShowsRef, orderBy("savedAt", "desc"));

    console.log("👂 Subscribing to savedShows for profile:", profileId);

    // Listen to real-time updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const shows = [];
        snapshot.forEach((doc) => {
          shows.push({
            firestoreId: doc.id,
            ...doc.data(),
          });
        });

        console.log("📊 Saved shows updated:", shows.length, "movies");
        callback(shows);
      },
      (error) => {
        console.error("❌ Subscription error:", error);
        toast.error("Không thể tải danh sách phim");
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Subscribe error:", error);
    return () => {}; // Return empty unsubscribe function
  }
};

/**
 * Delete a profile from user's profiles collection
 * @param {Object} user - Firebase Auth user object
 * @param {string} profileId - Profile ID to delete
 */
const deleteProfile = async (user, profileId) => {
  try {
    if (!user || !user.uid) {
      console.error("No user logged in");
      toast.error("Bạn cần đăng nhập để xóa hồ sơ");
      return false;
    }

    if (!profileId) {
      console.error("No profile ID provided");
      toast.error("ID hồ sơ không hợp lệ");
      return false;
    }

    console.log(`🗑️ Deleting profile ${profileId} for user ${user.uid}`);

    // Reference to the profile document
    const profileRef = doc(db, "users", user.uid, "profiles", profileId);

    // Delete the document
    await deleteDoc(profileRef);

    console.log(`✅ Profile ${profileId} deleted successfully`);
    toast.success("Đã xóa hồ sơ thành công");
    return true;
  } catch (error) {
    console.error("Delete profile error:", error);
    toast.error("Không thể xóa hồ sơ. Vui lòng thử lại.");
    return false;
  }
};

/**
 * Update a profile (name, avatar, PIN)
 * @param {Object} user - Firebase Auth user object
 * @param {string} profileId - Profile ID to update
 * @param {Object} updates - Object with fields to update {name, avatar, pin}
 */
const updateProfile = async (user, profileId, updates) => {
  try {
    if (!user || !user.uid) {
      console.error("No user logged in");
      toast.error("Bạn cần đăng nhập");
      return false;
    }

    if (!profileId) {
      console.error("No profile ID provided");
      toast.error("ID hồ sơ không hợp lệ");
      return false;
    }

    console.log(`📝 Updating profile ${profileId}:`, updates);

    // Reference to the profile document
    const profileRef = doc(db, "users", user.uid, "profiles", profileId);

    // Update with timestamp
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    await setDoc(profileRef, updateData, { merge: true });

    console.log(`✅ Profile ${profileId} updated successfully`);
    // Toast will be shown in component, not here
    return true;
  } catch (error) {
    console.error("Update profile error:", error);
    toast.error("Không thể cập nhật hồ sơ. Vui lòng thử lại.");
    return false;
  }
};

/**
 * Add movie to watch history (debounced - call only when user plays/watches)
 * @param {Object} user - Firebase user object
 * @param {string} profileId - Profile ID
 * @param {Object} movie - Movie data
 */
const addToWatchHistory = async (user, profileId, movie) => {
  try {
    if (!user || !user.uid) {
      console.error("User not authenticated for watch history");
      return;
    }

    if (!profileId) {
      console.error("No profile ID for watch history");
      return;
    }

    if (!movie || !movie.id) {
      console.error("Invalid movie data for watch history");
      return;
    }

    // Path: users/{uid}/profiles/{profileId}/watchHistory/{movieId}
    const historyRef = doc(
      db,
      "users",
      user.uid,
      "profiles",
      profileId,
      "watchHistory",
      String(movie.id)
    );

    const historyData = {
      id: movie.id,
      title: movie.title || movie.name || "Untitled",
      poster_path: movie.poster_path || "",
      backdrop_path: movie.backdrop_path || "",
      genre_ids: movie.genre_ids || [],
      vote_average: movie.vote_average || 0,
      last_watched: serverTimestamp(),
    };

    console.log("📝 Adding to watch history:", historyData);

    // Use merge to update last_watched if already exists
    await setDoc(historyRef, historyData, { merge: true });

    console.log("✅ Watch history updated");
  } catch (error) {
    console.error("❌ Add to watch history error:", error);
    // Silent fail - don't show toast for analytics
  }
};

/**
 * [PHASE 2] Update watch progress (% watched)
 * @param {Object} user - Firebase user object
 * @param {string} profileId - Profile ID
 * @param {Object} movieData - Movie data with id, title, poster_path, etc
 * @param {number} progress - Current playback time (seconds)
 * @param {number} duration - Total video duration (seconds)
 */
/**
 * [PHASE 2] Update watch progress (% watched)
 * Fixed: NaN validation, detailed logging, type field
 */
const updateWatchProgress = async (
  user,
  profileId,
  movieData,
  progress,
  duration
) => {
  console.log("📝 [Firebase] updateWatchProgress called with:", {
    userId: user?.uid,
    profileId,
    movieId: movieData?.id,
    movieTitle: movieData?.title || movieData?.name,
    progress,
    duration,
  });

  try {
    if (!user || !user.uid || !profileId || !movieData?.id) {
      console.warn("⚠️ [Firebase] updateWatchProgress: Missing required data", {
        hasUser: !!user?.uid,
        hasProfileId: !!profileId,
        hasMovieId: !!movieData?.id,
      });
      return;
    }

    // 1. Validate input numbers to prevent NaN
    const safeProgress = Number(progress) || 0;
    const safeDuration = Number(duration) || 0;

    console.log("🔢 [Firebase] After Number conversion:", {
      safeProgress,
      safeDuration,
    });

    if (isNaN(safeProgress) || isNaN(safeDuration)) {
      console.warn("⚠️ [Firebase] Invalid progress/duration:", {
        progress,
        duration,
      });
      return;
    }

    if (safeDuration === 0) {
      console.warn("⚠️ [Firebase] Duration is 0, cannot calculate percentage");
      return;
    }

    // 2. Calculate percentage safely
    let percentage = 0;
    if (safeDuration > 0) {
      percentage = (safeProgress / safeDuration) * 100;
      percentage = Math.min(Math.round(percentage * 100) / 100, 100); // Cap at 100%, round to 2 decimals
    }

    console.log("📊 [Firebase] Calculated percentage:", percentage);

    const historyRef = doc(
      db,
      "users",
      user.uid,
      "profiles",
      profileId,
      "watchHistory",
      String(movieData.id)
    );

    // 3. Save to Firestore
    const dataToSave = {
      id: movieData.id,
      title: movieData.title || movieData.name || "Untitled",
      poster_path: movieData.poster_path || "",
      backdrop_path: movieData.backdrop_path || "",
      // Progress data
      progress: Math.round(safeProgress),
      duration: Math.round(safeDuration),
      percentage: percentage,
      last_watched: serverTimestamp(),
      // Metadata
      genre_ids:
        movieData.genres?.map((g) => g.id) || movieData.genre_ids || [],
      vote_average: movieData.vote_average || 0,
      type: movieData.title ? "movie" : "tv",
    };

    console.log("💾 [Firebase] Saving to Firestore:", dataToSave);

    await setDoc(historyRef, dataToSave, { merge: true });

    console.log(
      `✅ [Firebase] Successfully saved: ${percentage.toFixed(
        1
      )}% (${Math.round(safeProgress)}s / ${Math.round(safeDuration)}s) for "${
        dataToSave.title
      }"`
    );
  } catch (error) {
    console.error("❌ [Firebase] Error updating watch progress:", error);
    console.error("❌ [Firebase] Error details:", error.message, error.stack);
  }
};

/**
 * [NEW APPROACH] Get specific movie watch history for resume playback
 * Player will use this to get the start time natively
 */
const getSpecificMovieHistory = async (userId, profileId, movieId) => {
  try {
    if (!userId || !profileId || !movieId) return null;

    const docRef = doc(
      db,
      "users",
      userId,
      "profiles",
      profileId,
      "watchHistory",
      String(movieId)
    );

    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log(`📖 [Firebase] Found history for movie ${movieId}:`, {
        progress: data.progress,
        percentage: data.percentage,
        duration: data.duration,
      });
      return data;
    } else {
      console.log(`ℹ️ [Firebase] No history found for movie ${movieId}`);
      return null;
    }
  } catch (error) {
    console.error("❌ Error fetching specific movie history:", error);
    return null;
  }
};

/**
 * [PHASE 2] Get continue watching list
 * Fixed: Lower threshold to 0% for testing (change to 5% in production)
 * @param {string} uid - User ID (not user object)
 * @param {string} profileId - Profile ID
 * @returns {Promise<Array>} Array of partially watched movies
 */
const getContinueWatching = async (uid, profileId) => {
  try {
    if (!uid || !profileId) {
      console.warn(
        "⚠️ [Firebase] getContinueWatching: Missing uid or profileId"
      );
      return [];
    }

    const historyRef = collection(
      db,
      "users",
      uid,
      "profiles",
      profileId,
      "watchHistory"
    );

    // Fetch 20 most recent watches (increased from 10)
    const q = query(historyRef, orderBy("last_watched", "desc"), limit(20));
    const snapshot = await getDocs(q);

    console.log(`🔍 [Firebase] Fetched ${snapshot.size} watch history items`);

    // Client-side filter: only partially watched movies
    const continueWatching = [];
    const debugInfo = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const pct = Number(data.percentage) || 0;

      // Debug log for each item
      debugInfo.push({
        title: data.title,
        percentage: pct,
        hasPercentage: data.percentage !== undefined,
        passed: pct > 0 && pct < 95,
      });

      // FIX: Changed from > 5 to > 0 for easier testing
      // TODO: Change back to > 5 for production
      if (pct >= 0 && pct < 95) {
        continueWatching.push({
          firestoreId: doc.id,
          ...data,
        });
      }
    });

    console.log(
      `▶️ [Firebase] Continue Watching: ${continueWatching.length} items (filtered from ${snapshot.size})`
    );
    console.table(debugInfo);

    return continueWatching;
  } catch (error) {
    console.error("❌ [Firebase] Error fetching continue watching:", error);
    return [];
  }
};

/**
 * Get watch history for recommendations (client-side query)
 * @param {Object} user - Firebase user object
 * @param {string} profileId - Profile ID
 * @param {number} limit - Number of recent movies to fetch
 * @returns {Promise<Array>} Array of watched movies
 */
const getWatchHistory = async (user, profileId, limitCount = 3) => {
  try {
    if (!user || !user.uid) {
      console.error("User not authenticated");
      return [];
    }

    if (!profileId) {
      console.error("No profile ID");
      return [];
    }

    const historyRef = collection(
      db,
      "users",
      user.uid,
      "profiles",
      profileId,
      "watchHistory"
    );

    const q = query(
      historyRef,
      orderBy("last_watched", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    const history = [];
    snapshot.forEach((doc) => {
      history.push({
        firestoreId: doc.id,
        ...doc.data(),
      });
    });

    console.log(`📚 Fetched ${history.length} watch history items`);
    return history;
  } catch (error) {
    console.error("❌ Get watch history error:", error);
    return [];
  }
};

export {
  app,
  auth,
  db,
  signup,
  login,
  logout,
  saveShow,
  removeShow,
  subscribeToSavedShows,
  deleteProfile,
  updateProfile,
  addToWatchHistory,
  getWatchHistory,
  updateWatchProgress, // PHASE 2: Progress tracking
  getContinueWatching, // PHASE 2: Continue watching
  getSpecificMovieHistory, // PHASE 2: Native resume
};
