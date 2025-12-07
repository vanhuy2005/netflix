import { createContext, useContext, useState, useCallback } from "react";

const TransitionContext = createContext(null);

export const TransitionProvider = ({ children }) => {
  const [isSplashing, setIsSplashing] = useState(false);

  /**
   * Triggers the cinematic transition.
   * @param {Function} onStartNav - Callback to execute the navigation after video overlay is rendered
   */
  const triggerTransition = useCallback((onStartNav) => {
    // Check if transition was already played in this session
    const hasPlayed = sessionStorage.getItem("netflix_intro_played");

    if (hasPlayed === "true") {
      // Skip animation, navigate immediately
      onStartNav();
      return;
    }

    // Mark as played for this session
    sessionStorage.setItem("netflix_intro_played", "true");

    // Start splash screen
    setIsSplashing(true);

    // Small buffer to ensure video overlay renders and covers the screen
    // before heavy routing/navigation starts
    setTimeout(() => {
      onStartNav();
    }, 100);
  }, []);

  /**
   * Ends the splash screen (called by SplashScreen component)
   */
  const endSplash = useCallback(() => {
    setIsSplashing(false);
  }, []);

  const value = {
    isSplashing,
    triggerTransition,
    endSplash,
  };

  return (
    <TransitionContext.Provider value={value}>
      {children}
    </TransitionContext.Provider>
  );
};

export const useTransition = () => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error("useTransition must be used within TransitionProvider");
  }
  return context;
};
