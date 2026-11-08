import HeroSection from "@/components/landing-page/HeroSection";
import Services from "@/components/landing-page/Services";
import HowItWorks from "@/components/landing-page/HowItWorks";
import Destinations from "@/components/landing-page/Destinations";
import TripTools from "@/components/landing-page/TripTools";
import ReadyToBoard from "@/components/landing-page/ReadyToBoard";

const HomePage = () => {
  return (
    <>
      <HeroSection />
      <Services />
      <HowItWorks />
      <Destinations />
      <TripTools />
      <ReadyToBoard />
    </>
  );
};

export default HomePage;
