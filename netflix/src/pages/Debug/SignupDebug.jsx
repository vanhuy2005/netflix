import React, { useState } from "react";
import { auth, db } from "../../config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";

const SignupDebug = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const testSignup = async (e) => {
    e.preventDefault();
    setLogs([]);

    try {
      addLog("🚀 Bắt đầu quá trình đăng ký...", "info");

      // Step 1: Validate
      addLog(`📝 Kiểm tra dữ liệu:`, "info");
      addLog(`   - Name: "${name}" (${name.length} ký tự)`, "info");
      addLog(`   - Email: "${email}"`, "info");
      addLog(`   - Password: ${password.length} ký tự`, "info");

      if (!name || name.trim().length < 2) {
        addLog("❌ Lỗi: Tên không hợp lệ", "error");
        toast.error("Tên phải có ít nhất 2 ký tự");
        return;
      }

      if (!email || !email.includes("@")) {
        addLog("❌ Lỗi: Email không hợp lệ", "error");
        toast.error("Email không hợp lệ");
        return;
      }

      if (!password || password.length < 6) {
        addLog("❌ Lỗi: Mật khẩu quá ngắn", "error");
        toast.error("Mật khẩu phải có ít nhất 6 ký tự");
        return;
      }

      addLog("✅ Validation passed!", "success");

      // Step 2: Create Firebase Auth user
      addLog("🔐 Đang tạo user với Firebase Auth...", "info");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      addLog(`✅ Firebase Auth thành công! User ID: ${user.uid}`, "success");

      // Step 3: Save to Firestore
      addLog("💾 Đang lưu thông tin vào Firestore...", "info");
      const userData = {
        uid: user.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        authProvider: "local",
        createdAt: new Date().toISOString(),
      };
      addLog(`   Data: ${JSON.stringify(userData, null, 2)}`, "info");

      await setDoc(doc(db, "users", user.uid), userData);
      addLog("✅ Lưu Firestore thành công!", "success");

      addLog("🎉 ĐĂNG KÝ HOÀN TẤT!", "success");
      toast.success("Đăng ký thành công! 🎉");
    } catch (error) {
      addLog(`❌ LỖI: ${error.code || error.message}`, "error");
      addLog(`   Chi tiết: ${JSON.stringify(error, null, 2)}`, "error");

      let errorMessage = "Đăng ký thất bại";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email này đã được sử dụng";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email không hợp lệ";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Mật khẩu quá yếu";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Lỗi kết nối mạng";
      }

      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-netflix-deepBlack p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          🔍 Firebase Signup Debug Tool
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-netflix-gray/30 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">Test Đăng Ký</h2>
            <form onSubmit={testSignup} className="space-y-4">
              <div>
                <label className="block text-white mb-2">Tên:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-netflix-gray text-white px-4 py-2 rounded"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-white mb-2">Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-netflix-gray text-white px-4 py-2 rounded"
                  placeholder="test@example.com"
                />
              </div>

              <div>
                <label className="block text-white mb-2">Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-netflix-gray text-white px-4 py-2 rounded"
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-netflix-red hover:bg-netflix-redHover text-white font-bold py-3 rounded"
              >
                🧪 Test Đăng Ký
              </button>
            </form>
          </div>

          {/* Logs */}
          <div className="bg-black/50 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">📋 Logs</h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-400 italic">
                  Chưa có logs. Nhấn "Test Đăng Ký" để bắt đầu...
                </p>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={`text-sm p-2 rounded ${
                      log.type === "error"
                        ? "bg-red-900/30 text-red-400"
                        : log.type === "success"
                        ? "bg-green-900/30 text-green-400"
                        : "bg-gray-800/50 text-gray-300"
                    }`}
                  >
                    <span className="text-gray-500">[{log.timestamp}]</span>{" "}
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-yellow-900/30 border border-yellow-500/50 p-4 rounded-lg">
          <h3 className="text-yellow-500 font-bold mb-2">⚠️ Lưu ý:</h3>
          <ul className="text-yellow-200 space-y-1 text-sm list-disc list-inside">
            <li>Tên phải có ít nhất 2 ký tự</li>
            <li>Email phải hợp lệ (có dấu @)</li>
            <li>Mật khẩu phải có ít nhất 6 ký tự</li>
            <li>Email không được trùng với tài khoản đã tồn tại</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SignupDebug;
