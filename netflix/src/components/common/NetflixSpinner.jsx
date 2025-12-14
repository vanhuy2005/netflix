import React from "react";
import "./NetflixSpinner.css";

const NetflixSpinner = () => {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="netflix-spinner"></div>
    </div>
  );
};

export default NetflixSpinner;
