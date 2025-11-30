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

export { app, auth, db, signup, login, logout };
