import { useEffect, useRef } from "react";
import Nav from "../components/landing/Nav";
import Hero from "../components/landing/Hero";
import Marquee from "../components/landing/Marquee";
import StatsBar from "../components/landing/StatsBar";
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
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); } });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

    document.querySelectorAll(".fade-up, .fade-in").forEach(el => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div style={{ overflowX: "hidden" }}>
      <Nav />
      <Hero />
      <Marquee />
      <StatsBar />
      <WatchWorkWrap />
      <VoiceDNASection />
      <TwelveFormats />
      <QualityGates />
      <ProofStories />
      <HowYouStart />
      <AboutMark />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
