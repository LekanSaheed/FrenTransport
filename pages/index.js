import React from "react";
import HeroSection from "../components/features/HeroSection";
import Services from "../components/features/Services";
import FleetShowcase from "../components/features/FleetShowcase";
import HomeAnimation from "../components/features/HomeAnimation";
import About from "../components/features/About";
const Home = () => {
  return (
    <div>
      <HeroSection />
      <Services />
      <FleetShowcase />
      <About />
    </div>
  );
};

export default Home;
