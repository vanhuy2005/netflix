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
 * Save a movie to user's list
 * @param {Object} user - Firebase user object
 * @param {Object} movie - Movie data to save
 */
const saveShow = async (user, movie) => {
  try {
    console.log("🎬 saveShow called:", {
      userEmail: user?.email,
      movieId: movie?.id,
      movieTitle: movie?.title || movie?.name,
    });

    if (!user || !user.email) {
      console.error("❌ No user email");
      toast.error("Vui lòng đăng nhập để lưu phim");
      throw new Error("User not authenticated");
    }

    if (!movie || !movie.id) {
      console.error("❌ Invalid movie data:", movie);
      toast.error("Thông tin phim không hợp lệ");
      throw new Error("Invalid movie data");
    }

    // Create document reference with movie ID to avoid duplicates
    const showRef = doc(
      db,
      "users",
      user.email,
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
 * Remove a movie from user's list
 * @param {Object} user - Firebase user object
 * @param {string|number} movieId - Movie ID to remove
 */
const removeShow = async (user, movieId) => {
  try {
    console.log("🗑️ removeShow called:", {
      userEmail: user?.email,
      movieId: movieId,
    });

    if (!user || !user.email) {
      console.error("❌ No user email");
      toast.error("Vui lòng đăng nhập");
      throw new Error("User not authenticated");
    }

    if (!movieId) {
      console.error("❌ Invalid movie ID");
      toast.error("ID phim không hợp lệ");
      throw new Error("Invalid movie ID");
    }

    // Delete document
    const showRef = doc(db, "users", user.email, "savedShows", String(movieId));

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
 * Subscribe to real-time updates of user's saved shows
 * @param {Object} user - Firebase user object
 * @param {Function} callback - Callback function to receive updates
 * @returns {Function} Unsubscribe function
 */
const subscribeToSavedShows = (user, callback) => {
  try {
    if (!user || !user.email) {
      console.error("User not authenticated for subscription");
      return () => {}; // Return empty unsubscribe function
    }

    // Create reference to savedShows collection
    const savedShowsRef = collection(db, "users", user.email, "savedShows");
    const q = query(savedShowsRef, orderBy("savedAt", "desc"));

    console.log("👂 Subscribing to savedShows for:", user.email);

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
};
