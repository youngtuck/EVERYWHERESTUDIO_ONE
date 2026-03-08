import { useNavigate } from "react-router-dom";
import Nav from "../components/landing/Nav";
import Hero from "../components/landing/Hero";
import StatsBar from "../components/landing/StatsBar";
import WatchWorkWrap from "../components/landing/WatchWorkWrap";
import VoiceDNA from "../components/landing/VoiceDNA";
import QualityGates from "../components/landing/QualityGates";
import TwelveFormats from "../components/landing/TwelveFormats";
import AboutMark from "../components/landing/AboutMark";
import CTASection from "../components/landing/CTASection";
import Footer from "../components/landing/Footer";
import Marquee from "../components/landing/Marquee";

export default function ExplorePage() {
  return (
    <div style={{ fontFamily: "var(--font)" }}>
      <Nav />
      <Hero />
      <StatsBar />
      <Marquee />
      <WatchWorkWrap />
      <VoiceDNA />
      <QualityGates />
      <TwelveFormats />
      <AboutMark />
      <CTASection />
      <Footer />
    </div>
  );
}
