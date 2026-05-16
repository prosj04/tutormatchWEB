"use client";

import { SiteHeader } from "./SiteHeader";
import { Hero } from "./Hero";
import { Philosophy } from "./Philosophy";
import { HowItWorks } from "./HowItWorks";
import { TutorShowcase } from "./TutorShowcase";
import { TrustBar } from "./TrustBar";
import { Testimonials } from "./Testimonials";
import { FinalCTA } from "./FinalCTA";
import { Footer } from "./Footer";

export function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Philosophy />
        <HowItWorks />
        <TutorShowcase />
        <TrustBar />
        <Testimonials />
        <FinalCTA />
        <Footer />
      </main>
    </>
  );
}
