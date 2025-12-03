import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
// @ts-expect-error - Firebase config is in JS
import { auth } from "./config/firebase";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Pages
// @ts-expect-error - Component is in JSX
import LandingPage from "./pages/Landing/LandingPage";
// @ts-expect-error - Component is in JSX
import LoginPage from "./pages/Auth/LoginPage";
// @ts-expect-error - Component is in JSX
import SignupStep1 from "./pages/Auth/SignupStep1";
// @ts-expect-error - Component is in JSX
import SignupStep2 from "./pages/Auth/SignupStep2";
// @ts-expect-error - Component is in JSX
import SignupStep3 from "./pages/Auth/SignupStep3";
// @ts-expect-error - Component is in JSX
import CompleteSignupPage from "./pages/Auth/CompleteSignupPage";
// @ts-expect-error - Component is in JSX
import BrowsePage from "./pages/Browse/BrowsePage";
// @ts-expect-error - Component is in JSX
import ProfilePage from "./pages/Profile/ProfilePage";
// @ts-expect-error - Component is in JSX
import Player from "./pages/Player/Player";
// @ts-expect-error - Component is in JSX
import MyList from "./pages/MyList/MyList";
// @ts-expect-error - Component is in JSX
import Search from "./pages/Search/Search";
// @ts-expect-error - Component is in JSX
import NetflixSpinner from "./components/common/NetflixSpinner";

import "./App.css";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <NetflixSpinner />;
  }

  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={user ? <Navigate to="/browse" /> : <LandingPage />}
        />
        <Route
          path="/login"
          element={user ? <Navigate to="/browse" /> : <LoginPage />}
        />
        <Route path="/signup/step1" element={<SignupStep1 />} />
        <Route path="/signup/step2" element={<SignupStep2 />} />
        <Route path="/signup/step3" element={<SignupStep3 />} />
        <Route path="/complete-signup" element={<CompleteSignupPage />} />

        {/* Protected Routes */}
        <Route
          path="/browse"
          element={user ? <BrowsePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={user ? <ProfilePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/player/:id"
          element={user ? <Player /> : <Navigate to="/login" />}
        />
        <Route
          path="/my-list"
          element={user ? <MyList /> : <Navigate to="/login" />}
        />
        <Route
          path="/search"
          element={user ? <Search /> : <Navigate to="/login" />}
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
