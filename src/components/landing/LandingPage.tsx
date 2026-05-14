"use client";

import { SiteHeader } from "./SiteHeader";
import { Hero } from "./Hero";
import { TrustBar } from "./TrustBar";
import { HowItWorks } from "./HowItWorks";
import { TutorShowcase } from "./TutorShowcase";
import { Features } from "./Features";
import { Testimonials } from "./Testimonials";
import { Footer } from "./Footer";

export function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <TrustBar />
        <HowItWorks />
        <TutorShowcase />
        <Features />
        <Testimonials />
        <Footer />
      </main>
    </>
  );
}
