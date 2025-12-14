import React from "react";
import LandingHeader from "../../components/landing/LandingHeader";
import HeroSection from "../../components/landing/HeroSection";
import TrendingSection from "../../components/landing/TrendingSection";
import FeatureSection from "../../components/landing/FeatureSection";
import FAQSection from "../../components/landing/FAQSection";
import LandingFooter from "../../components/landing/LandingFooter";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-netflix-deepBlack">
      <LandingHeader />
      <HeroSection />
      <TrendingSection />
      <FeatureSection />
      <FAQSection />
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
