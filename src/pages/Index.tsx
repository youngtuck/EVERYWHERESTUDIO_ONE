import { useScrollAnimation } from "../hooks/useScrollAnimation";
import Nav from "../components/landing/Nav";
import Hero from "../components/landing/Hero";
import WatchWorkWrap from "../components/landing/WatchWorkWrap";
import VoiceDNASection from "../components/landing/VoiceDNASection";
import TwelveFormats from "../components/landing/TwelveFormats";
import QualityGates from "../components/landing/QualityGates";
import ProofStories from "../components/landing/ProofStories";
import HowYouStart from "../components/landing/HowYouStart";
import AboutMark from "../components/landing/AboutMark";
import CTASection from "../components/landing/CTASection";
import Footer from "../components/landing/Footer";

const Index = () => {
  useScrollAnimation();

  return (
    <main>
      <Nav />
      <Hero />
      <WatchWorkWrap />
      <VoiceDNASection />
      <TwelveFormats />
      <QualityGates />
      <ProofStories />
      <HowYouStart />
      <AboutMark />
      <CTASection />
      <Footer />
    </main>
  );
};

export default Index;
