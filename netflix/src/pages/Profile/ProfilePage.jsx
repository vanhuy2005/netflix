import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, logout } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import NetflixSpinner from "../../components/common/NetflixSpinner";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return <NetflixSpinner />;
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-netflix-deepBlack text-white">
      {/* Header */}
      <header className="px-8 md:px-16 py-6 border-b border-netflix-darkGray">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <img
            src="/assets/logo.png"
            alt="Netflix"
            className="h-8 md:h-10 cursor-pointer"
            onClick={() => navigate("/browse")}
          />
          <button
            onClick={() => navigate("/browse")}
            className="text-netflix-lightGray hover:text-white transition-colors"
          >
            ← Quay lại Browse
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold">Tài khoản</h1>

          {/* Account Info Card */}
          <div className="bg-netflix-darkGray rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-6 pb-4 border-b border-netflix-gray/30">
              Thông tin tài khoản
            </h2>

            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-netflix-gray text-sm mb-2">Tên hiển thị</p>
                  <p className="text-xl font-medium">
                    {userData?.name || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-netflix-gray text-sm mb-2">Email</p>
                  <p className="text-xl font-medium">{currentUser.email}</p>
                </div>

                <div>
                  <p className="text-netflix-gray text-sm mb-2">User ID</p>
                  <p className="text-sm font-mono text-netflix-lightGray break-all">
                    {currentUser.uid}
                  </p>
                </div>

                <div>
                  <p className="text-netflix-gray text-sm mb-2">
                    Ngày tạo tài khoản
                  </p>
                  <p className="text-lg">
                    {userData?.createdAt
                      ? new Date(userData.createdAt).toLocaleDateString(
                          "vi-VN",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-netflix-gray text-sm mb-2">
                    Phương thức xác thực
                  </p>
                  <p className="text-lg capitalize">
                    {userData?.authProvider === "local"
                      ? "Email/Password"
                      : userData?.authProvider}
                  </p>
                </div>

                <div>
                  <p className="text-netflix-gray text-sm mb-2">
                    Trạng thái email
                  </p>
                  <p className="text-lg">
                    {currentUser.emailVerified ? (
                      <span className="text-green-500">✓ Đã xác thực</span>
                    ) : (
                      <span className="text-yellow-500">⚠ Chưa xác thực</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Firebase Auth Info */}
              <div className="pt-6 border-t border-netflix-gray/30">
                <p className="text-netflix-gray text-sm mb-3">
                  Thông tin xác thực Firebase
                </p>
                <div className="bg-black/30 rounded p-4 space-y-2">
                  <p className="text-sm">
                    <span className="text-netflix-gray">Provider ID:</span>{" "}
                    <span className="font-mono text-netflix-lightGray">
                      {currentUser.providerId || "firebase"}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-netflix-gray">Last Sign In:</span>{" "}
                    <span className="text-netflix-lightGray">
                      {new Date(
                        currentUser.metadata.lastSignInTime
                      ).toLocaleString("vi-VN")}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-netflix-gray">Creation Time:</span>{" "}
                    <span className="text-netflix-lightGray">
                      {new Date(
                        currentUser.metadata.creationTime
                      ).toLocaleString("vi-VN")}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="bg-netflix-red hover:bg-netflix-redHover text-white font-semibold px-8 py-3 rounded-md transition-colors"
            >
              Đăng xuất
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/browse")}
              className="bg-netflix-gray hover:bg-netflix-lightGray text-white font-semibold px-8 py-3 rounded-md transition-colors"
            >
              Quay lại xem phim
            </motion.button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>ℹ️</span> Quản lý bởi Firebase
            </h3>
            <ul className="space-y-2 text-sm text-netflix-lightGray">
              <li>
                ✅ Authentication: Bạn đang đăng nhập qua Firebase
                Authentication
              </li>
              <li>
                ✅ Firestore: Thông tin của bạn được lưu trong Firestore
                Database
              </li>
              <li>
                ✅ Security: Dữ liệu được bảo mật theo Firebase Security Rules
              </li>
              <li>✅ Real-time: Trạng thái đăng nhập được đồng bộ real-time</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
