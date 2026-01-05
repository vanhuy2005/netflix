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
import ProfileGate from "./pages/Profile/ProfileGate";
// @ts-expect-error - Component is in JSX
import MigrationHelper from "./pages/Debug/MigrationHelper";
// @ts-expect-error - Component is in JSX
import NetflixSpinner from "./components/common/NetflixSpinner";

// Context
// @ts-expect-error - Context is in JSX
import { TransitionProvider } from "./context/TransitionContext";
  // @ts-expect-error - Context is in JSX
import { ModalProvider } from "./context/ModalContext";
// @ts-expect-error - Component is in JSX
import SplashScreen from "./components/SplashScreen";
// @ts-expect-error - Component is in JSX
import MovieModal from "./components/Modal/MovieModal";

import "./App.css";

/**
 * Protected Route Component - Requires both authentication AND profile selection
 * Redirects to /profiles if user logged in but no profile selected
 * Redirects to /login if user not logged in
 */
interface ProtectedRouteProps {
  user: User | null;
  hasProfile: boolean;
  children: React.ReactElement;
  requireProfile?: boolean;
}

const ProtectedRoute = ({
  user,
  hasProfile,
  children,
  requireProfile = true,
}: ProtectedRouteProps) => {
  // Not logged in -> Login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but no profile AND route requires profile -> Profile Gate
  if (requireProfile && !hasProfile) {
    return <Navigate to="/profiles" replace />;
  }

  // All checks passed -> Render protected component
  return children;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  // Check if user has selected a profile
  const checkProfile = () => {
    try {
      const profileData = localStorage.getItem("current_profile");
      return !!profileData;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      // Check profile selection when user state changes
      if (currentUser) {
        setHasProfile(checkProfile());
      } else {
        setHasProfile(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen for profile changes
  useEffect(() => {
    const handleProfileChange = () => {
      setHasProfile(checkProfile());
    };

    window.addEventListener("storage", handleProfileChange);
    window.addEventListener("profileChanged", handleProfileChange);

    return () => {
      window.removeEventListener("storage", handleProfileChange);
      window.removeEventListener("profileChanged", handleProfileChange);
    };
  }, []);

  if (loading) {
    return <NetflixSpinner />;
  }

  return (
    <ModalProvider>
      <TransitionProvider>
        <Router>
          {/* Splash Screen - Hoisted outside Routes to persist across navigation */}
          <SplashScreen />

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
              element={
                user ? (
                  hasProfile ? (
                    <Navigate to="/browse" replace />
                  ) : (
                    <Navigate to="/profiles" replace />
                  )
                ) : (
                  <LandingPage />
                )
              }
            />
            <Route
              path="/login"
              element={
                user ? (
                  hasProfile ? (
                    <Navigate to="/browse" replace />
                  ) : (
                    <Navigate to="/profiles" replace />
                  )
                ) : (
                  <LoginPage />
                )
              }
            />
            <Route path="/signup/step1" element={<SignupStep1 />} />
            <Route path="/signup/step2" element={<SignupStep2 />} />
            <Route path="/signup/step3" element={<SignupStep3 />} />
            <Route path="/complete-signup" element={<CompleteSignupPage />} />

            {/* Profile Gate - No profile required (user can create/select here) */}
            <Route
              path="/profiles"
              element={
                <ProtectedRoute
                  user={user}
                  hasProfile={hasProfile}
                  requireProfile={false}
                >
                  <ProfileGate />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Require both auth AND profile selection */}
            <Route
              path="/browse"
              element={
                <ProtectedRoute user={user} hasProfile={hasProfile}>
                  <BrowsePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute user={user} hasProfile={hasProfile}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/player/:id"
              element={
                <ProtectedRoute user={user} hasProfile={hasProfile}>
                  <Player />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-list"
              element={
                <ProtectedRoute user={user} hasProfile={hasProfile}>
                  <MyList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute user={user} hasProfile={hasProfile}>
                  <Search />
                </ProtectedRoute>
              }
            />

            {/* Dev Tools - Only accessible in development */}
            {import.meta.env.DEV && (
              <Route
                path="/dev/migration"
                element={
                  <ProtectedRoute user={user} hasProfile={hasProfile}>
                    <MigrationHelper />
                  </ProtectedRoute>
                }
              />
            )}

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Global Movie Modal - Rendered outside Routes for overlay */}
          <MovieModal />
        </Router>
      </TransitionProvider>
    </ModalProvider>
  );
}

export default App;
