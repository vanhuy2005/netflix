import { auth, db } from "./firebase";
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";

/**
 * Send sign-in link to email (Passwordless authentication)
 * @param {string} email - User's email
 */
export const sendEmailLink = async (email) => {
  try {
    const actionCodeSettings = {
      // URL bạn muốn redirect sau khi user click link
      url: `${window.location.origin}/complete-signup`,
      handleCodeInApp: true,
    };

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);

    // Lưu email vào localStorage để dùng sau
    window.localStorage.setItem("emailForSignIn", email);

    toast.success("📧 Đã gửi link đăng ký vào email của bạn!");
    return true;
  } catch (error) {
    console.error("Send email link error:", error);

    let errorMessage = "Không thể gửi email";

    if (error.code === "auth/invalid-email") {
      errorMessage = "Email không hợp lệ";
    } else if (error.code === "auth/missing-email") {
      errorMessage = "Vui lòng nhập email";
    }

    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Complete sign-in with email link
 * @param {string} emailFromUser - Email from user input if not in localStorage
 */
export const completeEmailLinkSignIn = async (emailFromUser = null) => {
  try {
    // Kiểm tra xem URL có phải là sign-in link không
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      throw new Error("Invalid sign-in link");
    }

    // Lấy email từ localStorage hoặc parameter
    let email = window.localStorage.getItem("emailForSignIn") || emailFromUser;

    if (!email) {
      // Throw error để component xử lý UI
      throw new Error("EMAIL_REQUIRED");
    }

    // Sign in với email link
    const result = await signInWithEmailLink(auth, email, window.location.href);
    const user = result.user;

    // Xóa email khỏi localStorage
    window.localStorage.removeItem("emailForSignIn");

    // Kiểm tra xem user đã có document trong Firestore chưa
    // Nếu chưa thì tạo mới
    const userDoc = doc(db, "users", user.uid);
    await setDoc(
      userDoc,
      {
        uid: user.uid,
        email: email,
        authProvider: "emailLink",
        createdAt: new Date().toISOString(),
        name: email.split("@")[0], // Tên tạm từ email
      },
      { merge: true } // merge để không ghi đè nếu đã tồn tại
    );

    toast.success("🎉 Đăng nhập thành công!");
    return user;
  } catch (error) {
    console.error("Complete email link sign-in error:", error);

    let errorMessage = "Đăng nhập thất bại";

    if (error.code === "auth/invalid-action-code") {
      errorMessage = "Link đã hết hạn hoặc không hợp lệ";
    } else if (error.code === "auth/expired-action-code") {
      errorMessage = "Link đã hết hạn. Vui lòng yêu cầu link mới";
    }

    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Check if current URL is a sign-in link
 */
export const checkEmailLink = () => {
  return isSignInWithEmailLink(auth, window.location.href);
};
