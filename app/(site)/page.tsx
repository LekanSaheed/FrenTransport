import HeroSection from "@/components/landing-page/HeroSection";
import Services from "@/components/landing-page/Services";
import HowItWorks from "@/components/landing-page/HowItWorks";
import Destinations from "@/components/landing-page/Destinations";
import TripTools from "@/components/landing-page/TripTools";
import ReadyToBoard from "@/components/landing-page/ReadyToBoard";
import { jsonLd, organizationLd, pageMetadata, websiteLd } from "@/libs/seo";

/** Cached for an hour: the destinations section reads the live route network. */
export const revalidate = 3600;

export const metadata = {
  ...pageMetadata({ title: "Obere Transport | Intercity bus travel, car and bus hire in Nigeria", path: "/" }),
  title: { absolute: "Obere Transport | Intercity bus travel, car and bus hire in Nigeria" },
};

const HomePage = () => {
  return (
    <>
      <HeroSection />
      <Services />
      <HowItWorks />
      <Destinations />
      <TripTools />
      <ReadyToBoard />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd([organizationLd, websiteLd])} />
    </>
  );
};

export default HomePage;
