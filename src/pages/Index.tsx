import { useEffect, useRef } from "react";
import Nav from "../components/landing/Nav";
import Hero from "../components/landing/Hero";
import Marquee from "../components/landing/Marquee";
import StatsBar from "../components/landing/StatsBar";
import WatchWorkWrap from "../components/landing/WatchWorkWrap";
import VoiceDNA from "../components/landing/VoiceDNA";
import QualityGates from "../components/landing/QualityGates";
import TwelveFormats from "../components/landing/TwelveFormats";
import AboutMark from "../components/landing/AboutMark";
import CTASection from "../components/landing/CTASection";
import Footer from "../components/landing/Footer";

export default function Index() {
  const init = useRef(false);
  useEffect(() => {
    if (init.current) return;
    init.current = true;
    const els = document.querySelectorAll(".fade-up, .fade-in");
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } });
    }, { threshold: 0.08 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return (
    <>
      <Nav />
      <Hero />
      <Marquee />
      <StatsBar />
      <WatchWorkWrap />
      <Marquee />
      <VoiceDNA />
      <QualityGates />
      <TwelveFormats />
      <AboutMark />
      <CTASection />
      <Footer />
    </>
  );
}
