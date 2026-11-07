import About from "@/components/landing-page/About";
import FleetShowcase from "@/components/landing-page/FleetShowcase";
import HeroSection from "@/components/landing-page/HeroSection";
import Services from "@/components/landing-page/Services";
import React from "react";

const HomePage = () => {
  return (
    <div>
      <HeroSection />
      <Services />
      <FleetShowcase />
      <About />
    </div>
  );
};

export default HomePage;
