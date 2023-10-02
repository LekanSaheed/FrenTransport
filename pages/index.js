import React from "react";
import HeroSection from "../components/features/HeroSection";
import Services from "../components/features/Services";
import FleetShowcase from "../components/features/FleetShowcase";
const Home = () => {
  return (
    <div>
      <HeroSection />
      <Services />
      <FleetShowcase />
    </div>
  );
};

export default Home;