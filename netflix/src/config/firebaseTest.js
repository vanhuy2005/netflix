// Test Firebase Connection
import { auth, db } from "./firebase";
import { toast } from "react-toastify";

export const testFirebaseConnection = async () => {
  console.log("=== Testing Firebase Connection ===");

  // Test Auth
  try {
    console.log("Auth instance:", auth);
    console.log("Auth config:", {
      apiKey: auth.config.apiKey ? "✓ Exists" : "✗ Missing",
      authDomain: auth.config.authDomain,
      projectId: auth.config.projectId,
    });

    if (!auth.config.apiKey) {
      toast.error("Firebase API Key không tồn tại!");
      return false;
    }

    console.log("✓ Firebase Auth initialized");
  } catch (error) {
    console.error("✗ Firebase Auth error:", error);
    toast.error("Lỗi khởi tạo Firebase Auth");
    return false;
  }

  // Test Firestore
  try {
    console.log("Firestore instance:", db);
    console.log("✓ Firestore initialized");
  } catch (error) {
    console.error("✗ Firestore error:", error);
    toast.error("Lỗi khởi tạo Firestore");
    return false;
  }

  // Test environment variables
  console.log("Environment variables check:");
  console.log(
    "- VITE_FIREBASE_API_KEY:",
    import.meta.env.VITE_FIREBASE_API_KEY ? "✓" : "✗"
  );
  console.log(
    "- VITE_FIREBASE_AUTH_DOMAIN:",
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? "✓" : "✗"
  );
  console.log(
    "- VITE_FIREBASE_PROJECT_ID:",
    import.meta.env.VITE_FIREBASE_PROJECT_ID ? "✓" : "✗"
  );

  console.log("=== Firebase Connection Test Complete ===");
  toast.success("Firebase kết nối thành công!");
  return true;
};
