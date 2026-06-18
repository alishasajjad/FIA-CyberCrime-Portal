import React from "react";
import PageMeta from "components/public/PageMeta";
import HeroSection from "components/public/sections/HeroSection";
import ServicesSection from "components/public/sections/ServicesSection";
import AwarenessSection from "components/public/sections/AwarenessSection";
import WorkflowSection from "components/public/sections/WorkflowSection";
import StatsSection from "components/public/sections/StatsSection";
import TestimonialsSection from "components/public/sections/TestimonialsSection";
import AlertsSection from "components/public/sections/AlertsSection";
import FAQSection from "components/public/sections/FAQSection";
import ContactSection from "components/public/sections/ContactSection";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Home"
        description="National Cyber Crime Reporting Portal — report cyber crimes, track complaints, and access cyber security awareness resources."
      />
      <HeroSection />
      <ServicesSection />
      <WorkflowSection />
      <StatsSection />
      <AwarenessSection />
      <AlertsSection />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection />
    </>
  );
}
